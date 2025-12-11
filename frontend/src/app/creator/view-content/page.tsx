'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useCurrentAccount, useSuiClientContext } from '@mysten/dapp-kit';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

type OwnerContent = {
  ownerAddress: string;
  createdAt?: string;
  updatedAt?: string;
  mediaBlobId?: string;
  manifestBlobId?: string;
  verificationHash?: string;
  attestationHash?: string;
  sealDecryptionKey?: string | null;
  certificateBlobId?: string;
  badgeBlobId?: string;
  manifestPlainText?: string | null;
  mediaUrl?: string | null;
  certificateUrl?: string | null;
  badgeUrl?: string | null;
};

const formatManifestToPlainText = (manifestText: string | null | undefined): string => {
  if (!manifestText) return '';
  
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(manifestText);
    
    // Convert JSON object to plain text format
    let plainText = '';
    for (const [key, value] of Object.entries(parsed)) {
      // Format key: convert camelCase to Title Case with spaces
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
      
      plainText += `${formattedKey}: ${value}\n`;
    }
    
    return plainText.trim();
  } catch {
    // If it's not JSON, return as-is (already plain text)
    return manifestText;
  }
};

const ViewContentPage: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const { network } = useSuiClientContext();

  const packageId = process.env.NEXT_PUBLIC_VERILENS_PACKAGE_ID || '';
  const aggregatorUrl = useMemo(() => (
    (network === 'mainnet') ? 'https://aggregator.walrus.space' : 'https://aggregator.walrus-testnet.walrus.space'
  ), [network]);

  const [client, setClient] = useState<SuiClient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownerData, setOwnerData] = useState<OwnerContent | null>(null);

  useEffect(() => {
    setClient(new SuiClient({ url: getFullnodeUrl(network as any) }));
  }, [network]);

  const fetchOwnerData = async () => {
    if (!currentAccount?.address || !client) return;
    setLoading(true);
    setError(null);
    try {
      const owned = await client.getOwnedObjects({
        owner: currentAccount.address,
        options: { showType: true, showContent: true, showDisplay: true, showPreviousTransaction: true },
      });

      const verilensObjects = (owned.data || []).filter((o: any) => {
        const t = o.data?.type || '';
        return t.includes(packageId) || t.includes('verilens_oracle');
      });

      let data: OwnerContent = { ownerAddress: currentAccount.address };

      for (const obj of verilensObjects) {
        const content = obj.data?.content;
        const fields = (content && 'fields' in content) ? content.fields as any : {};
        const display = obj.data?.display?.data as any;
        const typeStr = obj.data?.type as string;
        const createdTx = obj.data?.previousTransaction as string | undefined;

        const createdTime = createdTx ? await client.getTransactionBlock({ digest: createdTx, options: { showEffects: true } }) : null;
        const tsMs = (createdTime?.timestampMs as string | undefined) || undefined;
        if (tsMs) data.createdAt = new Date(Number(tsMs)).toISOString();

        const metaStr = fields?.metadata ?? display?.metadata ?? display?.description ?? null;
        if (metaStr && typeof metaStr === 'string') {
          try {
            const meta = JSON.parse(metaStr);
            data.mediaBlobId = data.mediaBlobId || meta.mediaBlobId;
            data.manifestBlobId = data.manifestBlobId || meta.manifestBlobId;
            data.verificationHash = data.verificationHash || meta.verificationDigest || meta.verificationHash;
            data.attestationHash = data.attestationHash || meta.attestationHash;
            data.badgeBlobId = data.badgeBlobId || meta.badgeBlobId;
            data.certificateBlobId = data.certificateBlobId || meta.certificateBlobId;
            data.sealDecryptionKey = (meta.sealEncryption ? (meta.sealKey || null) : null);
          } catch {}
        }

        if (!data.badgeBlobId && /badge/i.test(typeStr)) {
          const blob = fields?.blob_id || fields?.badge_blob_id || fields?.blobId;
          if (blob) data.badgeBlobId = blob;
        }
        if (!data.certificateBlobId && /cert/i.test(typeStr)) {
          const blob = fields?.blob_id || fields?.certificate_blob_id || fields?.blobId;
          if (blob) data.certificateBlobId = blob;
        }
      }

      if (data.mediaBlobId) data.mediaUrl = `${aggregatorUrl}/v1/blobs/${data.mediaBlobId}`;
      if (data.manifestBlobId) {
        const manifestUrl = `${aggregatorUrl}/v1/blobs/${data.manifestBlobId}`;
        try {
          const res = await fetch(manifestUrl);
          if (res.ok) {
            const txt = await res.text();
            data.manifestPlainText = txt;
          }
        } catch {}
      }
      if (data.badgeBlobId) data.badgeUrl = `${aggregatorUrl}/v1/blobs/${data.badgeBlobId}`;
      if (data.certificateBlobId) data.certificateUrl = `${aggregatorUrl}/v1/blobs/${data.certificateBlobId}`;

      setOwnerData(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load content for owner');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentAccount?.address && client) {
      fetchOwnerData();
    }
  }, [currentAccount?.address, client]);

  if (!currentAccount?.address) {
    return (
      <div className="min-h-screen bg-darkblue px-4 py-20 flex items-center justify-center">
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Connect Wallet</h1>
          <p className="text-xl text-secondary-light max-w-3xl mx-auto">
            Please connect your wallet to view your content details.
          </p>
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mt-6">
            <p className="text-yellow-300">
              ⚠️ Wallet connection required to access your verifiable content certificates
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">View Your Content</h1>
          <button
            className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => fetchOwnerData()}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-700 p-4 bg-gray-900/50">
              <h2 className="text-lg font-medium mb-3 text-cyan-300">Ownership</h2>
              <div className="text-sm">
                <div className="flex justify-between py-1"><span className="text-cyan-200">Owner Address</span><span className="text-white">{ownerData?.ownerAddress}</span></div>
                <div className="flex justify-between py-1"><span className="text-cyan-200">Created Date</span><span className="text-white">{ownerData?.createdAt || '—'}</span></div>
                <div className="flex justify-between py-1"><span className="text-cyan-200">Updated Date</span><span className="text-white">{ownerData?.updatedAt || '—'}</span></div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-700 p-4 bg-gray-900/50">
              <h2 className="text-lg font-medium mb-3 text-cyan-300">Identifiers</h2>
              <div className="text-sm space-y-2">
                <div className="flex justify-between"><span className="text-cyan-200">Media Blob ID</span><span className="break-all text-white">{ownerData?.mediaBlobId || '—'}</span></div>
                <div className="flex justify-between"><span className="text-cyan-200">Manifest Blob ID</span><span className="break-all text-white">{ownerData?.manifestBlobId || '—'}</span></div>
              </div>
            </div>

            <div className="rounded-lg border border-green-600 p-4 bg-green-900/20">
              <h2 className="text-lg font-medium mb-3 text-green-300">Verification & Authentication</h2>
              <div className="text-sm space-y-3">
                <div>
                  <span className="text-green-200 font-medium">Verification Hash:</span>
                  <p className="font-mono text-xs break-all text-green-100 mt-1 bg-green-900/30 p-2 rounded">
                    {ownerData?.verificationHash || 'Not available'}
                  </p>
                  <p className="text-xs text-green-400 mt-1">
                    Unique cryptographic proof of your content's authenticity
                  </p>
                </div>
                <div>
                  <span className="text-green-200 font-medium">Attestation Hash:</span>
                  <p className="font-mono text-xs break-all text-green-100 mt-1 bg-green-900/30 p-2 rounded">
                    {ownerData?.attestationHash || 'Not available'}
                  </p>
                  <p className="text-xs text-green-400 mt-1">
                    C2PA attestation signature for content integrity verification
                  </p>
                </div>
                <div>
                  <span className="text-cyan-200">Seal Decryption Key</span>
                  <p className="font-mono text-xs break-all text-white mt-1 bg-gray-800 p-2 rounded">
                    {ownerData?.sealDecryptionKey ?? 'None (Content not sealed)'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-700 p-4 bg-gray-900/50">
              <h2 className="text-lg font-medium mb-3 text-cyan-300">Manifest Content</h2>
              <div className="text-sm whitespace-pre-wrap break-words bg-gray-800 p-3 rounded text-white">
                {formatManifestToPlainText(ownerData?.manifestPlainText) || '—'}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h2 className="text-lg font-medium mb-3">Original Media</h2>
              {ownerData?.mediaUrl ? (
                <img src={ownerData.mediaUrl} alt="Media" className="w-full h-auto rounded" />
              ) : (
                <div className="text-sm text-gray-500">No media available</div>
              )}
            </div>

            <div className="rounded-lg border p-4">
              <h2 className="text-lg font-medium mb-3">Minted Certificate</h2>
              {ownerData?.certificateUrl ? (
                <img src={ownerData.certificateUrl} alt="Certificate" className="w-full h-auto rounded" />
              ) : (
                <div className="text-sm text-gray-500">No certificate available</div>
              )}
            </div>

            <div className="rounded-lg border p-4">
              <h2 className="text-lg font-medium mb-3">Minted Badge</h2>
              {ownerData?.badgeUrl ? (
                <img src={ownerData.badgeUrl} alt="Badge" className="w-full h-auto rounded" />
              ) : (
                <div className="text-sm text-gray-500">No badge available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewContentPage;
