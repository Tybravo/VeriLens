// WalletModal component - Fixed hover effects and modal sizing
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrentAccount, useWallets, useConnectWallet, useDisconnectWallet } from '@mysten/dapp-kit';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const currentAccount = useCurrentAccount();
  const wallets = useWallets();
  const { mutate: connect, isPending: isConnecting } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [justConnected, setJustConnected] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedShort, setCopiedShort] = useState(false);
  const copyAddress = (target: 'full' | 'short') => {
    if (!currentAccount) return;
    navigator.clipboard.writeText(currentAccount.address);
    if (target === 'full') {
      setCopiedFull(true);
      setTimeout(() => setCopiedFull(false), 1500);
    } else {
      setCopiedShort(true);
      setTimeout(() => setCopiedShort(false), 1500);
    }
  };

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Show success animation when account connects
  useEffect(() => {
    if (currentAccount && connectingWallet) {
      setJustConnected(true);
      setConnectingWallet(null);
      
      // Auto-hide success message after 2 seconds
      const timer = setTimeout(() => {
        setJustConnected(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [currentAccount, connectingWallet]);

  const handleConnect = (wallet: any) => {
    setConnectingWallet(wallet.name);
    
    connect(
      { wallet },
      {
        onSuccess: () => {
          console.log('Wallet connected successfully');
        },
        onError: (error) => {
          console.error('Connection error:', error);
          setConnectingWallet(null);
          // Optional: Add error toast notification here
          alert(`Failed to connect: ${error.message || 'Unknown error'}`);
        },
      }
    );
  };

  const handleDisconnect = () => {
    disconnect();
    setJustConnected(false);
    // Optional: Auto-close modal after disconnect
    setTimeout(() => onClose(), 300);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass rounded-2xl p-6 max-w-md w-full shadow-[0_0_20px_rgba(6,182,212,0.5)] max-h-[85vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-4 border-b border-secondary-light/30 pb-4 flex-shrink-0">
          <h3 className="text-xl font-semibold text-secondary-light">
            {currentAccount ? 'Wallet Connected' : 'Connect Wallet'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto pr-1 custom-scrollbar flex-1">
          {currentAccount ? (
            <>
              {/* Success Animation */}
              <AnimatePresence>
                {justConnected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-xl"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-green-400 font-semibold">Successfully Connected!</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Connected Wallet Display */}
              <div className="bg-secondary-light/10 border border-secondary-light/30 rounded-xl p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white text-sm font-medium">Connected Wallet</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-green-400 text-xs font-semibold">Active</span>
                  </div>
                </div>
                
                <div className="bg-darkblue border border-cyan-500/20 rounded-lg p-4 mb-4">
                  <p className="text-xs text-gray-400 mb-2">Wallet Address:</p>
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-300 font-mono text-sm break-all">
                      {currentAccount.address}
                    </span>
                    <button
                      onClick={() => copyAddress('full')}
                      className="ml-3 p-2 rounded hover:bg-darkblue-light"
                      aria-label="Copy address"
                    >
                      {copiedFull ? (
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8M8 8h8M4 6a2 2 0 012-2h8l4 4v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between bg-darkblue-light rounded-lg p-3">
                    <span className="text-cyan-300 font-mono text-base font-semibold">
                      {currentAccount.address.slice(0, 8)}...{currentAccount.address.slice(-6)}
                    </span>
                    <button
                      onClick={() => copyAddress('short')}
                      className="p-2 rounded bg-cyan-500/20 hover:bg-cyan-500/30"
                      aria-label="Copy address"
                    >
                      {copiedShort ? (
                        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8M8 8h8M4 6a2 2 0 012-2h8l4 4v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Action Buttons - Fixed hover effects */}
                <div className="space-y-3">
                  <button
                    onClick={handleDisconnect}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors duration-200 border border-red-500/30 shadow-button-glow font-semibold flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Disconnect Wallet</span>
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="w-full bg-transparent border border-secondary-light/30 hover:bg-secondary-light/10 text-secondary-light px-4 py-3 rounded-lg transition-colors duration-200 font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Wallet Info */}
              <div className="text-xs text-gray-400 mt-4 p-3 bg-darkblue/50 rounded-lg border border-gray-700/30">
                <p className="flex items-center justify-center space-x-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>You can also disconnect from the header menu</span>
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-white mb-6 text-center">Select a wallet to connect to VeriLens</p>
              
              {wallets.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-400 mb-4">No wallets detected</p>
                  <p className="text-xs text-gray-500">Please install a Sui-compatible wallet extension</p>
                </div>
              ) : (
                wallets.map((wallet) => {
                  const isThisWalletConnecting = connectingWallet === wallet.name;
                  
                  return (
                    <button
                      key={wallet.name}
                      className={`w-full btn-primary-glow rounded-xl px-4 py-3 text-sm font-medium mb-3 flex items-center justify-center transition-colors duration-200 ${
                        isThisWalletConnecting 
                          ? 'bg-primary-dark text-white opacity-80 cursor-wait' 
                          : 'bg-primary hover:bg-primary-dark text-white'
                      }`}
                      onClick={() => handleConnect(wallet)}
                      disabled={isThisWalletConnecting}
                    >
                      {isThisWalletConnecting ? (
                        <>
                          <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Connecting to {wallet.name}...
                        </>
                      ) : (
                        <>
                          {wallet.name.toLowerCase().includes('sui') && (
                            <svg className="h-5 w-5 mr-2 text-secondary flex-shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 7.163 32 16 32C24.837 32 32 24.837 32 16C32 7.163 24.837 0 16 0Z" fill="#6FBCF0"/>
                              <path d="M23.5 16.5C23.5 20.366 20.366 23.5 16.5 23.5C12.634 23.5 9.5 20.366 9.5 16.5C9.5 12.634 12.634 9.5 16.5 9.5C20.366 9.5 23.5 12.634 23.5 16.5Z" fill="white"/>
                              <path d="M16.5 20.5C18.7091 20.5 20.5 18.7091 20.5 16.5C20.5 14.2909 18.7091 12.5 16.5 12.5C14.2909 12.5 12.5 14.2909 12.5 16.5C12.5 18.7091 14.2909 20.5 16.5 20.5Z" fill="#6FBCF0"/>
                            </svg>
                          )}
                          {wallet.name.toLowerCase().includes('suiet') && (
                            <svg className="h-5 w-5 mr-2 text-secondary flex-shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect width="32" height="32" rx="16" fill="#FF5F5F"/>
                              <path d="M9 16C9 12.134 12.134 9 16 9C19.866 9 23 12.134 23 16C23 19.866 19.866 23 16 23C12.134 23 9 19.866 9 16Z" fill="white"/>
                              <path d="M13 16C13 14.343 14.343 13 16 13C17.657 13 19 14.343 19 16C19 17.657 17.657 19 16 19C14.343 19 13 17.657 13 16Z" fill="#FF5F5F"/>
                            </svg>
                          )}
                          {wallet.name.toLowerCase().includes('ethos') && (
                            <svg className="h-5 w-5 mr-2 text-secondary flex-shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect width="32" height="32" rx="16" fill="#2D2D2D"/>
                              <path d="M8 12H24V20H8V12Z" fill="#00FFCE"/>
                              <path d="M12 16H20V24H12V16Z" fill="#00FFCE"/>
                            </svg>
                          )}
                          {wallet.name.toLowerCase().includes('sluch') && (
                            <svg className="h-5 w-5 mr-2 text-secondary flex-shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect width="32" height="32" rx="16" fill="#6F4CFF"/>
                              <path d="M9 13.5L16 9L23 13.5V22.5L16 27L9 22.5V13.5Z" fill="white"/>
                              <path d="M12 16.5L16 14L20 16.5V21.5L16 24L12 21.5V16.5Z" fill="#6F4CFF"/>
                            </svg>
                          )}
                          {!wallet.name.toLowerCase().includes('sui') && 
                           !wallet.name.toLowerCase().includes('suiet') && 
                           !wallet.name.toLowerCase().includes('ethos') && 
                           !wallet.name.toLowerCase().includes('sluch') && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          )}
                          <span className="truncate">Connect {wallet.name}</span>
                        </>
                      )}
                    </button>
                  );
                })
              )}
            </>
          )}

          {!currentAccount && wallets.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400 mb-2">
                Don't see your wallet? Make sure it's installed and unlocked.
              </p>
            </div>
          )}

          <p className="mt-6 text-xs text-gray-400 text-center">
            By connecting your wallet, you agree to the VeriLens Terms of Service and Privacy Policy
          </p>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default WalletModal;
