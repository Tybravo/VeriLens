'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Calendar, Wallet, Hash, Lock, CheckCircle, ExternalLink, Download } from 'lucide-react';
import { ProvenanceCertificate } from './UploadVerificationModal';

interface ProvenanceCertificateComponentProps {
  certificate: ProvenanceCertificate;
  onClose: () => void;
  onDownload: () => void;
  network?: string;
}

const ProvenanceCertificateComponent: React.FC<ProvenanceCertificateComponentProps> = ({
  certificate,
  onClose,
  onDownload,
  network = 'testnet',
}) => {
  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-2xl p-8 max-w-2xl w-full shadow-2xl shadow-cyan-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Certificate Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div className="absolute inset-0 w-16 h-16 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full animate-ping opacity-20" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            {certificate.title}
          </h1>
          <p className="text-gray-300 text-sm">
            Cryptographically verified on the Sui blockchain
          </p>
        </div>

        {/* Certificate Content */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-6">
          {/* Owner Information */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <Wallet className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-gray-400 text-sm">Owner Address</p>
                <p className="text-white font-mono text-sm">
                  {formatAddress(certificate.ownerAddress)}
                </p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(certificate.ownerAddress)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors p-1 rounded hover:bg-gray-700"
              title="Copy address"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {/* Certification Date */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-gray-400 text-sm">Certification Date</p>
                <p className="text-white font-medium">
                  {formatDate(certificate.certificationDate)}
                </p>
              </div>
            </div>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>

          {/* Media Blob ID */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <Hash className="w-5 h-5 text-pink-400" />
              <div>
                <p className="text-gray-400 text-sm">Media Blob ID</p>
                <p className="text-white font-mono text-sm">
                  {formatAddress(certificate.mediaBlobId)}
                </p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(certificate.mediaBlobId)}
              className="text-pink-400 hover:text-pink-300 transition-colors p-1 rounded hover:bg-gray-700"
              title="Copy media blob ID"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {/* Manifest Blob ID */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <Hash className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-gray-400 text-sm">Manifest Blob ID</p>
                <p className="text-white font-mono text-sm">
                  {formatAddress(certificate.manifestBlobId)}
                </p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(certificate.manifestBlobId)}
              className="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded hover:bg-gray-700"
              title="Copy manifest blob ID"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {/* Verification Hash */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-gray-400 text-sm">Verification Hash</p>
                <p className="text-white font-mono text-sm">
                  {formatAddress(certificate.verificationHash)}
                </p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(certificate.verificationHash)}
              className="text-green-400 hover:text-green-300 transition-colors p-1 rounded hover:bg-gray-700"
              title="Copy verification hash"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {/* Seal Encryption Status */}
          {certificate.sealEncryption && (
            <div className="flex items-center justify-between p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
              <div className="flex items-center space-x-3">
                <Lock className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-purple-300 font-medium">Seal Encryption Enabled</p>
                  <p className="text-purple-400 text-sm">Content protected with access controls</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            </div>
          )}
        </div>

        {/* Certificate Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-400">
            <img 
              src="/VeriLens_Logo.png" 
              alt="VeriLens" 
              className="w-6 h-6 rounded"
            />
            <span className="text-sm">Powered by VeriLens Truth Engine</span>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onDownload}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 rounded-lg text-white font-medium transition-all duration-300 transform hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 hover:border-gray-500 rounded-lg text-gray-300 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Blockchain Verification Link */}
        <div className="mt-6 text-center">
          <a
            href={`https://suiexplorer.com/address/${certificate.ownerAddress}?network=${network}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
          >
            <span>View on Sui Explorer</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProvenanceCertificateComponent;