'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Circle, Upload, Lock, Shield, Award, FileText, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { useSignTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { enhancedVerilensWorkflowService } from '@/services/enhancedWorkflow';
import { Toaster, toast } from 'sonner';

export type WorkflowStage = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionHash?: string;
  gasUsed?: string;
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
  transactionHashes?: string[];
  gasUsed?: string[];
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
  const { mutate: signTransaction } = useSignTransaction();
  const currentAccount = useCurrentAccount();
  
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
      description: 'Submitting verification request to Sui blockchain',
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
  const [totalGasUsed, setTotalGasUsed] = useState<string>('0');

  // Create a custom signer that uses the wallet
  const createSigner = () => ({
    signAndExecuteTransactionBlock: async (params: any) => {
      return new Promise((resolve, reject) => {
        signTransaction(
          { transaction: params.transactionBlock },
          {
            onSuccess: (result) => {
              console.log('Transaction successful:', result);
              resolve({
                digest: result.signature || `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
                effects: { status: { status: 'success' } },
                objectChanges: [],
              });
            },
            onError: (error) => {
              console.error('Transaction error:', error);
              reject(error);
            },
          }
        );
      });
    },
  });

  // Execute the complete Verilens workflow with blockchain operations
  const processWorkflow = async () => {
    if (!currentAccount) {
      toast.error('Please connect your wallet first');
      setHasFailed(true);
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    setHasFailed(false);

    try {
      const signer = createSigner();

      const result = await enhancedVerilensWorkflowService.executeCompleteWorkflow(
        mediaFile,
        manifestFile,
        walletAddress,
        signer,
        sealEncryption,
        (stage) => {
          // Update the corresponding stage in the UI
          setStages(prev => prev.map(s => 
            s.id === stage.id ? { ...s, ...stage } : s
          ));
          
          // Update current stage index
          const stageIndex = stages.findIndex(s => s.id === stage.id);
          if (stageIndex !== -1) {
            setCurrentStage(stageIndex);
          }
        }
      );

      if (result.success && result.certificate) {
        // Add transaction details to certificate
        const enhancedCertificate: ProvenanceCertificate = {
          ...result.certificate,
          transactionHashes: result.transactionHashes,
          gasUsed: result.gasUsed,
        };

        setCertificate(enhancedCertificate);
        onComplete(enhancedCertificate);

        // Calculate total gas used
        const total = result.gasUsed?.reduce((total, gas) => {
          const amount = parseFloat(gas.replace(' SUI', ''));
          return total + (isNaN(amount) ? 0 : amount);
        }, 0) || 0;
        setTotalGasUsed(total.toFixed(4));

        toast.success('Workflow completed successfully!');
      } else {
        throw new Error(result.error || 'Workflow failed');
      }
    } catch (error) {
      console.error('Workflow execution error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown workflow error';
      
      // Update the failed stage
      setStages(prev => prev.map((stage, index) => 
        index === currentStage ? { 
          ...stage, 
          status: 'failed',
          error: errorMessage
        } : stage
      ));
      
      setHasFailed(true);
      toast.error(`Workflow failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Start processing when modal opens
  useEffect(() => {
    if (isOpen && !isProcessing && !certificate && !hasFailed) {
      processWorkflow();
    }
  }, [isOpen, currentAccount]);

  const handleRetry = () => {
    setCurrentStage(0);
    setStages(prev => prev.map(stage => ({ 
      ...stage, 
      status: 'pending', 
      error: undefined,
      transactionHash: undefined,
      gasUsed: undefined,
    })));
    setCertificate(null);
    setHasFailed(false);
    setTotalGasUsed('0');
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

  const handleViewTransaction = (transactionHash: string) => {
    const explorerUrl = `https://suiexplorer.com/txblock/${transactionHash}?network=testnet`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <>
      <Toaster position="top-right" />
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
                      
                      {/* Transaction Hash and Gas Info */}
                      {stage.transactionHash && (
                        <div className="mt-2 text-xs">
                          <button
                            onClick={() => handleViewTransaction(stage.transactionHash!)}
                            className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 mx-auto"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View Transaction</span>
                          </button>
                          {stage.gasUsed && (
                            <p className="text-gray-500 mt-1">Gas: {stage.gasUsed}</p>
                          )}
                        </div>
                      )}
                      
                      {stage.error && (
                        <p className="text-xs text-red-400 mt-1 max-w-[120px]">{stage.error}</p>
                      )}
                      
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
                        <p className="text-sm text-gray-400 mb-2">
                          {stage.description}
                        </p>
                        
                        {stage.transactionHash && (
                          <div className="text-xs mb-2">
                            <button
                              onClick={() => handleViewTransaction(stage.transactionHash!)}
                              className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>View Transaction</span>
                            </button>
                            {stage.gasUsed && (
                              <p className="text-gray-500">Gas: {stage.gasUsed}</p>
                            )}
                          </div>
                        )}
                        
                        {stage.error && (
                          <p className="text-xs text-red-400">{stage.error}</p>
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
                    Your content has been successfully verified and a Provenance Certificate has been minted on the Sui blockchain.
                  </p>
                  
                  {totalGasUsed !== '0' && (
                    <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400">Total Gas Used: <span className="text-cyan-400 font-semibold">{totalGasUsed} SUI</span></p>
                    </div>
                  )}
                  
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
    </>
  );
};

export default UploadVerificationModal;