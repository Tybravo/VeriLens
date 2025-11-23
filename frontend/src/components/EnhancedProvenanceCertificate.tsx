'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Calendar, Wallet, Hash, Lock, CheckCircle, ExternalLink, Download, Copy, Zap, Award } from 'lucide-react';
import { ProvenanceCertificate } from './EnhancedUploadVerificationModal';

interface EnhancedProvenanceCertificateProps {
  certificate: ProvenanceCertificate;
  onClose: () => void;
  onDownload: () => void;
  network?: string;
}

const EnhancedProvenanceCertificateComponent: React.FC<EnhancedProvenanceCertificateProps> = ({
  certificate,
  onClose,
  onDownload,
  network = 'testnet',
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const formatAddress = (address: string, length: number = 6) => {
    if (address.length <= length * 2) return address;
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleViewTransaction = (transactionHash: string) => {
    const explorerUrl = `https://suiexplorer.com/txblock/${transactionHash}?network=${network}`;
    window.open(explorerUrl, '_blank');
  };

  const handleViewAddress = (address: string) => {
    const explorerUrl = `https://suiexplorer.com/address/${address}?network=${network}`;
    window.open(explorerUrl, '_blank');
  };

  const calculateTotalGas = () => {
    if (!certificate.gasUsed || certificate.gasUsed.length === 0) return '0';
    return certificate.gasUsed.reduce((total, gas) => {
      const amount = parseFloat(gas.replace(' SUI', ''));
      return total + (isNaN(amount) ? 0 : amount);
    }, 0).toFixed(4);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        exit={{ y: 20 }}
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-2xl p-8 max-w-3xl w-full shadow-2xl shadow-cyan-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Certificate Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Shield className="w-12 h-12 text-white" />
              </div>
              <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full animate-ping opacity-20" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Award className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
            {certificate.title}
          </h1>
          <p className="text-gray-300 text-lg">
            Cryptographically verified on the Sui blockchain
          </p>
          <div className="flex items-center justify-center mt-3 space-x-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-semibold">Blockchain Verified</span>
          </div>
        </div>

        {/* Certificate Content */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-6">
          {/* Owner Information */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
            <div className="flex items-center space-x-4">
              <Wallet className="w-6 h-6 text-cyan-400" />
              <div>
                <p className="text-gray-400 text-sm">Owner Address</p>
                <p className="text-white font-mono text-base">
                  {formatAddress(certificate.ownerAddress, 8)}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => copyToClipboard(certificate.ownerAddress, 'owner')}
                className="text-cyan-400 hover:text-cyan-300 transition-colors p-2 rounded hover:bg-gray-700"
                title="Copy address"
              >
                {copiedField === 'owner' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => handleViewAddress(certificate.ownerAddress)}
                className="text-purple-400 hover:text-purple-300 transition-colors p-2 rounded hover:bg-gray-700"
                title="View on explorer"
              >
                <ExternalLink className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Certification Date */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
            <div className="flex items-center space-x-4">
              <Calendar className="w-6 h-6 text-purple-400" />
              <div>
                <p className="text-gray-400 text-sm">Certification Date</p>
                <p className="text-white font-medium text-lg">
                  {formatDate(certificate.certificationDate)}
                </p>
              </div>
            </div>
            <CheckCircle className="w-6 h-6 text-green-400" />
          </div>

          {/* Media Blob ID */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
            <div className="flex items-center space-x-4">
              <Hash className="w-6 h-6 text-pink-400" />
              <div>
                <p className="text-gray-400 text-sm">Media Blob ID</p>
                <p className="text-white font-mono text-sm">
                  {formatAddress(certificate.mediaBlobId, 10)}
                </p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(certificate.mediaBlobId, 'media')}
              className="text-pink-400 hover:text-pink-300 transition-colors p-2 rounded hover:bg-gray-700"
              title="Copy media blob ID"
            >
              {copiedField === 'media' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Manifest Blob ID */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
            <div className="flex items-center space-x-4">
              <Hash className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-gray-400 text-sm">Manifest Blob ID</p>
                <p className="text-white font-mono text-sm">
                  {formatAddress(certificate.manifestBlobId, 10)}
                </p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(certificate.manifestBlobId, 'manifest')}
              className="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded hover:bg-gray-700"
              title="Copy manifest blob ID"
            >
              {copiedField === 'manifest' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Verification Hash */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
            <div className="flex items-center space-x-4">
              <Shield className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-gray-400 text-sm">Verification Hash</p>
                <p className="text-white font-mono text-sm">
                  {formatAddress(certificate.verificationHash, 12)}
                </p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(certificate.verificationHash, 'hash')}
              className="text-green-400 hover:text-green-300 transition-colors p-2 rounded hover:bg-gray-700"
              title="Copy verification hash"
            >
              {copiedField === 'hash' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Seal Encryption Status */}
          {certificate.sealEncryption && (
            <div className="flex items-center justify-between p-4 bg-purple-900/20 rounded-lg border border-purple-500/30 mb-6">
              <div className="flex items-center space-x-4">
                <Lock className="w-6 h-6 text-purple-400" />
                <div>
                  <p className="text-purple-300 font-medium text-lg">Seal Encryption Enabled</p>
                  <p className="text-purple-400 text-sm">Content protected with access controls</p>
                </div>
              </div>
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
            </div>
          )}

          {/* Blockchain Transaction Details */}
          {certificate.transactionHashes && certificate.transactionHashes.length > 0 && (
            <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span>Blockchain Transactions</span>
                </h4>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
                >
                  {showAdvanced ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
              
              <div className="mb-3">
                <p className="text-gray-400 text-sm mb-1">Total Gas Used</p>
                <p className="text-cyan-400 font-semibold text-xl">{calculateTotalGas()} SUI</p>
              </div>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    {certificate.transactionHashes.map((txHash, index) => (
                      <div key={txHash} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Transaction {index + 1}</p>
                          <p className="text-white font-mono text-sm">
                            {formatAddress(txHash, 8)}
                          </p>
                          {certificate.gasUsed?.[index] && (
                            <p className="text-gray-500 text-xs mt-1">
                              Gas: {certificate.gasUsed[index]}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleViewTransaction(txHash)}
                          className="text-purple-400 hover:text-purple-300 transition-colors p-2 rounded hover:bg-gray-700"
                          title="View transaction"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Certificate Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/VeriLens_Logo.png" 
              alt="VeriLens" 
              className="w-8 h-8 rounded-lg shadow-lg"
            />
            <div>
              <span className="text-white font-semibold">Powered by VeriLens Truth Engine</span>
              <p className="text-gray-400 text-xs">Blockchain authenticity verification</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onDownload}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 rounded-lg text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <Download className="w-5 h-5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-600 hover:border-gray-500 rounded-lg text-gray-300 font-semibold transition-colors hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>

        {/* Network Info */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 text-cyan-400 bg-gray-800/30 px-4 py-2 rounded-lg border border-cyan-500/30">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-sm">Verified on Sui {network.charAt(0).toUpperCase() + network.slice(1)}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EnhancedProvenanceCertificateComponent;