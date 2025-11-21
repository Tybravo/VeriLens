'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useCurrentAccount, useSuiClientContext, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { SealClient } from "@mysten/seal";
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

interface UploadResponse {
  walrusMediaId: string;
  walrusManifestId: string;
  jobId: string;
  transactionDigest?: string;
}

interface SealEncryptionConfig {
  enabled: boolean;
  accessPolicy?: string;
  authorizedParties?: string[];
}

const SEAL_KEY_SERVERS = [
  '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
  '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
  '0x6068c0acb197dddbacd4746a9de7f025b2ed5a5b6c1b1ab44dade4426d141da2',
];

export default function UploadContentPage() {
  const currentAccount = useCurrentAccount();
  const { network } = useSuiClientContext();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) => await suiClient.executeTransactionBlock({
      transactionBlock: bytes,
      signature,
      options: { showRawEffects: true, showObjectChanges: true }
    })
  });

  const VERILENS_PACKAGE_ID = process.env.NEXT_PUBLIC_VERILENS_PACKAGE_ID || '';

  // Walrus endpoints
  const walrusConfig = useMemo(() => {
    const isMainnet = network === 'mainnet';
    return {
      publisherUrl: isMainnet
        ? 'https://publisher.walrus.space'
        : 'https://publisher.walrus-testnet.walrus.space',
      aggregatorUrl: isMainnet
        ? 'https://aggregator.walrus.space'
        : 'https://aggregator.walrus-testnet.walrus.space',
    };
  }, [network]);

  // Initialize Seal Client
  const sealClient = useMemo(() => {
    const networkName = (network || 'testnet') as 'mainnet' | 'testnet' | 'devnet' | 'localnet';
    const client = new SuiClient({
      url: getFullnodeUrl(networkName),
    });

    return new SealClient({
      suiClient: client as any,
      serverConfigs: SEAL_KEY_SERVERS.map((id) => ({
        objectId: id,
        weight: 0.33,
      })),
      verifyKeyServers: false,
    });
  }, [network]);

  // Helper function to upload to Walrus via HTTP
  const uploadToWalrus = async (data: Uint8Array, epochs: number = 5) => {
    const response = await fetch(`${walrusConfig.publisherUrl}/v1/blobs?epochs=${epochs}`, {
      method: 'PUT',
      body: new Blob([data.buffer as ArrayBuffer]), // Type assertion
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Walrus upload failed: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  };

  const stringToBytes = (id: string): Uint8Array => {
    if (id.startsWith('0x')) {
      const hex = id.slice(2);
      const arr = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
      }
      return arr;
    }
    return new TextEncoder().encode(id);
  };

  const submitVerificationRequest = async () => {
    if (!uploadResponse || !currentAccount) return;
    if (!VERILENS_PACKAGE_ID) {
      setError('Contract package ID is not configured. Set NEXT_PUBLIC_VERILENS_PACKAGE_ID.');
      return;
    }
    try {
      const tx = new Transaction();
      const mediaBytes = stringToBytes(uploadResponse.walrusMediaId);
      const manifestBytes = stringToBytes(uploadResponse.walrusManifestId);
      tx.moveCall({
        target: `${VERILENS_PACKAGE_ID}::verilens_oracle::request_verification`,
        arguments: [
          tx.pure.vector('u8', Array.from(mediaBytes)),
          tx.pure.vector('u8', Array.from(manifestBytes)),
        ],
      });
      const chain = `sui:${network || 'testnet'}`;
      const result = await signAndExecuteTransaction({ transaction: tx, chain });
      setUploadResponse(prev => prev ? { ...prev, transactionDigest: result.digest } : prev);
    } catch (e: any) {
      setError(e?.message || 'Failed to submit verification request');
    }
  };

  // File states
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [manifestFile, setManifestFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  // Seal encryption state
  const [sealConfig, setSealConfig] = useState<SealEncryptionConfig>({
    enabled: false,
    accessPolicy: 'creator-only',
    authorizedParties: []
  });

  // UI states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<{ media: boolean; manifest: boolean }>({
    media: false,
    manifest: false
  });

  // Refs for file inputs
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const manifestInputRef = useRef<HTMLInputElement>(null);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent, type: 'media' | 'manifest', isEnter: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: isEnter }));
  }, []);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent, type: 'media' | 'manifest') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive({ media: false, manifest: false });

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelection(files[0], type);
    }
  }, []);

  // Handle file selection
  const handleFileSelection = (file: File, type: 'media' | 'manifest') => {
    setError(null);

    if (type === 'media') {
      const validMediaTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
      if (!validMediaTypes.includes(file.type)) {
        setError('Please upload a valid image (JPEG, PNG, GIF) or video (MP4, MOV) file.');
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setError('Media file size must be less than 50MB.');
        return;
      }

      setMediaFile(file);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setMediaPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setMediaPreview(null);
      }
    } else {
      const validManifestTypes = ['application/json', 'text/xml', 'application/xml'];
      if (!validManifestTypes.includes(file.type)) {
        setError('Please upload a valid C2PA manifest file (JSON or XML).');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Manifest file size must be less than 5MB.');
        return;
      }

      setManifestFile(file);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'media' | 'manifest') => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file, type);
    }
  };

  // Remove uploaded file
  const removeFile = (type: 'media' | 'manifest') => {
    if (type === 'media') {
      setMediaFile(null);
      setMediaPreview(null);
      if (mediaInputRef.current) {
        mediaInputRef.current.value = '';
      }
    } else {
      setManifestFile(null);
      if (manifestInputRef.current) {
        manifestInputRef.current.value = '';
      }
    }
  };

  // Handle Seal encryption toggle
  const toggleSealEncryption = () => {
    setSealConfig(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentAccount) {
      setError('Please connect your wallet to continue.');
      return;
    }

    if (!mediaFile || !manifestFile) {
      setError('Please upload both media file and C2PA manifest.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Convert files to byte arrays
      const mediaBytes = new Uint8Array(await mediaFile.arrayBuffer());
      const manifestBytes = new Uint8Array(await manifestFile.arrayBuffer());

      // Handle encryption if enabled
      let encryptedMedia = mediaBytes;

      if (sealConfig.enabled) {
        try {
          const sealId = crypto.randomUUID();
          const sealResult = await sealClient.encrypt({
            data: mediaBytes,
            threshold: 2,
            id: sealId,
            packageId: ""
          });
          encryptedMedia = sealResult.encryptedObject;
          console.log('Media encrypted successfully');
        } catch (encryptionErr) {
          console.error('Seal encryption error:', encryptionErr);
          throw new Error('Seal encryption failed. Please try without encryption.');
        }
      }

      try {
        console.log('Uploading to Walrus...');

        // Upload media file to Walrus
        const mediaResult = await uploadToWalrus(encryptedMedia, 5);
        console.log('Media uploaded:', mediaResult);

        // Upload manifest file to Walrus
        const manifestResult = await uploadToWalrus(manifestBytes, 5);
        console.log('Manifest uploaded:', manifestResult);

        // Extract blob IDs from the response
        // Walrus response structure: { newlyCreated: { blobObject: { blobId, id, ... } } } or { alreadyCertified: { blobId, ... } }
        const mediaBlobId = mediaResult.newlyCreated?.blobObject?.blobId ||
          mediaResult.alreadyCertified?.blobId;
        const manifestBlobId = manifestResult.newlyCreated?.blobObject?.blobId ||
          manifestResult.alreadyCertified?.blobId;

        if (!mediaBlobId || !manifestBlobId) {
          console.error('Full media result:', mediaResult);
          console.error('Full manifest result:', manifestResult);
          throw new Error('Failed to retrieve Walrus blob IDs from response');
        }

        console.log('Blob IDs extracted:', { mediaBlobId, manifestBlobId });

        setUploadResponse({
          walrusMediaId: mediaBlobId,
          walrusManifestId: manifestBlobId,
          jobId: `job_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          transactionDigest: mediaResult.newlyCreated?.blobObject?.id,
        });

        // Reset form
        setMediaFile(null);
        setManifestFile(null);
        setMediaPreview(null);
        setSealConfig({ enabled: false, accessPolicy: 'creator-only', authorizedParties: [] });

      } catch (walrusErr) {
        console.error('Walrus upload error:', walrusErr);

        // Fallback to backend API
        console.log('Attempting backend upload fallback...');

        const formData = new FormData();
        formData.append('mediaFile', mediaFile);
        formData.append('manifestFile', manifestFile);
        formData.append('walletAddress', currentAccount.address);
        formData.append('network', network || 'testnet');
        formData.append('sealEncryption', JSON.stringify(sealConfig));

        const response = await fetch('/api/verify/submit', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Upload failed. Please try again.');
        }

        const data: UploadResponse = await response.json();
        setUploadResponse(data);

        // Reset form
        setMediaFile(null);
        setManifestFile(null);
        setMediaPreview(null);
        setSealConfig({ enabled: false, accessPolicy: 'creator-only', authorizedParties: [] });
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsUploading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setMediaFile(null);
    setManifestFile(null);
    setMediaPreview(null);
    setUploadResponse(null);
    setError(null);
    setSealConfig({ enabled: false, accessPolicy: 'creator-only', authorizedParties: [] });
  };

  return (

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="min-h-screen bg-darkblue text-white"
    >
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Upload Your Digital Content
          </h1>
          <p className="text-xl text-secondary-light max-w-3xl mx-auto">
            Upload your media and C2PA manifest to create verifiable proof of authenticity on the Sui blockchain
          </p>
        </motion.div>

        {/* Wallet Connection Status */}
        {!currentAccount && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-8 text-center"
          >
            <p className="text-yellow-300">
              ⚠️ Please connect your wallet to upload content and create verifiable certificates
            </p>
          </motion.div>
        )}

        {/* Upload Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto space-y-8"
        >
          {/* Media File Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="bg-darkblue-light rounded-xl p-6 border border-cyan-400/50 transition-shadow hover:shadow-[0_0_24px_rgba(0,131,212,0.75)] hover:border-[#0083D4]"
          >
            <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center">
              <span className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">1</span>
              Upload Media File
            </h2>
            <p className="text-gray-300 mb-6">
              Upload your image or video file. Supported formats: JPEG, PNG, GIF, MP4, MOV (max 50MB)
            </p>

            {!mediaFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${dragActive.media
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-600 hover:border-primary/50 hover:bg-primary/5'
                  }`}
                onDragEnter={(e) => handleDrag(e, 'media', true)}
                onDragLeave={(e) => handleDrag(e, 'media', false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'media')}
              >
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-white mb-2">
                      Drop your media file here or{' '}
                      <button
                        type="button"
                        onClick={() => mediaInputRef.current?.click()}
                        className="text-primary hover:text-primary-light underline"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-sm text-gray-400">
                      Images & videos up to 50MB
                    </p>
                  </div>
                </div>
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => handleFileInputChange(e, 'media')}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="bg-darkblue-dark rounded-lg p-4 border border-green-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {mediaPreview ? (
                      <Image
                        src={mediaPreview}
                        alt="Media preview"
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-primary/20 rounded-lg flex items-center justify-center">
                        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white">{mediaFile.name}</p>
                      <p className="text-sm text-gray-400">
                        {(mediaFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile('media')}
                    className="text-red-400 hover:text-red-300 p-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* C2PA Manifest Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="bg-darkblue-light rounded-xl p-6 border border-cyan-400/50 transition-shadow hover:shadow-[0_0_24px_rgba(0,131,212,0.75)] hover:border-[#0083D4]"
          >
            <h2 className="text-2xl font-semibold text-secondary mb-4 flex items-center">
              <span className="bg-secondary/20 rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">2</span>
              Upload C2PA Manifest
            </h2>
            <p className="text-gray-300 mb-6">
              Upload the C2PA manifest file that contains provenance information. Supported formats: JSON, XML (max 5MB)
            </p>

            {!manifestFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${dragActive.manifest
                  ? 'border-secondary bg-secondary/10'
                  : 'border-gray-600 hover:border-secondary/50 hover:bg-secondary/5'
                  }`}
                onDragEnter={(e) => handleDrag(e, 'manifest', true)}
                onDragLeave={(e) => handleDrag(e, 'manifest', false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'manifest')}
              >
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-white mb-2">
                      Drop your manifest file here or{' '}
                      <button
                        type="button"
                        onClick={() => manifestInputRef.current?.click()}
                        className="text-secondary hover:text-secondary-light underline"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-sm text-gray-400">
                      JSON or XML files up to 5MB
                    </p>
                  </div>
                </div>
                <input
                  ref={manifestInputRef}
                  type="file"
                  accept=".json,.xml"
                  onChange={(e) => handleFileInputChange(e, 'manifest')}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="bg-darkblue-dark rounded-lg p-4 border border-green-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-white">{manifestFile.name}</p>
                      <p className="text-sm text-gray-400">
                        {(manifestFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile('manifest')}
                    className="text-red-400 hover:text-red-300 p-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Seal Encryption Options */}
          <div className="bg-darkblue-light rounded-xl p-6 border border-cyan-400/50 transition-shadow hover:shadow-[0_0_24px_rgba(0,131,212,0.75)] hover:border-[#0083D4]">
            <h2 className="text-2xl font-semibold text-accent mb-4 flex items-center">
              <span className="bg-accent/20 rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">3</span>
              Seal Encryption (Optional)
            </h2>
            <p className="text-gray-300 mb-6">
              Encrypt your content using Seal to control access and ensure only authorized parties can decrypt your media.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-darkblue-dark rounded-lg border border-gray-600">
                <div>
                  <h3 className="font-medium text-white mb-1">Enable Seal Encryption</h3>
                  <p className="text-sm text-gray-400">
                    Protect your content with access control and encryption
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleSealEncryption}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sealConfig.enabled ? 'bg-accent' : 'bg-gray-600'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${sealConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              {sealConfig.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div className="p-4 bg-accent/10 rounded-lg border border-accent/30">
                    <h4 className="font-medium text-accent mb-2">Access Policy</h4>
                    <select
                      value={sealConfig.accessPolicy}
                      onChange={(e) => setSealConfig(prev => ({ ...prev, accessPolicy: e.target.value }))}
                      className="w-full p-3 bg-darkblue-dark border border-gray-600 rounded-lg text-white focus:border-accent focus:outline-none"
                    >
                      <option value="creator-only">Creator Only</option>
                      <option value="whitelist">Whitelist Addresses</option>
                      <option value="public">Public (No Encryption)</option>
                    </select>
                  </div>

                  <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                    <h4 className="font-medium text-blue-300 mb-2">ℹ️ Seal Encryption Benefits</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• End-to-end encryption for your media</li>
                      <li>• Fine-grained access control</li>
                      <li>• Authorized party management</li>
                      <li>• Secure key management</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-900/20 border border-red-500/30 rounded-lg p-4"
            >
              <p className="text-red-300 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            </motion.div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center space-x-4">
            <motion.button
              type="submit"
              disabled={isUploading || !currentAccount || !mediaFile || !manifestFile}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 ${isUploading || !currentAccount || !mediaFile || !manifestFile
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-[#0083D4] text-white hover:bg-[#006D77] hover:shadow-glow'
                }`}
            >
              {isUploading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </div>
              ) : (
                'Upload & Verify Content'
              )}
            </motion.button>

            {(mediaFile || manifestFile) && (
              <motion.button
                type="button"
                onClick={resetForm}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-4 rounded-lg font-semibold border border-[#BA55D3] text-gray-300 hover:border-[#0083D4] transition-all duration-300"
              >
                Reset Form
              </motion.button>
            )}
          </div>
        </motion.form>

        {/* Success Response */}
        {uploadResponse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mt-8 bg-green-900/20 border border-green-500/30 rounded-xl p-6"
          >
            <h3 className="text-2xl font-semibold text-green-300 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Upload Successful!
            </h3>

            <div className="space-y-4">
              <div className="bg-darkblue-dark rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Walrus Blob IDs</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Media Blob ID:</span>
                    <span className="text-green-300 font-mono">{uploadResponse.walrusMediaId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Manifest Blob ID:</span>
                    <span className="text-green-300 font-mono">{uploadResponse.walrusManifestId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Verification Job ID:</span>
                    <span className="text-blue-300 font-mono">{uploadResponse.jobId}</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={submitVerificationRequest}
                  className="px-4 py-2 bg-primary hover:bg-primary-light rounded-lg text-white font-medium transition-colors"
                >
                  Submit Verification Request
                </button>
                {uploadResponse.transactionDigest && (
                  <a
                    href={`https://suiexplorer.com/object/${uploadResponse.transactionDigest}?network=${network}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-secondary hover:bg-secondary-light rounded-lg text-white font-medium transition-colors"
                  >
                    View on Sui Explorer
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Information Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto mt-12 text-center"
        >
          <div className="bg-darkblue-light rounded-xl p-8 border border-cyan-400/50 transition-shadow hover:shadow-[0_0_24px_rgba(0,131,212,0.75)] hover:border-[#0083D4]">
            <h3 className="text-2xl font-semibold text-primary mb-4">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold mb-2">1</div>
                <h4 className="font-semibold text-white">Upload Files</h4>
                <p className="text-sm text-gray-400">Upload your media and C2PA manifest files to Walrus decentralized storage.</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center text-secondary font-semibold mb-2">2</div>
                <h4 className="font-semibold text-white">Verify Authenticity</h4>
                <p className="text-sm text-gray-400">Nautilus TEE performs C2PA verification and creates cryptographic proof.</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center text-accent font-semibold mb-2">3</div>
                <h4 className="font-semibold text-white">Get Certificate</h4>
                <p className="text-sm text-gray-400">Receive a Provenance Certificate NFT proving your content's authenticity.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
