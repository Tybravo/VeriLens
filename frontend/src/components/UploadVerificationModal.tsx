'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Circle, Upload, Lock, Shield, Award, FileText, AlertTriangle, Loader2 } from 'lucide-react';

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
}

const UploadVerificationModal: React.FC<UploadVerificationModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  mediaFile,
  manifestFile,
  walletAddress,
  sealEncryption = false,
}) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [stages, setStages] = useState<WorkflowStage[]>([
    {
      id: 'walrus-upload',
      title: 'Upload to Walrus',
      description: 'Storing media and manifest on decentralized storage',
      icon: Upload,
      status: 'pending',
    },
    {
      id: 'crypto-processing',
      title: 'Cryptographic Processing',
      description: 'Generating cryptographic proofs and hashes',
      icon: Lock,
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
      id: 'attestation-submission',
      title: 'Attestation Submission',
      description: 'Processing C2PA attestation and authenticity checks',
      icon: FileText,
      status: 'pending',
    },
    {
      id: 'certificate-sealing',
      title: 'Certificate Sealing',
      description: sealEncryption ? 'Applying Seal encryption and access controls' : 'Finalizing certificate metadata',
      icon: Award,
      status: 'pending',
    },
    {
      id: 'provenance-minting',
      title: 'Provenance Certificate Minting',
      description: 'Minting NFT certificate on Sui blockchain',
      icon: Award,
      status: 'pending',
    },
  ]);

  const [certificate, setCertificate] = useState<ProvenanceCertificate | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  // Simulate the complete Verilens workflow
  const processWorkflow = async () => {
    setIsProcessing(true);
    setHasFailed(false);

    for (let i = 0; i < stages.length; i++) {
      setCurrentStage(i);
      
      // Update current stage to processing
      setStages(prev => prev.map((stage, index) => 
        index === i ? { ...stage, status: 'processing' } : stage
      ));

      try {
        // Simulate processing time for each stage
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

        // Simulate potential failures (10% chance for demonstration)
        if (Math.random() < 0.1 && i > 0) {
          throw new Error(`Stage ${i + 1} failed due to network timeout`);
        }

        // Update stage to completed
        setStages(prev => prev.map((stage, index) => 
          index === i ? { ...stage, status: 'completed' } : stage
        ));

        // If this is the final stage, create the certificate
        if (i === stages.length - 1) {
          const newCertificate: ProvenanceCertificate = {
            title: 'Provably Authentic by Verilens',
            ownerAddress: walletAddress,
            certificationDate: new Date().toISOString(),
            mediaBlobId: `0x${Array.from({length: 64}, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}`,
            manifestBlobId: `0x${Array.from({length: 64}, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}`,
            verificationHash: `0x${Array.from({length: 64}, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}`,
            sealEncryption,
          };
          setCertificate(newCertificate);
          onComplete(newCertificate);
        }

      } catch (error) {
        // Update stage to failed
        setStages(prev => prev.map((stage, index) => 
          index === i ? { 
            ...stage, 
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          } : stage
        ));
        setHasFailed(true);
        setIsProcessing(false);
        break;
      }
    }

    setIsProcessing(false);
  };

  // Start processing when modal opens
  useEffect(() => {
    if (isOpen && !isProcessing && !certificate && !hasFailed) {
      processWorkflow();
    }
  }, [isOpen]);

  const handleRetry = () => {
    setCurrentStage(0);
    setStages(prev => prev.map(stage => ({ ...stage, status: 'pending', error: undefined })));
    setCertificate(null);
    setHasFailed(false);
    processWorkflow();
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
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
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
                    {getConnectingLine(index)}
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
                <p className="text-gray-300 mb-4">
                  The verification process encountered an error. You can retry the process or close this modal.
                </p>
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

            {/* Success State */}
            {certificate && !hasFailed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-green-900/20 border border-green-500/30 rounded-xl"
              >
                <div className="flex items-center mb-4">
                  <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                  <h3 className="text-lg font-semibold text-green-400">Verification Complete!</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  Your content has been successfully verified and a Provenance Certificate has been minted.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-primary hover:bg-primary/80 rounded-lg text-white font-medium transition-colors"
                  >
                    View Certificate
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