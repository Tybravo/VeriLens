'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Shield, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Wallet,
  Loader2,
  Download,
  ExternalLink
} from 'lucide-react';
import { useCurrentAccount, useConnectWallet } from '@mysten/dapp-kit';
import EnhancedUploadVerificationModal from '@/components/EnhancedUploadVerificationModal';
import EnhancedProvenanceCertificateComponent from '@/components/EnhancedProvenanceCertificate';
import { Toaster, toast } from 'sonner';

interface TestFile {
  file: File;
  preview: string;
  uploaded: boolean;
  blobId?: string;
}

export default function BlockchainWorkflowTest() {
  const currentAccount = useCurrentAccount();
  const { mutate: connect } = useConnectWallet();
  
  const [mediaFile, setMediaFile] = useState<TestFile | null>(null);
  const [manifestFile, setManifestFile] = useState<TestFile | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [sealEncryption, setSealEncryption] = useState(false);

  // Sample manifest content
  const sampleManifest = {
    "@context": "https://schema.org",
    "@type": "MediaObject",
    "name": "Sample Media Asset",
    "description": "A test media asset for blockchain verification",
    "author": {
      "@type": "Person",
      "name": "Test Creator"
    },
    "dateCreated": new Date().toISOString(),
    "contentLocation": "Blockchain",
    "copyrightYear": 2024,
    "copyrightHolder": {
      "@type": "Person", 
      "name": "Content Creator"
    },
    "c2pa": {
      "claim_generator": "VeriLens Truth Engine",
      "version": "1.0.0",
      "assertions": [
        {
          "type": "metadata",
          "data": {
            "created": new Date().toISOString(),
            "format": "image/jpeg",
            "authenticity": "blockchain-verified"
          }
        }
      ]
    }
  };

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Media file must be less than 50MB');
        return;
      }

      const preview = URL.createObjectURL(file);
      setMediaFile({
        file,
        preview,
        uploaded: false
      });
      toast.success('Media file selected successfully');
    }
  };

  const handleManifestUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Manifest file must be less than 5MB');
        return;
      }

      const preview = URL.createObjectURL(file);
      setManifestFile({
        file,
        preview,
        uploaded: false
      });
      toast.success('Manifest file selected successfully');
    }
  };

  const createSampleManifest = () => {
    const manifestBlob = new Blob([JSON.stringify(sampleManifest, null, 2)], {
      type: 'application/json'
    });
    const manifestUrl = URL.createObjectURL(manifestBlob);
    
    setManifestFile({
      file: new File([manifestBlob], 'manifest.json', { type: 'application/json' }),
      preview: manifestUrl,
      uploaded: false
    });
    toast.success('Sample manifest created successfully');
  };

  const handleConnectWallet = () => {
    connect(undefined, {
      onSuccess: () => {
        toast.success('Wallet connected successfully!');
      },
      onError: (error) => {
        toast.error(`Failed to connect wallet: ${error.message}`);
      },
    });
  };

  const handleStartVerification = () => {
    if (!currentAccount) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!mediaFile || !manifestFile) {
      toast.error('Please upload both media and manifest files');
      return;
    }

    setIsVerifying(true);
    setShowVerificationModal(true);
  };

  const handleVerificationComplete = (cert: any) => {
    setCertificate(cert);
    setShowVerificationModal(false);
    setShowCertificate(true);
    setIsVerifying(false);
    toast.success('Verification completed successfully!');
  };

  const handleDownloadCertificate = () => {
    if (!certificate) return;

    const certificateData = {
      ...certificate,
      downloadDate: new Date().toISOString(),
      network: 'testnet',
      verifier: 'VeriLens Truth Engine'
    };

    const dataStr = JSON.stringify(certificateData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `verilens-certificate-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Certificate downloaded successfully!');
  };

  const handleReset = () => {
    setMediaFile(null);
    setManifestFile(null);
    setCertificate(null);
    setShowCertificate(false);
    setIsVerifying(false);
    setSealEncryption(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center mb-6"
          >
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <div className="absolute inset-0 w-20 h-20 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full animate-ping opacity-20" />
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4"
          >
            VeriLens Blockchain Workflow Test
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-300 max-w-3xl mx-auto"
          >
            Test the complete end-to-end blockchain workflow with real Sui transactions, 
            Walrus storage, and provenance certificate minting.
          </motion.p>
        </div>

        {/* Wallet Connection */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <Wallet className="w-6 h-6 text-cyan-400" />
            <span>Wallet Connection</span>
          </h2>
          
          {currentAccount ? (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-semibold">Wallet Connected</span>
              </div>
              <p className="text-gray-300 font-mono text-sm">
                {currentAccount.address}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-400 mb-4">Connect your Sui wallet to start testing</p>
              <button
                onClick={handleConnectWallet}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 rounded-lg text-white font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Connect Wallet
              </button>
            </div>
          )}
        </motion.div>

        {/* File Upload Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-2 gap-8 mb-8"
        >
          {/* Media Upload */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <Upload className="w-5 h-5 text-cyan-400" />
              <span>Media File</span>
            </h3>
            
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-cyan-400 transition-colors">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                className="hidden"
                id="media-upload"
              />
              <label htmlFor="media-upload" className="cursor-pointer">
                {mediaFile ? (
                  <div className="space-y-3">
                    {mediaFile.file.type.startsWith('image/') && (
                      <img 
                        src={mediaFile.preview} 
                        alt="Preview" 
                        className="max-w-full max-h-32 mx-auto rounded-lg"
                      />
                    )}
                    <p className="text-green-400 font-semibold">✓ {mediaFile.file.name}</p>
                    <p className="text-gray-400 text-sm">
                      Size: {(mediaFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-12 h-12 text-gray-500 mx-auto" />
                    <p className="text-gray-400">Click to upload media file</p>
                    <p className="text-gray-500 text-sm">Supports images and videos up to 50MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Manifest Upload */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-400" />
              <span>Manifest File</span>
            </h3>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                <input
                  type="file"
                  accept=".json,.xml"
                  onChange={handleManifestUpload}
                  className="hidden"
                  id="manifest-upload"
                />
                <label htmlFor="manifest-upload" className="cursor-pointer">
                  {manifestFile ? (
                    <div className="space-y-3">
                      <p className="text-green-400 font-semibold">✓ {manifestFile.file.name}</p>
                      <p className="text-gray-400 text-sm">
                        Size: {(manifestFile.file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <FileText className="w-12 h-12 text-gray-500 mx-auto" />
                      <p className="text-gray-400">Click to upload manifest file</p>
                      <p className="text-gray-500 text-sm">Supports JSON and XML up to 5MB</p>
                    </div>
                  )}
                </label>
              </div>
              
              <button
                onClick={createSampleManifest}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
              >
                Create Sample Manifest
              </button>
            </div>
          </div>
        </motion.div>

        {/* Configuration Options */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700"
        >
          <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-400" />
            <span>Verification Options</span>
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sealEncryption}
                onChange={(e) => setSealEncryption(e.target.checked)}
                className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              />
              <div>
                <span className="text-white font-medium">Enable Seal Encryption</span>
                <p className="text-gray-400 text-sm">Add access controls and encryption to your certificate</p>
              </div>
            </label>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center space-y-4"
        >
          {!certificate && (
            <button
              onClick={handleStartVerification}
              disabled={!currentAccount || !mediaFile || !manifestFile || isVerifying}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl text-white font-bold text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 flex items-center space-x-3 mx-auto"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Start Blockchain Verification</span>
                </>
              )}
            </button>
          )}

          {certificate && (
            <div className="space-y-4">
              <button
                onClick={() => setShowCertificate(true)}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-xl text-white font-bold text-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-3 mx-auto"
              >
                <Shield className="w-5 h-5" />
                <span>View Provenance Certificate</span>
              </button>
              
              <button
                onClick={handleDownloadCertificate}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 rounded-xl text-white font-bold text-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-3 mx-auto"
              >
                <Download className="w-5 h-5" />
                <span>Download Certificate</span>
              </button>
            </div>
          )}

          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 font-medium transition-colors"
          >
            Reset Test
          </button>
        </motion.div>

        {/* Status Information */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12 bg-gray-800/30 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <span>Test Network Information</span>
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 mb-1">Network</p>
              <p className="text-cyan-400 font-mono">Sui Testnet</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Wallet Status</p>
              <p className={currentAccount ? 'text-green-400' : 'text-red-400'}>
                {currentAccount ? 'Connected' : 'Not Connected'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Media File</p>
              <p className={mediaFile ? 'text-green-400' : 'text-gray-500'}>
                {mediaFile ? 'Uploaded' : 'Not Uploaded'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Manifest File</p>
              <p className={manifestFile ? 'text-green-400' : 'text-gray-500'}>
                {manifestFile ? 'Uploaded' : 'Not Uploaded'}
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-300 text-sm">
              <strong>Note:</strong> This test uses real Sui testnet transactions. 
              You will need testnet SUI tokens for gas fees. Visit the Sui faucet to get testnet tokens.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <EnhancedUploadVerificationModal
        isOpen={showVerificationModal}
        onClose={() => {
          setShowVerificationModal(false);
          setIsVerifying(false);
        }}
        onComplete={handleVerificationComplete}
        mediaFile={mediaFile?.file!}
        manifestFile={manifestFile?.file!}
        walletAddress={currentAccount?.address || ''}
        sealEncryption={sealEncryption}
      />

      <EnhancedProvenanceCertificateComponent
        certificate={certificate}
        onClose={() => setShowCertificate(false)}
        onDownload={handleDownloadCertificate}
        network="testnet"
      />
    </div>
  );
}