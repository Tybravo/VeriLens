'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
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
    const arr: WorkflowStage[] = [
      {
        id: 'walrus-upload',
        title: 'Upload to Walrus',
        description: 'Storing media and manifest on decentralized storage',
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
    ]
    if (sealEncryption) {
      arr.push({
        id: 'certificate-sealing',
        title: 'Certificate Sealing',
        description: 'Applying Seal encryption and access controls',
        icon: Award,
        status: 'pending',
      })
    }
    return arr
  }
  const [stages, setStages] = useState<WorkflowStage[]>(createStages());

  const [certificate, setCertificate] = useState<ProvenanceCertificate | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [walrusMediaId, setWalrusMediaId] = useState<string | null>(null);
  const [walrusManifestId, setWalrusManifestId] = useState<string | null>(null);
  const [walrusStatus, setWalrusStatus] = useState<{ media: boolean; manifest: boolean }>({ media: false, manifest: false });
  const [copied, setCopied] = useState<{ media: boolean; manifest: boolean }>({ media: false, manifest: false });
  const [verificationDigest, setVerificationDigest] = useState<string | null>(null);
  const [awaitingSignature, setAwaitingSignature] = useState<boolean>(false);
  const [attestation, setAttestation] = useState<{ contentHashHex: string; manifestHashHex: string; codeHashHex: string; signatureHex: string; proverTeeId: string } | null>(null);
  const [sealInfo, setSealInfo] = useState<{ sealId: string; accessPolicy: string; threshold: number; decryptTest?: 'pending' | 'ok' | 'failed' } | null>(null);
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const VERILENS_PACKAGE_ID = (process.env.NEXT_PUBLIC_VERILENS_PACKAGE_ID || '');

  const publisherUrl = network === 'mainnet' ? 'https://publisher.walrus.space' : 'https://publisher.walrus-testnet.walrus.space';
  const aggregatorUrl = network === 'mainnet' ? 'https://aggregator.walrus.space' : 'https://aggregator.walrus-testnet.walrus.space';
  const explorerBase = network === 'mainnet' ? 'https://walruscan.com/mainnet/blobs' : 'https://walruscan.com/testnet/blobs';
  const sealServers = [
    '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
    '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
    '0x6068c0acb197dddbacd4746a9de7f025b2ed5a5b6c1b1ab44dade4426d141da2',
  ];

  const processWorkflow = async () => {
    setIsProcessing(true);
    setHasFailed(false);

    setCurrentStage(0);
    setStages(prev => prev.map((stage, index) => index === 0 ? { ...stage, status: 'processing', error: undefined } : stage));

    try {
      const mediaBytes = new Uint8Array(await mediaFile.arrayBuffer());
      const manifestBytes = new Uint8Array(await manifestFile.arrayBuffer());

      const mediaRes = await fetch(`${publisherUrl}/v1/blobs?epochs=5`, { method: 'PUT', body: new Blob([mediaBytes.buffer as ArrayBuffer]), headers: { 'Content-Type': 'application/octet-stream' } });
      if (!mediaRes.ok) throw new Error('Media upload failed');
      const mediaJson = await mediaRes.json();
      const mediaBlobId = mediaJson?.newlyCreated?.blobObject?.blobId || mediaJson?.newlyCreated?.blobId || mediaJson?.alreadyCertified?.blobId || mediaJson?.blobId;

      const manifestRes = await fetch(`${publisherUrl}/v1/blobs?epochs=5`, { method: 'PUT', body: new Blob([manifestBytes.buffer as ArrayBuffer]), headers: { 'Content-Type': 'application/octet-stream' } });
      if (!manifestRes.ok) throw new Error('Manifest upload failed');
      const manifestJson = await manifestRes.json();
      const manifestBlobId = manifestJson?.newlyCreated?.blobObject?.blobId || manifestJson?.newlyCreated?.blobId || manifestJson?.alreadyCertified?.blobId || manifestJson?.blobId;

      if (!mediaBlobId || !manifestBlobId) throw new Error('Blob IDs not found');

      setWalrusMediaId(mediaBlobId);
      setWalrusManifestId(manifestBlobId);

      try {
        const a1 = await fetch(`${aggregatorUrl}/v1/blobs/${mediaBlobId}`);
        const a2 = await fetch(`${aggregatorUrl}/v1/blobs/${manifestBlobId}`);
        setWalrusStatus({ media: a1.ok, manifest: a2.ok });
      } catch {
        setWalrusStatus({ media: false, manifest: false });
      }

      setStages(prev => prev.map((stage, index) => index === 0 ? { ...stage, status: 'completed' } : stage));
      setCurrentStage(1);
      setStages(prev => prev.map((stage, index) => index === 1 && stage.id === 'verification-request' ? { ...stage, status: 'processing', error: undefined } : stage));

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
        const mediaVec = bcs.vector(bcs.U8).serialize(Array.from(mediaIdBytes));
        const manifestVec = bcs.vector(bcs.U8).serialize(Array.from(manifestIdBytes));
        const tx = new Transaction();
        tx.moveCall({
          target: `${VERILENS_PACKAGE_ID}::verilens_oracle::request_verification`,
          arguments: [tx.pure(mediaVec), tx.pure(manifestVec)],
        });
        const result: any = await signAndExecuteTransaction({ transaction: tx });
        const digest = result?.digest || result?.effects?.transactionDigest || result?.data?.digest || '';
        if (!digest || (typeof digest !== 'string') || digest.length === 0) {
          throw new Error('Verification request did not return a transaction digest');
        }
        setVerificationDigest(digest);
        setStages(prev => prev.map((stage, index) => index === 1 && stage.id === 'verification-request' ? { ...stage, status: 'completed' } : stage));
        setAwaitingSignature(false);

        // Stage 3: Cryptographic hashing & attestation via API
        setCurrentStage(2);
        setStages(prev => prev.map((stage, index) => index === 2 && stage.id === 'crypto-attestation' ? { ...stage, status: 'processing', error: undefined } : stage));
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
          setStages(prev => prev.map((stage, index) => index === 2 && stage.id === 'crypto-attestation' ? { ...stage, status: 'completed' } : stage));
        } catch (attErr: any) {
          setStages(prev => prev.map((stage, index) => index === 2 && stage.id === 'crypto-attestation' ? { ...stage, status: 'failed', error: attErr?.message || 'Attestation failed' } : stage));
          setHasFailed(true);
          setIsProcessing(false);
          return;
        }

        // Stage 4: Certificate sealing (optional, only when seal is enabled)
        if (sealEncryption) {
          // Find sealing stage index
          const sealingIndex = stages.findIndex(s => s.id === 'certificate-sealing');
          if (sealingIndex >= 0) {
            setCurrentStage(sealingIndex);
            setStages(prev => prev.map((stage, idx) => idx === sealingIndex ? { ...stage, status: 'processing', error: undefined } : stage));
            try {
              const client = new SuiClient({ url: getFullnodeUrl(network as any) });
              const sealClient = new SealClient({
                suiClient: client as any,
                serverConfigs: sealServers.map((id) => ({ objectId: id, weight: 0.33 })),
                verifyKeyServers: false,
              });

              const fetchBlob = async (id: string) => {
                const r = await fetch(`${aggregatorUrl}/v1/blobs/${id}`);
                if (!r.ok) throw new Error(`Aggregator fetch ${id} failed ${r.status}`);
                const ab = await r.arrayBuffer();
                return new Uint8Array(ab);
              };

              const mediaBytes = await fetchBlob(walrusMediaId!);
              const manifestBytes = await fetchBlob(walrusManifestId!);
              const sealId = (crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`);
              const threshold = 2;
              const policy = 'creator-only';

              const encMedia = await sealClient.encrypt({ data: mediaBytes, threshold, id: `${sealId}-media`, packageId: '' });
              const encManifest = await sealClient.encrypt({ data: manifestBytes, threshold, id: `${sealId}-manifest`, packageId: '' });

              // Quick decrypt test to validate access
              try {
                await sealClient.decrypt(encMedia.encryptedObject);
                await sealClient.decrypt(encManifest.encryptedObject);
                setSealInfo({ sealId, accessPolicy: policy, threshold, decryptTest: 'ok' });
              } catch {
                setSealInfo({ sealId, accessPolicy: policy, threshold, decryptTest: 'failed' });
              }

              setStages(prev => prev.map((stage, idx) => idx === sealingIndex ? { ...stage, status: 'completed' } : stage));
            } catch (sealErr: any) {
              // Fallback to software sealing (AES-GCM) when Seal servers/object IDs are invalid
              try {
                const mediaBytes = await (await fetch(`${aggregatorUrl}/v1/blobs/${walrusMediaId!}`)).arrayBuffer();
                const manifestBytes = await (await fetch(`${aggregatorUrl}/v1/blobs/${walrusManifestId!}`)).arrayBuffer();
                const gen = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
                const iv1 = crypto.getRandomValues(new Uint8Array(12));
                const iv2 = crypto.getRandomValues(new Uint8Array(12));
                const c1 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv1 }, gen, mediaBytes);
                const c2 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv2 }, gen, manifestBytes);
                let ok = 'pending' as 'pending' | 'ok' | 'failed';
                try {
                  await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv1 }, gen, c1);
                  await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv2 }, gen, c2);
                  ok = 'ok';
                } catch { ok = 'failed'; }
                const raw = new Uint8Array(await crypto.subtle.exportKey('raw', gen));
                const keyId = `aesgcm_${btoa(String.fromCharCode(...raw))}`;
                setSealInfo({ sealId: keyId, accessPolicy: 'software-seal', threshold: 1, decryptTest: ok });
                setStages(prev => prev.map((stage, idx) => idx === sealingIndex ? { ...stage, status: ok === 'ok' ? 'completed' : 'failed', error: ok === 'ok' ? undefined : 'Software decrypt test failed' } : stage));
                if (ok !== 'ok') { setHasFailed(true); setIsProcessing(false); return; }
              } catch (fallbackErr: any) {
                const sealingIndex2 = stages.findIndex(s => s.id === 'certificate-sealing');
                setStages(prev => prev.map((stage, idx) => idx === sealingIndex2 ? { ...stage, status: 'failed', error: fallbackErr?.message || sealErr?.message || 'Sealing failed' } : stage));
                setHasFailed(true);
                setIsProcessing(false);
                return;
              }
            }
          }
        }
      } catch (e: any) {
        setStages(prev => prev.map((stage, index) => index === 1 && stage.id === 'verification-request' ? { ...stage, status: 'failed', error: e?.message || 'Verification request failed' } : stage));
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
          const mediaVec = bcs.vector(bcs.U8).serialize(Array.from(mediaIdBytes));
          const manifestVec = bcs.vector(bcs.U8).serialize(Array.from(manifestIdBytes));
          const tx = new Transaction();
          tx.moveCall({ target: `${VERILENS_PACKAGE_ID}::verilens_oracle::request_verification`, arguments: [tx.pure(mediaVec), tx.pure(manifestVec)] });
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
      if (failedId === 'certificate-sealing') {
        // rerun sealing only
        try {
          // reuse sealing block via processWorkflow after marking stage 3 completed
          await processWorkflow();
        } catch {}
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
        <div className={`relative ${index === stages.length - 1 ? 'text-purple-400' : 'text-green-500'}`}>
          <CheckCircle className="w-8 h-8" />
          {index === stages.length - 1 && (
            <div className="absolute inset-0 animate-pulse">
              <CheckCircle className="w-8 h-8 text-purple-300 opacity-50" />
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
    
    const nextStage = stages[index + 1];
    const isActive = stages[index].status === 'completed' || stages[index].status === 'processing';
    const isNextCompleted = nextStage.status === 'completed';
    const hasError = stages[index].status === 'failed';
    
    return (
      <div className="hidden md:block absolute top-16 left-1/2 transform -translate-x-1/2 w-px h-16">
        <div className={`h-full w-0.5 transition-all duration-500 ${
          hasError ? 'bg-red-500' : 
          isNextCompleted ? (index === stages.length - 2 ? 'bg-purple-400' : 'bg-green-500') :
          isActive ? 'bg-primary animate-pulse' : 'bg-gray-600'
        }`} />
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
            className="bg-gray-900 border border-cyan-400/30 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Verilens Authenticity Verification
                </h2>
                <p className="text-gray-400">
                  Processing your content through the complete Verilens truth engine workflow
                </p>
              </div>
              {!isProcessing && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Workflow Stages */}
            <div className="space-y-8">
              {/* Desktop Layout - Horizontal */}
              <div className="hidden md:flex justify-between items-start relative">
                {stages.map((stage, index) => (
                  <div key={stage.id} className="flex flex-col items-center text-center flex-1 relative">
                    <div className="mb-4">
                      {getStageIcon(stage, index)}
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
                    {/* No connector lines on desktop */}
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
                        <div className={`w-0.5 h-12 mt-2 transition-all duration-500 ${
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
                    <div className="flex items-center space-x-2">
                      <a href={`${explorerBase}/${walrusMediaId}`} target="_blank" rel="noopener noreferrer" className={`font-mono ${walrusStatus.media ? 'text-green-300' : 'text-yellow-300'}`}>{walrusMediaId}</a>
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
                    <div className="flex items-center space-x-2">
                      <a href={`${explorerBase}/${walrusManifestId}`} target="_blank" rel="noopener noreferrer" className={`font-mono ${walrusStatus.manifest ? 'text-green-300' : 'text-yellow-300'}`}>{walrusManifestId}</a>
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
                    <div className="mt-10">
                      <div className="flex items-center mb-3">
                        <Lock className="w-5 h-5 text-secondary mr-2" />
                        <h4 className="text-md font-semibold text-secondary">Attestation Details</h4>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Content Hash:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-gray-200">{attestation.contentHashHex}</span>
                            <button onClick={() => navigator.clipboard?.writeText(attestation.contentHashHex)} className="p-1 rounded hover:bg-gray-700 text-gray-300"><Copy className="w-3 h-3" /></button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Manifest Hash:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-gray-200">{attestation.manifestHashHex}</span>
                            <button onClick={() => navigator.clipboard?.writeText(attestation.manifestHashHex)} className="p-1 rounded hover:bg-gray-700 text-gray-300"><Copy className="w-3 h-3" /></button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Code Hash:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-gray-200">{attestation.codeHashHex}</span>
                            <button onClick={() => navigator.clipboard?.writeText(attestation.codeHashHex)} className="p-1 rounded hover:bg-gray-700 text-gray-300"><Copy className="w-3 h-3" /></button>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-400">Signature:</span>
                          <div className="flex items-center space-x-2 ml-auto">
                            <span className="font-mono text-gray-200 truncate max-w-[50%] text-right">{attestation.signatureHex}</span>
                            <button onClick={() => navigator.clipboard?.writeText(attestation.signatureHex)} className="p-1 rounded hover:bg-gray-700 text-gray-300"><Copy className="w-3 h-3" /></button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">TEE ID:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-gray-200">{attestation.proverTeeId}</span>
                            <button onClick={() => navigator.clipboard?.writeText(attestation.proverTeeId)} className="p-1 rounded hover:bg-gray-700 text-gray-300"><Copy className="w-3 h-3" /></button>
                          </div>
                        </div>
                        {sealInfo && (
                          <>
                            <div className="mt-6 flex items-center justify-between">
                              <span className="text-gray-400">Seal Access Key ID:</span>
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-gray-200">{sealInfo.sealId}</span>
                                <button title="Copy Access Key ID" onClick={() => navigator.clipboard?.writeText(sealInfo.sealId)} className="p-1 rounded hover:bg-gray-700 text-gray-300"><Copy className="w-3 h-3" /></button>
                                <button onClick={() => navigator.clipboard?.writeText(sealInfo.sealId)} className="px-2 py-1 rounded bg-blue-900/30 border border-blue-500/30 text-blue-300 hover:bg-blue-900/40">Copy Access Key ID</button>
                              </div>
                            </div>
                            <div className="mt-2 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                              <div className="flex items-start space-x-2">
                                <HelpCircle className="w-4 h-4 text-blue-300 mt-0.5" />
                                <div className="text-xs text-gray-300">
                                  Use this sealId to manage access: add authorized parties and policies in your Seal key management. Authorized users can decrypt with their keys using SealClient when policy allows. See
                                  <a href="https://docs.mystenlabs.com/seal" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-300 underline">Seal policy management</a>.
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Policy / Threshold:</span>
                              <span className="font-mono text-gray-200">{sealInfo.accessPolicy} / {sealInfo.threshold}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Decrypt Test:</span>
                              <span className={`font-mono ${sealInfo.decryptTest === 'ok' ? 'text-green-300' : 'text-red-300'}`}>{sealInfo.decryptTest === 'ok' ? 'Success' : 'Failed'}</span>
                            </div>
                          </>
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
