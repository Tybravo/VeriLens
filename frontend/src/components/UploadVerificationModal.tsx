'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, setWalrusIds, setVerificationDigest as setVerificationDigestGlobal, setAttestation as setAttestationGlobal, setBadgeWalrusId as setBadgeWalrusIdGlobal, setCertificateWalrusId as setCertificateWalrusIdGlobal, resetWorkflow } from '@/store/workflow';
import { SealClient } from '@mysten/seal';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Circle, Upload, Lock, Shield, Award, FileText, AlertTriangle, Loader2, Copy, HelpCircle } from 'lucide-react';

export type WorkflowStage = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
};

export interface ProvenanceCertificate {
  title: string;
  ownerAddress: string;
  certificationDate: string;
  mediaBlobId: string;
  manifestBlobId: string;
  verificationHash: string;
  sealEncryption: boolean;
}

interface UploadVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (certificate: ProvenanceCertificate) => void;
  mediaFile: File;
  manifestFile: File;
  walletAddress: string;
  sealEncryption?: boolean;
  network: string;
}

const UploadVerificationModal: React.FC<UploadVerificationModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  mediaFile,
  manifestFile,
  walletAddress,
  sealEncryption = false,
  network,
}) => {
  const [currentStage, setCurrentStage] = useState(0);
  const createStages = (): WorkflowStage[] => {
    const arr: WorkflowStage[] = [];
    if (sealEncryption) {
      arr.push({
        id: 'seal-encryption',
        title: 'Seal Encryption',
        description: 'Encrypt content and set access controls',
        icon: Award,
        status: 'pending',
      });
    }
    arr.push(
      {
        id: 'walrus-upload',
        title: 'Upload to Walrus',
        description: 'Storing sealed media and manifest in decentralized storage',
        icon: Upload,
        status: 'pending',
      },
      {
        id: 'verification-request',
        title: 'Verification Request',
        description: 'Submitting verification request to Nautilus TEE',
        icon: Shield,
        status: 'pending',
      },
      {
        id: 'crypto-attestation',
        title: 'Cryptographic Hashing & Attestation',
        description: 'Compute hashes and build attestation via enclave',
        icon: Lock,
        status: 'pending',
      },
      {
        id: 'generate-certificate',
        title: 'Generate Certificate',
        description: 'Create certificate, validate decryption before minting',
        icon: FileText,
        status: 'pending',
      },
      {
        id: 'provenance-minting',
        title: 'Provenance Minting',
        description: 'Mint badge and certificate NFTs',
        icon: Award,
        status: 'pending',
      },
    );
    return arr;
  }
  const [stages, setStages] = useState<WorkflowStage[]>(createStages());
  const dispatch = useDispatch();
  const workflowGlobal = useSelector((s: RootState) => s.workflow);

  const [certificate, setCertificate] = useState<ProvenanceCertificate | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [walrusMediaId, setWalrusMediaId] = useState<string | null>(null);
  const [walrusManifestId, setWalrusManifestId] = useState<string | null>(null);
  const [walrusStatus, setWalrusStatus] = useState<{ media: boolean; manifest: boolean }>({ media: false, manifest: false });
  const [copied, setCopied] = useState<{ media: boolean; manifest: boolean }>({ media: false, manifest: false });
  const [copiedDetails, setCopiedDetails] = useState<{ content: boolean; manifest: boolean; code: boolean; signature: boolean; sealId: boolean; teeId: boolean }>({ content: false, manifest: false, code: false, signature: false, sealId: false, teeId: false });
  const [verificationDigest, setVerificationDigest] = useState<string | null>(null);
  const [awaitingSignature, setAwaitingSignature] = useState<boolean>(false);
  const [attestation, setAttestation] = useState<{ contentHashHex: string; manifestHashHex: string; codeHashHex: string; signatureHex: string; proverTeeId: string } | null>(null);
  const [sealInfo, setSealInfo] = useState<{ sealId: string; accessPolicy: string; threshold: number; decryptTest?: 'pending' | 'ok' | 'failed' } | null>(null);
  const [badgePreviewUrl, setBadgePreviewUrl] = useState<string | null>(null);
  const [badgeWalrusId, setBadgeWalrusId] = useState<string | null>(null);
  const [mintDigest, setMintDigest] = useState<string | null>(null);
  const [certificatePreviewUrl, setCertificatePreviewUrl] = useState<string | null>(null);
  const [certificateWalrusId, setCertificateWalrusId] = useState<string | null>(null);
  const [certificateMintDigest, setCertificateMintDigest] = useState<string | null>(null);
  const walrusCacheRef = useRef<Map<string, Uint8Array>>(new Map());
  const [sealedMedia, setSealedMedia] = useState<any>(null);
  const [sealedManifest, setSealedManifest] = useState<any>(null);
  const [softwareSeal, setSoftwareSeal] = useState<{ key: CryptoKey; ivMedia: Uint8Array; ivManifest: Uint8Array } | null>(null);
  const [manifestPlainText, setManifestPlainText] = useState<string | null>(null);
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const VERILENS_PACKAGE_ID = (process.env.NEXT_PUBLIC_VERILENS_PACKAGE_ID || '');
  const currentAccount = useCurrentAccount();

  const publisherUrl = network === 'mainnet' ? 'https://publisher.walrus.space' : 'https://publisher.walrus-testnet.walrus.space';
  const aggregatorUrl = network === 'mainnet' ? 'https://aggregator.walrus.space' : 'https://aggregator.walrus-testnet.walrus.space';
  const explorerBase = network === 'mainnet' ? 'https://walruscan.com/mainnet/blobs' : 'https://walruscan.com/testnet/blobs';
  const sealServerIdsRaw = process.env.NEXT_PUBLIC_SEAL_SERVER_IDS || '';
  const sealServerIds = sealServerIdsRaw.split(',').map((s) => s.trim()).filter(Boolean);
  const sealServerConfigs = sealServerIds.map((id) => ({ objectId: id, weight: 1 / Math.max(sealServerIds.length, 1) }));

  const TESTNET_PUBLISHERS = [
    'http://walrus-publisher-testnet.cetus.zone:9001',
    'http://walrus-publisher-testnet.haedal.xyz:9001',
    'http://walrus-publisher-testnet.suisec.tech:9001',
    'http://walrus-storage.testnet.nelrann.org:9001',
    'http://walrus-testnet.equinoxdao.xyz:9001',
    'http://walrus-testnet.suicore.com:9001',
    'http://walrus.testnet.pops.one:9001',
    'http://waltest.chainflow.io:9001',
    'https://publisher.testnet.walrus.atalma.io',
    'https://publisher.walrus-01.tududes.com',
    'https://publisher.walrus-testnet.h2o-nodes.com',
    'https://publisher.walrus-testnet.walrus.space',
    'https://publisher.walrus.banansen.dev',
    'https://sm1-walrus-testnet-publisher.stakesquid.com',
    'https://sui-walrus-testnet-publisher.bwarelabs.com',
    'https://suiftly-testnet-pub.mhax.io',
    'https://testnet-publisher-walrus.kiliglab.io',
    'https://testnet-publisher.walrus.graphyte.dev',
    'https://testnet.publisher.walrus.silentvalidator.com',
    'https://wal-publisher-testnet.staketab.org',
    'https://walrus-publish-testnet.chainode.tech:9003',
    'https://walrus-publisher-testnet.n1stake.com',
    'https://walrus-publisher-testnet.staking4all.org',
    'https://walrus-publisher.rubynodes.io',
    'https://walrus-publisher.thcloud.dev',
    'https://walrus-testnet-published.luckyresearch.org',
    'https://walrus-testnet-publisher-1.zkv.xyz',
    'https://walrus-testnet-publisher.chainbase.online',
    'https://walrus-testnet-publisher.crouton.digital',
    'https://walrus-testnet-publisher.dzdaic.com',
    'https://walrus-testnet-publisher.everstake.one',
    'https://walrus-testnet-publisher.nami.cloud',
    'https://walrus-testnet-publisher.natsai.xyz',
    'https://walrus-testnet-publisher.nodeinfra.com',
    'https://walrus-testnet-publisher.nodes.guru',
    'https://walrus-testnet-publisher.redundex.com',
    'https://walrus-testnet-publisher.rpc101.org',
    'https://walrus-testnet-publisher.stakecraft.com',
    'https://walrus-testnet-publisher.stakeengine.co.uk',
    'https://walrus-testnet-publisher.stakely.io',
    'https://walrus-testnet-publisher.stakeme.pro',
    'https://walrus-testnet-publisher.stakingdefenseleague.com',
    'https://walrus-testnet-publisher.starduststaking.com',
    'https://walrus-testnet-publisher.trusted-point.com',
    'https://walrus-testnet.blockscope.net:11444',
    'https://walrus-testnet.validators.services.kyve.network/publish',
    'https://walrus.testnet.publisher.stakepool.dev.br'
  ];

  const TESTNET_AGGREGATORS = [
    'http://cs74th801mmedkqu25ng.bdnodes.net:8443',
    'http://walrus-storage.testnet.nelrann.org:9000',
    'http://walrus-testnet.equinoxdao.xyz:9000',
    'http://walrus-testnet.suicore.com:9000',
    'https://agg.test.walrus.eosusa.io',
    'https://aggregator.testnet.walrus.atalma.io',
    'https://aggregator.testnet.walrus.mirai.cloud',
    'https://aggregator.walrus-01.tududes.com',
    'https://aggregator.walrus-testnet.h2o-nodes.com',
    'https://aggregator.walrus-testnet.walrus.space',
    'https://aggregator.walrus.banansen.dev',
    'https://aggregator.walrus.testnet.mozcomputing.dev',
    'https://sm1-walrus-testnet-aggregator.stakesquid.com',
    'https://sui-walrus-tn-aggregator.bwarelabs.com',
    'https://suiftly-testnet-agg.mhax.io',
    'https://testnet-aggregator-walrus.kiliglab.io',
    'https://testnet-aggregator.walrus.graphyte.dev',
    'https://testnet-walrus.globalstake.io',
    'https://testnet.aggregator.walrus.silentvalidator.com',
    'https://wal-aggregator-testnet.staketab.org',
    'https://walrus-agg-test.bucketprotocol.io',
    'https://walrus-agg-testnet.chainode.tech:9002',
    'https://walrus-agg.testnet.obelisk.sh',
    'https://walrus-aggregator-testnet.cetus.zone',
    'https://walrus-aggregator-testnet.haedal.xyz',
    'https://walrus-aggregator-testnet.n1stake.com',
    'https://walrus-aggregator-testnet.staking4all.org',
    'https://walrus-aggregator-testnet.suisec.tech',
    'https://walrus-aggregator.thcloud.dev',
    'https://walrus-test-aggregator.thepassivetrust.com',
    'https://walrus-testnet-aggregator-1.zkv.xyz',
    'https://walrus-testnet-aggregator.brightlystake.com',
    'https://walrus-testnet-aggregator.chainbase.online',
    'https://walrus-testnet-aggregator.chainflow.io',
    'https://walrus-testnet-aggregator.crouton.digital',
    'https://walrus-testnet-aggregator.dzdaic.com',
    'https://walrus-testnet-aggregator.everstake.one',
    'https://walrus-testnet-aggregator.luckyresearch.org',
    'https://walrus-testnet-aggregator.natsai.xyz',
    'https://walrus-testnet-aggregator.nodeinfra.com',
    'https://walrus-testnet-aggregator.nodes.guru',
    'https://walrus-testnet-aggregator.redundex.com',
    'https://walrus-testnet-aggregator.rpc101.org',
    'https://walrus-testnet-aggregator.rubynodes.io',
    'https://walrus-testnet-aggregator.stakecraft.com',
    'https://walrus-testnet-aggregator.stakeengine.co.uk',
    'https://walrus-testnet-aggregator.stakely.io',
    'https://walrus-testnet-aggregator.stakeme.pro',
    'https://walrus-testnet-aggregator.stakin-nodes.com',
    'https://walrus-testnet-aggregator.stakingdefenseleague.com',
    'https://walrus-testnet-aggregator.starduststaking.com',
    'https://walrus-testnet-aggregator.talentum.id',
    'https://walrus-testnet-aggregator.trusted-point.com',
    'https://walrus-testnet.blockscope.net',
    'https://walrus-testnet.lionscraft.blockscape.network:9000',
    'https://walrus-testnet.validators.services.kyve.network/aggregate',
    'https://walrus-testnet.veera.com',
    'https://walrus-tn.juicystake.io:9443',
    'https://walrus.testnet.aggregator.stakepool.dev.br',
    'https://walrusagg.testnet.pops.one'
  ];

  const publisherCandidates = network === 'mainnet' ? ['https://publisher.walrus.space'] : TESTNET_PUBLISHERS;
  const aggregatorCandidates = network === 'mainnet' ? ['https://aggregator.walrus.space'] : TESTNET_AGGREGATORS;

  const putWalrus = async (bytes: Uint8Array, epochs: number) => {
    const body = new Blob([new Uint8Array(bytes.buffer as ArrayBuffer)]);
    for (const base of publisherCandidates) {
      try {
        const res = await fetch(`${base}/v1/blobs?epochs=${epochs}`, { method: 'PUT', body, headers: { 'Content-Type': 'application/octet-stream' } });
        if (res.ok) {
          const json = await res.json();
          return { json, endpoint: base };
        }
      } catch {}
    }
    throw new Error('All Walrus publishers failed');
  };

  const fetchWalrusBlob = async (blobId: string) => {
    for (const base of aggregatorCandidates) {
      try {
        const res = await fetch(`${base}/v1/blobs/${blobId}`);
        if (res.ok) {
          return { res, endpoint: base };
        }
      } catch {}
    }
    throw new Error('All Walrus aggregators failed');
  };

  const renderBadgeBase = async () => {
    const img = new Image();
    img.src = '/Verilens_V_Badge.png';
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => {
      try { canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Canvas toBlob failed')), 'image/png'); } catch (e) { reject(e); }
    });
    return blob;
  };

  const renderCertificateImage = async (owner: string, mediaId?: string | null, manifestId?: string | null, attestationHash?: string | null) => {
    const w = 1200;
    const h = 800;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#0b1f33');
    g.addColorStop(1, '#1a3a5c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.font = 'bold 48px ui-sans-serif, system-ui';
    ctx.fillText('Verilens Provenance Certificate', w/2, 120);
    ctx.font = '24px ui-monospace, SFMono-Regular';
    const fmt = (s?: string | null) => {
      if (!s) return 'N/A';
      return s.length > 18 ? `${s.slice(0,9)}...${s.slice(-9)}` : s;
    };
    ctx.fillText(`Owner: ${fmt(owner)}`, w/2, 200);
    ctx.fillText(`Media: ${fmt(mediaId)}`, w/2, 250);
    ctx.fillText(`Manifest: ${fmt(manifestId)}`, w/2, 300);
    ctx.fillText(`Attestation: ${fmt(attestationHash)}`, w/2, 350);
    ctx.font = 'italic 20px ui-sans-serif';
    const d = new Date();
    ctx.fillText(`Issued ${d.toLocaleString()}`, w/2, 420);
    const blob = await new Promise<Blob>((resolve, reject) => {
      try { canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Canvas toBlob failed')), 'image/png'); } catch (e) { reject(e); }
    });
    return blob;
  };

  const ensureBlobIds = async (): Promise<{ media: string; manifest: string }> => {
    if (walrusMediaId && walrusManifestId) return { media: walrusMediaId, manifest: walrusManifestId };
    const mediaF = mediaFile;
    const manifestF = manifestFile;
    if (!mediaF || !manifestF) throw new Error('Input files missing; please restart verification from Stage 1');
    const mediaBytes = new Uint8Array(await mediaF.arrayBuffer());
    const manifestBytes = new Uint8Array(await manifestF.arrayBuffer());
    const mediaPut = await putWalrus(mediaBytes, 5);
    const mediaJson = mediaPut.json;
    const mId = mediaJson?.newlyCreated?.blobObject?.blobId || mediaJson?.newlyCreated?.blobId || mediaJson?.alreadyCertified?.blobId || mediaJson?.blobId;
    const manifestPut = await putWalrus(manifestBytes, 5);
    const manifestJson = manifestPut.json;
    const mfId = manifestJson?.newlyCreated?.blobObject?.blobId || manifestJson?.newlyCreated?.blobId || manifestJson?.alreadyCertified?.blobId || manifestJson?.blobId;
    if (!mId || !mfId) throw new Error('Blob IDs not found');
    setWalrusMediaId(mId);
    setWalrusManifestId(mfId);
    try { dispatch(setWalrusIds({ media: mId, manifest: mfId })); } catch {}
    return { media: mId, manifest: mfId };
  };

  const processWorkflow = async () => {
    setIsProcessing(true);
    setHasFailed(false);

    setCurrentStage(0);
    setStages(prev => prev.map((stage, index) => index === 0 ? { ...stage, status: 'processing', error: undefined } : stage));

    try {
      const mediaBytes = new Uint8Array(await mediaFile.arrayBuffer());
      const manifestBytes = new Uint8Array(await manifestFile.arrayBuffer());
      let sealedMediaLocal: Uint8Array | null = null;
      let sealedManifestLocal: Uint8Array | null = null;
      let uploadedEncrypted = false;

      // Stage 1: Seal encryption first (if enabled)
      if (sealEncryption) {
        const sealingIndex = stages.findIndex(s => s.id === 'seal-encryption');
        if (sealingIndex >= 0) {
          setCurrentStage(sealingIndex);
          setStages(prev => prev.map((stage, idx) => idx === sealingIndex ? { ...stage, status: 'processing', error: undefined } : stage));
          try {
            const client = new SuiClient({ url: getFullnodeUrl(network as any) });
            const sealClient = new SealClient({
              suiClient: client as any,
              serverConfigs: sealServerConfigs,
              verifyKeyServers: false,
            });
            const sealId = (crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`);
            const threshold = Number(process.env.NEXT_PUBLIC_SEAL_THRESHOLD || 2);
            const policy = 'creator-only';
            const encMedia = await sealClient.encrypt({ data: mediaBytes, threshold, id: `${sealId}-media`, packageId: '' });
            const encManifest = await sealClient.encrypt({ data: manifestBytes, threshold, id: `${sealId}-manifest`, packageId: '' });
            setSealedMedia(encMedia.encryptedObject);
            setSealedManifest(encManifest.encryptedObject);
            // Note: Sui Seal encrypted object is opaque; keep upload as original bytes for this path
            sealedMediaLocal = null;
            sealedManifestLocal = null;
            setSealInfo({ sealId, accessPolicy: policy, threshold, decryptTest: 'pending' });
            setStages(prev => prev.map((stage, idx) => idx === sealingIndex ? { ...stage, status: 'completed' } : stage));
          } catch (sealErr: any) {
            try {
              const gen = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
              const iv1 = crypto.getRandomValues(new Uint8Array(12));
              const iv2 = crypto.getRandomValues(new Uint8Array(12));
              const c1 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv1 }, gen, mediaBytes);
              const c2 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv2 }, gen, manifestBytes);
              sealedMediaLocal = new Uint8Array(c1);
              sealedManifestLocal = new Uint8Array(c2);
              setSealedMedia(sealedMediaLocal);
              setSealedManifest(sealedManifestLocal);
              setSoftwareSeal({ key: gen, ivMedia: iv1, ivManifest: iv2 });
              setSealInfo({ sealId: 'software-seal', accessPolicy: 'software-seal', threshold: 2, decryptTest: 'pending' });
              setStages(prev => prev.map((stage, idx) => idx === sealingIndex ? { ...stage, status: 'completed' } : stage));
            } catch (fallbackErr: any) {
              setStages(prev => prev.map((stage, idx) => idx === sealingIndex ? { ...stage, status: 'failed', error: fallbackErr?.message || sealErr?.message || 'Sealing failed' } : stage));
              setHasFailed(true);
              setIsProcessing(false);
              return;
            }
          }
        }
      }

      let mediaBlobId: string | undefined;
      let manifestBlobId: string | undefined;
      const uploadIndexProc = stages.findIndex(s => s.id === 'walrus-upload');
      if (uploadIndexProc >= 0) {
        setCurrentStage(uploadIndexProc);
        setStages(prev => prev.map((stage, index) => index === uploadIndexProc ? { ...stage, status: 'processing', error: undefined } : stage));
      }
      try {
        const useEncryptedMedia = !!(sealEncryption && sealedMediaLocal);
        const useEncryptedManifest = !!(sealEncryption && sealedManifestLocal);
        uploadedEncrypted = useEncryptedMedia && useEncryptedManifest;
        const mediaPart: Uint8Array = useEncryptedMedia ? sealedMediaLocal! : mediaBytes;
        const mediaPut = await putWalrus(mediaPart, 5);
        const mediaJson = mediaPut.json;
        mediaBlobId = mediaJson?.newlyCreated?.blobObject?.blobId || mediaJson?.newlyCreated?.blobId || mediaJson?.alreadyCertified?.blobId || mediaJson?.blobId;

        const manifestPart: Uint8Array = useEncryptedManifest ? sealedManifestLocal! : manifestBytes;
        const manifestPut = await putWalrus(manifestPart, 5);
        const manifestJson = manifestPut.json;
        manifestBlobId = manifestJson?.newlyCreated?.blobObject?.blobId || manifestJson?.newlyCreated?.blobId || manifestJson?.alreadyCertified?.blobId || manifestJson?.blobId;

        if (!mediaBlobId || !manifestBlobId) throw new Error('Blob IDs not found');
      } catch (uploadErr: any) {
        try {
          const fd = new FormData();
          fd.append('mediaFile', mediaFile);
          fd.append('manifestFile', manifestFile);
          fd.append('network', network);
          const apiRes = await fetch('/api/verify/submit', { method: 'POST', body: fd });
          if (!apiRes.ok) {
            let msg = 'Backend upload failed';
            try { const j = await apiRes.json(); msg = j?.message || msg } catch {}
            throw new Error(msg);
          }
          const data = await apiRes.json();
          mediaBlobId = data?.walrusMediaId;
          manifestBlobId = data?.walrusManifestId;
          if (!mediaBlobId || !manifestBlobId) throw new Error('Backend did not return Walrus blob IDs');
        } catch (backendErr: any) {
          setStages(prev => prev.map((stage, index) => index === 0 ? { ...stage, status: 'failed', error: backendErr?.message || uploadErr?.message || 'Upload error' } : stage));
          setHasFailed(true);
          setIsProcessing(false);
          return;
        }
      }

      setWalrusMediaId(mediaBlobId!);
      setWalrusManifestId(manifestBlobId!);
      dispatch(setWalrusIds({ media: mediaBlobId!, manifest: manifestBlobId! }));

      try {
        try {
          const a1 = await fetchWalrusBlob(mediaBlobId);
          const a2 = await fetchWalrusBlob(manifestBlobId);
          setWalrusStatus({ media: a1.res.ok, manifest: a2.res.ok });
        } catch {
          setWalrusStatus({ media: false, manifest: false });
        }
      } catch {}

      const uploadIndex = stages.findIndex(s => s.id === 'walrus-upload');
      setStages(prev => prev.map((stage, index) => index === uploadIndex ? { ...stage, status: 'completed' } : stage));
      const verIndex = stages.findIndex(s => s.id === 'verification-request');
      setCurrentStage(verIndex);
      setStages(prev => prev.map((stage, index) => index === verIndex ? { ...stage, status: 'processing', error: undefined } : stage));

      if (!VERILENS_PACKAGE_ID) {
        setStages(prev => prev.map((stage, index) => index === 1 && stage.id === 'verification-request' ? { ...stage, status: 'failed', error: 'Contract package ID not configured' } : stage));
        setIsProcessing(false);
        return;
      }

      try {
        setAwaitingSignature(true);
       const enc = new TextEncoder();
      const mediaIdBytes = enc.encode(mediaBlobId);
      const manifestIdBytes = enc.encode(manifestBlobId);
      const tx = new Transaction();
      tx.moveCall({
        target: `${VERILENS_PACKAGE_ID}::verilens_oracle::request_verification`,
        arguments: [
          tx.pure(bcs.vector(bcs.U8).serialize(Array.from(mediaIdBytes)).toBytes()),
          tx.pure(bcs.vector(bcs.U8).serialize(Array.from(manifestIdBytes)).toBytes())
        ],
      });
        const result: any = await signAndExecuteTransaction({ transaction: tx });
        const digest = result?.digest || result?.effects?.transactionDigest || result?.data?.digest || '';
        if (!digest || (typeof digest !== 'string') || digest.length === 0) {
          throw new Error('Verification request did not return a transaction digest');
        }
        setVerificationDigest(digest);
        dispatch(setVerificationDigestGlobal(digest));
        const verIndex2 = stages.findIndex(s => s.id === 'verification-request');
        setStages(prev => prev.map((stage, index) => index === verIndex2 ? { ...stage, status: 'completed' } : stage));
        setAwaitingSignature(false);

        // Stage 3: Cryptographic hashing & attestation via API
        const attIndex = stages.findIndex(s => s.id === 'crypto-attestation');
        setCurrentStage(attIndex);
        setStages(prev => prev.map((stage, index) => index === attIndex ? { ...stage, status: 'processing', error: undefined } : stage));
        try {
          const res = await fetch('/api/enclave/attest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mediaBlobId, manifestBlobId }),
          });
          if (!res.ok) {
            let msg = 'Attestation API error'
            try { const j = await res.json(); msg = j?.message || msg } catch {}
            throw new Error(msg)
          }
          const data = await res.json();
          // Quick validations: tx digest exists and signature/hash formats
          const client = new SuiClient({ url: getFullnodeUrl(network as any) });
          const txDigest = digest || verificationDigest || '';
          if (!txDigest) throw new Error('Missing verification digest from Stage 2');
          try {
            await client.getTransactionBlock({ digest: txDigest });
          } catch {
            throw new Error('Transaction digest not found on chain');
          }

          const isHexOfBytes = (hex: string, bytes: number) => {
            if (!hex || typeof hex !== 'string') return false
            const h = hex.startsWith('0x') ? hex.slice(2) : hex
            return /^[0-9a-fA-F]+$/.test(h) && h.length === bytes * 2
          }
          const okSig = isHexOfBytes(data.signatureHex, 64)
          const okContent = isHexOfBytes(data.contentHashHex, 32)
          const okManifest = isHexOfBytes(data.manifestHashHex, 32)
          const okCode = isHexOfBytes(data.codeHashHex, 32)
          if (!okSig || !okContent || !okManifest || !okCode) {
            throw new Error('Invalid attestation field formats')
          }

          setAttestation(data);
          dispatch(setAttestationGlobal(data));
          const attIndex2 = stages.findIndex(s => s.id === 'crypto-attestation');
          setStages(prev => prev.map((stage, index) => index === attIndex2 ? { ...stage, status: 'completed' } : stage));
        } catch (attErr: any) {
          const attIndex3 = stages.findIndex(s => s.id === 'crypto-attestation');
          setStages(prev => prev.map((stage, index) => index === attIndex3 ? { ...stage, status: 'failed', error: attErr?.message || 'Attestation failed' } : stage));
          setHasFailed(true);
          setIsProcessing(false);
          return;
        }

        // Stage 4: Generate certificate and validate decryption
        const genIndex = stages.findIndex(s => s.id === 'generate-certificate');
        setCurrentStage(genIndex);
        setStages(prev => prev.map((stage, index) => index === genIndex ? { ...stage, status: 'processing', error: undefined } : stage));
        try {
          const certBlob = await renderCertificateImage(walletAddress, mediaBlobId!, manifestBlobId!, (attestation?.contentHashHex || verificationDigest || null));
          const certUrl = URL.createObjectURL(certBlob);
          setCertificatePreviewUrl(certUrl);
          const certBuf = new Uint8Array(await certBlob.arrayBuffer());
          const put2 = await putWalrus(certBuf, 5);
          const j2 = put2.json;
          const cId = j2?.newlyCreated?.blobObject?.blobId || j2?.alreadyCertified?.blobId || j2?.blobId;
          if (!cId) throw new Error('Certificate Walrus blob ID not found');
          setCertificateWalrusId(cId);
          dispatch(setCertificateWalrusIdGlobal(cId));

          // Decrypt validation and populate manifest preview
          if (sealEncryption) {
            if (softwareSeal) {
              try {
                if (uploadedEncrypted) {
                  const encMediaFetched = await (await (await fetchWalrusBlob(mediaBlobId!)).res).arrayBuffer();
                  const encManifestFetched = await (await (await fetchWalrusBlob(manifestBlobId!)).res).arrayBuffer();
                  const decMedia = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: softwareSeal.ivMedia as unknown as BufferSource }, softwareSeal.key, encMediaFetched as unknown as BufferSource);
                  const decManifest = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: softwareSeal.ivManifest as unknown as BufferSource }, softwareSeal.key, encManifestFetched as unknown as BufferSource);
                  try { setManifestPlainText(new TextDecoder().decode(new Uint8Array(decManifest))); } catch { }
                } else {
                  const decManifest = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: softwareSeal.ivManifest as unknown as BufferSource }, softwareSeal.key, sealedManifestLocal!.buffer as unknown as BufferSource);
                  try { setManifestPlainText(new TextDecoder().decode(new Uint8Array(decManifest))); } catch { }
                }
                setSealInfo(prev => prev ? { ...prev, decryptTest: 'ok' } : { sealId: 'software-seal', accessPolicy: 'software-seal', threshold: 2, decryptTest: 'ok' });
              } catch {
                setSealInfo(prev => prev ? { ...prev, decryptTest: 'failed' } : { sealId: 'software-seal', accessPolicy: 'software-seal', threshold: 2, decryptTest: 'failed' });
              }
            } else {
              const client = new SuiClient({ url: getFullnodeUrl(network as any) });
              const sealClient = new SealClient({
                suiClient: client as any,
                serverConfigs: sealServerConfigs,
                verifyKeyServers: false,
              });
              try {
                await sealClient.decrypt(sealedMedia);
                const decMan: any = await sealClient.decrypt(sealedManifest);
                try { setManifestPlainText(new TextDecoder().decode(decMan instanceof Uint8Array ? decMan : new Uint8Array(decMan))); } catch { }
                setSealInfo(prev => prev ? { ...prev, decryptTest: 'ok' } : { sealId: '', accessPolicy: 'creator-only', threshold: 2, decryptTest: 'ok' });
              } catch {
                setSealInfo(prev => prev ? { ...prev, decryptTest: 'failed' } : { sealId: '', accessPolicy: 'creator-only', threshold: 2, decryptTest: 'failed' });
              }
            }
          } else {
            try {
              const plain = await (await (await fetchWalrusBlob(manifestBlobId!)).res).arrayBuffer();
              try { setManifestPlainText(new TextDecoder().decode(new Uint8Array(plain))); } catch {}
            } catch {}
          }
          setStages(prev => prev.map((stage, index) => index === genIndex ? { ...stage, status: 'completed' } : stage));
        } catch (genErr: any) {
          setStages(prev => prev.map((stage, index) => index === genIndex ? { ...stage, status: 'failed', error: genErr?.message || 'Certificate generation failed' } : stage));
          setHasFailed(true);
          setIsProcessing(false);
          return;
        }
      } catch (e: any) {
        setStages(prev => prev.map((stage, index) => index === 1 && stage.id === 'verification-request' ? { ...stage, status: 'failed', error: e?.message || 'Verification request failed' } : stage));
        setHasFailed(true);
        setIsProcessing(false);
        return;
      }

      // Stage 5: Provenance minting
      const mintIndex = stages.findIndex(s => s.id === 'provenance-minting');
      setCurrentStage(mintIndex);
      setStages(prev => prev.map((s, i) => i === mintIndex ? { ...s, status: 'processing', error: undefined } : s));

      try {
        let mediaIdUse = walrusMediaId || workflowGlobal.walrusMediaId;
        let manifestIdUse = walrusManifestId || workflowGlobal.walrusManifestId;
        if (!mediaIdUse || !manifestIdUse) {
          const ensured = await ensureBlobIds();
          mediaIdUse = ensured.media;
          manifestIdUse = ensured.manifest;
        }
        const badgeBlob = await renderBadgeBase();
        const badgeUrl = URL.createObjectURL(badgeBlob);
        setBadgePreviewUrl(badgeUrl);
        const buf = new Uint8Array(await badgeBlob.arrayBuffer());
        const put = await putWalrus(buf, 5);
        const j = put.json;
        const bId = j?.newlyCreated?.blobObject?.blobId || j?.alreadyCertified?.blobId || j?.blobId;
        if (!bId) throw new Error('Badge Walrus blob ID not found');
        setBadgeWalrusId(bId);
        dispatch(setBadgeWalrusIdGlobal(bId));

        // Initialize display metadata (safe to attempt; ignore errors if already set)
        // Attempt on-chain mint
        try {
          const tx = new Transaction();
          const aggregatorLink = `${aggregatorUrl}/v1/blobs/${bId}`;
          const badgeUID = (crypto?.randomUUID?.() || `badge_${Date.now()}_${Math.random().toString(36).slice(2,6)}`);
          const meta = { ownerAddress: walletAddress, ownerUID: badgeUID, mediaBlobId: mediaIdUse, manifestBlobId: manifestIdUse, verificationDigest: verificationDigest, attestationHash: attestation?.contentHashHex || '', badgeBlobId: bId, badgeUrl: aggregatorLink, sealEncryption };
          tx.moveCall({
            target: `${VERILENS_PACKAGE_ID}::verilens_oracle::mint_provenance_nft`,
            arguments: [
              tx.pure.address(walletAddress),
              tx.pure.string('Verilens Provenance Badge'),
              tx.pure.string(aggregatorLink),
              tx.pure.string(JSON.stringify(meta))
            ]
          });
          const res: any = await signAndExecuteTransaction({ transaction: tx });
          const digest = res?.digest || res?.effects?.transactionDigest || res?.data?.digest || '';
          if (digest) setMintDigest(digest);
        } catch (mintErr: any) {
          // Non-blocking: show badge and continue even if mint fails
          console.error('Minting error:', mintErr);
        }

        try {
          let cId = certificateWalrusId || null;
          if (!cId) {
            const certBlob = await renderCertificateImage(walletAddress, mediaIdUse, manifestIdUse, (attestation?.contentHashHex || verificationDigest || null));
            const certBuf = new Uint8Array(await certBlob.arrayBuffer());
            const putCert = await fetch(`${publisherUrl}/v1/blobs?epochs=5`, { method: 'PUT', body: new Blob([new Uint8Array(certBuf.buffer as ArrayBuffer)]), headers: { 'Content-Type': 'application/octet-stream' } });
            if (!putCert.ok) throw new Error('Certificate upload failed');
            const jc = await putCert.json();
            cId = jc?.newlyCreated?.blobObject?.blobId || jc?.alreadyCertified?.blobId || jc?.blobId;
            if (!cId) throw new Error('Certificate Walrus blob ID not found');
            setCertificateWalrusId(cId);
          }
          const tx2 = new Transaction();
          const certLink = `${aggregatorUrl}/v1/blobs/${cId}`;
          const ownerAddr = (currentAccount?.address || walletAddress);
          const certMeta = { type: 'certificate', ownerAddress: ownerAddr, mediaBlobId: mediaIdUse, manifestBlobId: manifestIdUse, verificationDigest: verificationDigest, attestationHash: attestation?.contentHashHex || '', certificateBlobId: cId, certificateUrl: certLink };
          tx2.moveCall({
            target: `${VERILENS_PACKAGE_ID}::verilens_oracle::mint_certificate_nft`,
            arguments: [
              tx2.pure.address(ownerAddr),
              tx2.pure.string('Verilens Provenance Certificate'),
              tx2.pure.string(certLink),
              tx2.pure.string(JSON.stringify(certMeta))
            ]
          });
          const res2: any = await signAndExecuteTransaction({ transaction: tx2 });
          const digest2 = res2?.digest || res2?.effects?.transactionDigest || res2?.data?.digest || '';
          if (!digest2) throw new Error('Certificate mint failed: no transaction digest');
          setCertificateMintDigest(digest2);
        } catch (e: any) {
          setStages(prev => prev.map((s, i) => i === mintIndex ? { ...s, status: 'failed', error: e?.message || 'Certificate minting failed' } : s));
          setHasFailed(true);
          setIsProcessing(false);
          return;
        }

        setStages(prev => prev.map((s, i) => i === mintIndex ? { ...s, status: 'completed' } : s));
      } catch (mintingErr: any) {
        setStages(prev => prev.map((s, i) => i === mintIndex ? { ...s, status: 'failed', error: mintingErr?.message || 'Provenance minting failed' } : s));
        setHasFailed(true);
        setIsProcessing(false);
        return;
      }

      setIsProcessing(false);

    } catch (error) {
      setStages(prev => prev.map((stage, index) => index === 0 ? { ...stage, status: 'failed', error: error instanceof Error ? error.message : 'Upload error' } : stage));
      setHasFailed(true);
      setIsProcessing(false);
    }
  };

  const startedRef = useRef(false)
  useEffect(() => {
    if (isOpen && !startedRef.current) {
      startedRef.current = true
      setStages(createStages())
      processWorkflow();
    }
    if (!isOpen) {
      startedRef.current = false
    }
  }, [isOpen]);

  const handleRetry = () => {
    const failedIndex = stages.findIndex(s => s.status === 'failed');
    const startIndex = failedIndex >= 0 ? failedIndex : 0;
    setHasFailed(false);
    setStages(prev => prev.map((stage, idx) => idx < startIndex ? stage : ({ ...stage, status: idx === startIndex ? 'pending' : 'pending', error: undefined })));
    setCurrentStage(startIndex);
    const failedId = failedIndex >= 0 ? stages[failedIndex].id : stages[0].id;
    const runStage = async () => {
      if (failedId === 'walrus-upload') {
        // restart full workflow
        await processWorkflow();
        return;
      }
      if (failedId === 'verification-request') {
        // rerun stage 2 onwards
        try {
          const enc = new TextEncoder();
          const mediaIdBytes = enc.encode(walrusMediaId!);
          const manifestIdBytes = enc.encode(walrusManifestId!);
          const tx = new Transaction();
          tx.moveCall({ 
            target: `${VERILENS_PACKAGE_ID}::verilens_oracle::request_verification`, 
            arguments: [
              tx.pure(bcs.vector(bcs.U8).serialize(Array.from(mediaIdBytes)).toBytes()),
              tx.pure(bcs.vector(bcs.U8).serialize(Array.from(manifestIdBytes)).toBytes())
            ] 
          });
          setAwaitingSignature(true);
          const result: any = await signAndExecuteTransaction({ transaction: tx });
          const digest = result?.digest || result?.effects?.transactionDigest || result?.data?.digest || '';
          setAwaitingSignature(false);
          if (!digest) throw new Error('Verification request did not return a transaction digest');
          setVerificationDigest(digest);
          setStages(prev => prev.map((s, i) => i === startIndex ? { ...s, status: 'completed' } : s));
          // continue to stage 3
          await processWorkflow();
        } catch (e: any) {
          setStages(prev => prev.map((s, i) => i === startIndex ? { ...s, status: 'failed', error: e?.message || 'Verification request failed' } : s));
          setHasFailed(true);
        }
        return;
      }
      if (failedId === 'crypto-attestation') {
        // rerun stage 3 and onward
        try {
          const res = await fetch('/api/enclave/attest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mediaBlobId: walrusMediaId, manifestBlobId: walrusManifestId }) });
          if (!res.ok) {
            let msg = 'Attestation API error';
            try { const j = await res.json(); msg = j?.message || msg } catch {}
            throw new Error(msg);
          }
          const data = await res.json();
          setAttestation(data);
          setStages(prev => prev.map((s, i) => i === startIndex ? { ...s, status: 'completed' } : s));
          // continue to stage 4 if enabled
          await processWorkflow();
        } catch (e: any) {
          setStages(prev => prev.map((s, i) => i === startIndex ? { ...s, status: 'failed', error: e?.message || 'Attestation failed' } : s));
          setHasFailed(true);
        }
        return;
      }
      if (failedId === 'generate-certificate') {
        // rerun sealing only
        try {
          // reuse sealing block via processWorkflow after marking stage 3 completed
          await processWorkflow();
        } catch {}
        return;
      }
      if (failedId === 'provenance-minting') {
        try {
          setStages(prev => prev.map((s, i) => i === startIndex ? { ...s, status: 'processing', error: undefined } : s));
          let mediaIdUse = walrusMediaId || workflowGlobal.walrusMediaId;
          let manifestIdUse = walrusManifestId || workflowGlobal.walrusManifestId;
          if (!mediaIdUse || !manifestIdUse) {
            const ensured = await ensureBlobIds();
            mediaIdUse = ensured.media;
            manifestIdUse = ensured.manifest;
          }
          const badgeBlob = await renderBadgeBase();
          const badgeUrl = URL.createObjectURL(badgeBlob);
          setBadgePreviewUrl(badgeUrl);
          const buf = new Uint8Array(await badgeBlob.arrayBuffer());
          const put = await putWalrus(buf, 5);
          const j = put.json;
          const bId = j?.newlyCreated?.blobObject?.blobId || j?.alreadyCertified?.blobId || j?.blobId;
          if (!bId) throw new Error('Badge Walrus blob ID not found');
          setBadgeWalrusId(bId);
          try {
            const tx = new Transaction();
            const aggregatorLink = `${aggregatorUrl}/v1/blobs/${bId}`;
            const badgeUID = (crypto?.randomUUID?.() || `badge_${Date.now()}_${Math.random().toString(36).slice(2,6)}`);
            const meta = { ownerAddress: walletAddress, ownerUID: badgeUID, mediaBlobId: mediaIdUse, manifestBlobId: manifestIdUse, verificationDigest: verificationDigest, badgeBlobId: bId, badgeUrl: aggregatorLink, sealEncryption };
            tx.moveCall({
              target: `${VERILENS_PACKAGE_ID}::verilens_oracle::mint_provenance_nft`,
              arguments: [
                  tx.pure.address(walletAddress),
                  tx.pure.string('Verilens Provenance Badge'),
                  tx.pure.string(aggregatorLink),
                  tx.pure.string(JSON.stringify(meta))
              ]
            });
            const res: any = await signAndExecuteTransaction({ transaction: tx });
            const digest = res?.digest || res?.effects?.transactionDigest || res?.data?.digest || '';
            if (digest) setMintDigest(digest);
          } catch {}
          const certBlob = await renderCertificateImage(walletAddress, mediaIdUse, manifestIdUse, verificationDigest || null);
          const certUrl = URL.createObjectURL(certBlob);
          setCertificatePreviewUrl(certUrl);
          const certBuf = new Uint8Array(await certBlob.arrayBuffer());
          const put2 = await putWalrus(certBuf, 5);
          const j2 = put2.json;
          const cId = j2?.newlyCreated?.blobObject?.blobId || j2?.alreadyCertified?.blobId || j2?.blobId;
          if (!cId) throw new Error('Certificate Walrus blob ID not found');
          setCertificateWalrusId(cId);
          try {
            const tx2 = new Transaction();
            const certLink = `${aggregatorUrl}/v1/blobs/${cId}`;
            const ownerAddr = (currentAccount?.address || walletAddress);
            const certMeta = { type: 'certificate', ownerAddress: ownerAddr, mediaBlobId: mediaIdUse, manifestBlobId: manifestIdUse, verificationDigest: verificationDigest, attestationHash: attestation?.contentHashHex || '', certificateBlobId: cId, certificateUrl: certLink };
            tx2.moveCall({
              target: `${VERILENS_PACKAGE_ID}::verilens_oracle::mint_certificate_nft`,
              arguments: [
                tx2.pure.address(ownerAddr),
                tx2.pure.string('Verilens Provenance Certificate'),
                tx2.pure.string(certLink),
                tx2.pure.string(JSON.stringify(certMeta))
              ]
            });
            const res2: any = await signAndExecuteTransaction({ transaction: tx2 });
            const digest2 = res2?.digest || res2?.effects?.transactionDigest || res2?.data?.digest || '';
            if (digest2) setCertificateMintDigest(digest2);
          } catch {}
          setStages(prev => prev.map((s, i) => i === startIndex ? { ...s, status: 'completed' } : s));
        } catch (e: any) {
          setStages(prev => prev.map((s, i) => i === startIndex ? { ...s, status: 'failed', error: e?.message || 'Provenance minting failed' } : s));
          setHasFailed(true);
        }
        return;
      }
      // default
      await processWorkflow();
    };
    runStage();
  };

  const getStageIcon = (stage: WorkflowStage, index: number) => {
    const Icon = stage.icon;
    
    if (stage.status === 'completed') {
      return (
        <div className={`relative ${index === stages.length - 1 ? 'text-[#B667F1]' : 'text-green-500'}`}>
          <CheckCircle className="w-8 h-8" />
          {index === stages.length - 1 && (
            <div className="absolute inset-0 animate-pulse">
              <CheckCircle className="w-8 h-8 text-[#B667F1] opacity-40" />
            </div>
          )}
        </div>
      );
    }
    
    if (stage.status === 'processing') {
      return (
        <div className="relative">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <Icon className="w-4 h-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
        </div>
      );
    }
    
    if (stage.status === 'failed') {
      return <AlertTriangle className="w-8 h-8 text-red-500" />;
    }
    
    return <Circle className="w-8 h-8 text-gray-500" />;
  };

  const getConnectingLine = (index: number) => {
    if (index === stages.length - 1) return null;
    const currentCompleted = stages[index].status === 'completed';
    const nextCompleted = stages[index + 1].status === 'completed';
    if (!currentCompleted || !nextCompleted) return null;
    return (
      <div className="hidden md:block absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-[200%] px-8">
        <div className="h-0.5 bg-green-500 w-full" />
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-[3000] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-gray-900 border border-cyan-400/30 rounded-2xl p-4 md:p-8 w-full md:max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-[#0083D4] mb-2">
                  Verilens Authenticity Verification
                </h2>
                <p className="text-gray-400">
                  Processing your content through the complete Verilens truth engine workflow
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Workflow Stages */}
            <div className="space-y-8">
              {/* Desktop Layout - Horizontal */}
              <div className="hidden md:flex justify-between items-start relative">
                {stages.map((stage, index) => (
                  <div key={stage.id} className="flex flex-col items-center text-center flex-1 relative">
                    <div className="mb-4 relative flex items-center justify-center">
                      {getStageIcon(stage, index)}
                      {getConnectingLine(index)}
                    </div>
                    <h3 className={`font-semibold mb-2 ${
                      stage.status === 'completed' ? (index === stages.length - 1 ? 'text-purple-400' : 'text-green-400') :
                      stage.status === 'processing' ? 'text-primary' :
                      stage.status === 'failed' ? 'text-red-400' : 'text-gray-500'
                    }`}>
                      {stage.title}
                    </h3>
                    <p className="text-sm text-gray-400 max-w-[150px]">
                      {stage.description}
                    </p>
                    
                  </div>
                ))}
              </div>

              {/* Mobile Layout - Vertical */}
              <div className="md:hidden space-y-6">
                {stages.map((stage, index) => (
                  <div key={stage.id} className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      {getStageIcon(stage, index)}
                      {index < stages.length - 1 && (
                        <div className={`w-0.5 h-16 -mt-4 transition-all duration-500 ${
                          stage.status === 'failed' ? 'bg-red-500' :
                          stages[index + 1].status === 'completed' ? (index === stages.length - 2 ? 'bg-purple-400' : 'bg-green-500') :
                          stage.status === 'processing' || stage.status === 'completed' ? 'bg-primary animate-pulse' : 'bg-gray-600'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-1 ${
                        stage.status === 'completed' ? (index === stages.length - 1 ? 'text-purple-400' : 'text-green-400') :
                        stage.status === 'processing' ? 'text-primary' :
                        stage.status === 'failed' ? 'text-red-400' : 'text-gray-500'
                      }`}>
                        {stage.title}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {stage.description}
                      </p>
                      {stage.error && (
                        <p className="text-xs text-red-400 mt-1">{stage.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error State */}
            {hasFailed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-red-900/20 border border-red-500/30 rounded-xl"
              >
                <div className="flex items-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
                  <h3 className="text-lg font-semibold text-red-400">Verification Failed</h3>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-gray-300">
                    The verification process encountered an error. You can retry the process or close this modal.
                  </p>
                  <p className="text-sm text-red-300">
                    {(stages.find(s => s.status === 'failed')?.error) || ''}
                  </p>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-primary hover:bg-primary/80 rounded-lg text-white font-medium transition-colors"
                  >
                    Retry Verification
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-600 hover:border-gray-500 rounded-lg text-gray-300 font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}

            {walrusMediaId && walrusManifestId && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-gray-800 border border-cyan-400/30 rounded-xl"
              >
                <div className="flex items-center mb-4">
                  <Upload className="w-6 h-6 text-primary mr-3" />
                  <h3 className="text-lg font-semibold text-primary">Walrus Blob IDs</h3>
                </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Media Blob ID:</span>
                        <div className="flex items-start justify-end space-x-2 ml-auto w-full md:w-[75%]">
                      <a href={`${explorerBase}/${walrusMediaId}`} target="_blank" rel="noopener noreferrer" className={`font-mono ${walrusStatus.media ? 'text-green-300' : 'text-yellow-300'} break-all text-right flex-1`}>{walrusMediaId}</a>
                      <button
                        onClick={() => { navigator.clipboard?.writeText(walrusMediaId || ''); setCopied(prev => ({ ...prev, media: true })); setTimeout(() => setCopied(prev => ({ ...prev, media: false })), 1500); }}
                        className="p-1 rounded hover:bg-gray-700 text-gray-300"
                        aria-label="Copy media blob ID"
                      >
                        {copied.media ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Manifest Blob ID:</span>
                        <div className="flex items-start justify-end space-x-2 ml-auto w-full md:w-[75%]">
                      <a href={`${explorerBase}/${walrusManifestId}`} target="_blank" rel="noopener noreferrer" className={`font-mono ${walrusStatus.manifest ? 'text-green-300' : 'text-yellow-300'} break-all text-right flex-1`}>{walrusManifestId}</a>
                      <button
                        onClick={() => { navigator.clipboard?.writeText(walrusManifestId || ''); setCopied(prev => ({ ...prev, manifest: true })); setTimeout(() => setCopied(prev => ({ ...prev, manifest: false })), 1500); }}
                        className="p-1 rounded hover:bg-gray-700 text-gray-300"
                        aria-label="Copy manifest blob ID"
                      >
                        {copied.manifest ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                        </div>
                      </div>
                  {currentStage === 1 && awaitingSignature && (
                    <div className="mt-4 flex items-center text-gray-300">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Waiting for wallet signature...</span>
                    </div>
                  )}
                  {attestation && (
                    <div className="mt-12">
                      <div className="flex items-center mb-3">
                        <Lock className="w-5 h-5 text-secondary mr-2" />
                        <h4 className="text-md font-semibold text-secondary">Attestation Details</h4>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Content Hash:</span>
                          <div className="flex items-start justify-end space-x-2 ml-auto w-full md:w-[75%]">
                            <span className="font-mono text-gray-200 break-all text-right flex-1">{attestation.contentHashHex}</span>
                            <button onClick={() => { navigator.clipboard?.writeText(attestation.contentHashHex); setCopiedDetails(prev => ({ ...prev, content: true })); setTimeout(() => setCopiedDetails(prev => ({ ...prev, content: false })), 1500); }} className="p-1 rounded hover:bg-gray-700 text-gray-300">{copiedDetails.content ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}</button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Manifest Hash:</span>
                          <div className="flex items-start justify-end space-x-2 ml-auto w-full md:w-[75%]">
                            <span className="font-mono text-gray-200 break-all text-right flex-1">{attestation.manifestHashHex}</span>
                            <button onClick={() => { navigator.clipboard?.writeText(attestation.manifestHashHex); setCopiedDetails(prev => ({ ...prev, manifest: true })); setTimeout(() => setCopiedDetails(prev => ({ ...prev, manifest: false })), 1500); }} className="p-1 rounded hover:bg-gray-700 text-gray-300">{copiedDetails.manifest ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}</button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Code Hash:</span>
                          <div className="flex items-start justify-end space-x-2 ml-auto w-full md:w-[75%]">
                            <span className="font-mono text-gray-200 break-all text-right flex-1">{attestation.codeHashHex}</span>
                            <button onClick={() => { navigator.clipboard?.writeText(attestation.codeHashHex); setCopiedDetails(prev => ({ ...prev, code: true })); setTimeout(() => setCopiedDetails(prev => ({ ...prev, code: false })), 1500); }} className="p-1 rounded hover:bg-gray-700 text-gray-300">{copiedDetails.code ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}</button>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-400">Signature:</span>
                          <div className="flex items-start justify-end space-x-2 ml-auto w-full md:w-[75%]">
                            <span className="font-mono text-gray-200 max-w-[70%] md:max-w-[75%] break-all text-right">{attestation.signatureHex}</span>
                            <button onClick={() => { navigator.clipboard?.writeText(attestation.signatureHex); setCopiedDetails(prev => ({ ...prev, signature: true })); setTimeout(() => setCopiedDetails(prev => ({ ...prev, signature: false })), 1500); }} className="p-1 rounded hover:bg-gray-700 text-gray-300">{copiedDetails.signature ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}</button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">TEE ID:</span>
                          <div className="flex items-start justify-end space-x-2 ml-auto w-[70%] md:w-[75%]">
                            <span className="font-mono text-gray-200 break-all text-right flex-1">{attestation.proverTeeId}</span>
                            <button onClick={() => { navigator.clipboard?.writeText(attestation.proverTeeId); setCopiedDetails(prev => ({ ...prev, teeId: true })); setTimeout(() => setCopiedDetails(prev => ({ ...prev, teeId: false })), 1500); }} className="p-1 rounded hover:bg-gray-700 text-gray-300">{copiedDetails.teeId ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}</button>
                          </div>
                        </div>
                        {sealInfo && (
                          <>
                            <div className="mt-6 flex items-center justify-between">
                              <span className="text-gray-400">Seal Access Key ID:</span>
                              <div className="flex items-start justify-end space-x-2 ml-auto w-full md:w-[75%]">
                                <span className="font-mono text-gray-200 break-all text-right flex-1">{sealInfo.accessPolicy === 'creator-only' ? (process.env.NEXT_PUBLIC_SEAL_SERVER_IDS || '') : sealInfo.sealId}</span>
                                <button onClick={() => { const v = sealInfo.accessPolicy === 'creator-only' ? (process.env.NEXT_PUBLIC_SEAL_SERVER_IDS || '') : sealInfo.sealId; navigator.clipboard?.writeText(v); setCopiedDetails(prev => ({ ...prev, sealId: true })); setTimeout(() => setCopiedDetails(prev => ({ ...prev, sealId: false })), 1500); }} className="p-1 rounded hover:bg-gray-700 text-gray-300">{copiedDetails.sealId ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}</button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Policy / Threshold:</span>
                              <span className="font-mono text-gray-200">{sealInfo.accessPolicy} / {sealInfo.threshold}</span>
                            </div>
                          </>
                        )}
                        {badgePreviewUrl && (
                          <div className="mt-8">
                            <div className="flex items-center mb-3">
                              <Award className="w-5 h-5 text-[#B667F1] mr-2" />
                              <h4 className="text-md font-semibold text-[#B667F1]">Minted Provenance Badge</h4>
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                              <div className="md:col-span-1 bg-gray-900 rounded-lg p-3 border border-[#B667F1]/30">
                                <img src={badgePreviewUrl} alt="Verilens Badge" className="w-full h-auto rounded" />
                                {mintDigest && (
                                  <p className="mt-2 text-xs text-gray-400">Mint Tx: <span className="font-mono break-all">{mintDigest}</span></p>
                                )}
                                {attestation?.contentHashHex && (
                                  <p className="mt-1 text-xs text-gray-400">Attestation: <span className="font-mono break-all">{attestation.contentHashHex}</span></p>
                                )}
                                {badgeWalrusId && (
                                  <p className="mt-1 text-xs text-gray-400">Badge Blob ID: <span className="font-mono break-all">{badgeWalrusId}</span></p>
                                )}
                              </div>
                              <div className="md:col-span-1 bg-gray-900 rounded-lg p-3 border border-cyan-400/30">
                                <h5 className="text-sm font-semibold text-cyan-300 mb-2">Original Media</h5>
                                <img src={`${aggregatorUrl}/v1/blobs/${walrusMediaId}`} alt="Original Media" className="w-full h-auto rounded" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                                <a href={`${aggregatorUrl}/v1/blobs/${walrusMediaId}`} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-300 underline">Open media</a>
                              </div>
                              <div className="md:col-span-1 bg-gray-900 rounded-lg p-3 border border-blue-400/30">
                                <h5 className="text-sm font-semibold text-blue-300 mb-2">Manifest</h5>
                                <a href={`${aggregatorUrl}/v1/blobs/${walrusManifestId}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-300 underline">Open manifest</a>
                                {manifestPlainText ? (
                                  <pre className="mt-2 text-xs bg-gray-800 p-3 rounded overflow-y-auto max-h-48 text-white whitespace-pre-wrap break-words">
                                    {manifestPlainText}
                                  </pre>
                                ) : (
                                  <button
                                    onClick={async () => {
                                      try {
                                        const r = await fetchWalrusBlob(walrusManifestId!);
                                        const buf = await r.res.arrayBuffer();
                                        const text = new TextDecoder().decode(new Uint8Array(buf));
                                        setManifestPlainText(text);
                                      } catch {}
                                    }}
                                    className="mt-2 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                                  >
                                    Load manifest
                                  </button>
                                )}
                              </div>
                            </div>
                            {certificatePreviewUrl && (
                              <div className="mt-8">
                                <div className="flex items-center mb-3">
                                  <Award className="w-5 h-5 text-green-400 mr-2" />
                                  <h4 className="text-md font-semibold text-green-400">Minted Provenance Certificate</h4>
                                </div>
                                <div className="grid md:grid-cols-3 gap-4">
                                  <div className="md:col-span-1 bg-gray-900 rounded-lg p-3 border border-green-400/30">
                                    <img src={certificatePreviewUrl} alt="Verilens Certificate" className="w-full h-auto rounded" />
                                    {certificateMintDigest && (
                                      <p className="mt-2 text-xs text-gray-400">Mint Tx: <span className="font-mono break-all">{certificateMintDigest}</span></p>
                                    )}
                                    {certificateWalrusId && (
                                      <p className="mt-1 text-xs text-gray-400">Certificate Blob ID: <span className="font-mono break-all">{certificateWalrusId}</span></p>
                                    )}
                                  </div>
                                  <div className="md:col-span-2 bg-gray-900 rounded-lg p-3 border border-gray-700/30">
                                    <h5 className="text-sm font-semibold text-gray-300 mb-2">Certificate Details</h5>
                                    <div className="text-xs text-gray-300 space-y-1">
                                      <div>Owner: <span className="font-mono break-all">{walletAddress}</span></div>
                                      <div>Media: <span className="font-mono break-all">{walrusMediaId}</span></div>
                                      <div>Manifest: <span className="font-mono break-all">{walrusManifestId}</span></div>
                                      <div>Verification: <span className="font-mono break-all">{attestation?.contentHashHex || verificationDigest}</span></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Processing Indicator */}
            {isProcessing && !hasFailed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 text-center"
              >
                <div className="inline-flex items-center space-x-2 text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing verification workflow...</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadVerificationModal;
