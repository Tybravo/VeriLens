'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useCurrentAccount, 
  useWallets, 
  useConnectWallet, 
  useDisconnectWallet 
} from '@mysten/dapp-kit';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { isEnokiWallet } from '@mysten/enoki';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}


const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const currentAccount = useCurrentAccount();
  const wallets = useWallets();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [justConnected, setJustConnected] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedShort, setCopiedShort] = useState(false);
  const [showZkLogin, setShowZkLogin] = useState(false);

  // Separate Enoki wallets from regular wallets
  const enokiWallets = wallets.filter(isEnokiWallet);
  const regularWallets = wallets.filter((wallet) => !isEnokiWallet(wallet));

  console.log('Enoki wallets:', enokiWallets);
  console.log('Regular wallets:', regularWallets);

  // Get specific social providers from Enoki wallets
  const googleWallet = enokiWallets.find((wallet) => wallet.provider === 'google');
  const facebookWallet = enokiWallets.find((wallet) => wallet.provider === 'facebook');
  const twitchWallet = enokiWallets.find((wallet) => wallet.provider === 'twitch');

  console.log('Social wallets found:', {
    google: !!googleWallet,
    facebook: !!facebookWallet,
    twitch: !!twitchWallet,
  });

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

  useEffect(() => {
    if (currentAccount && connectingWallet) {
      setJustConnected(true);
      setConnectingWallet(null);

      const timer = setTimeout(() => {
        setJustConnected(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentAccount, connectingWallet]);

  // Handle Enoki wallet connection
  const handleEnokiConnect = async (wallet: any, providerName: string) => {
    try {
      setConnectingWallet(providerName);

      // Store current page to redirect back after auth
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_redirect', window.location.pathname);
      }

      console.log(`Connecting to ${providerName}...`, wallet);

      connect(
        { wallet },
        {
          onSuccess: () => {
            console.log(`${providerName} connected successfully`);
          },
          onError: (error) => {
            console.error(`${providerName} connection error:`, error);
            setConnectingWallet(null);
            alert(`Failed to connect with ${providerName}: ${error.message || 'Unknown error'}`);
          },
        }
      );
    } catch (error) {
      console.error(`${providerName} connection error:`, error);
      setConnectingWallet(null);
      alert(`Failed to connect with ${providerName}`);
    }
  };

  const handleRegularWalletConnect = (wallet: any) => {
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
          alert(`Failed to connect: ${error.message || 'Unknown error'}`);
        },
      }
    );
  };

  const handleDisconnect = () => {
    disconnect();
    setJustConnected(false);
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

        <div className="overflow-y-auto pr-1 custom-scrollbar flex-1 px-4">
          {currentAccount ? (
            <>
              {/* Connected state - same as before */}
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
                      className="ml-3 p-2 rounded hover:bg-darkblue-light transition-colors"
                      aria-label="Copy address"
                    >
                      {copiedFull ? (
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8l4 4v10a2 2 0 01-2 2H8z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDisconnect}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors duration-200 border border-red-500/30 font-semibold flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Disconnect Wallet</span>
                  </motion.button>
                </div>
              </div>
            </>
          ) : (
            <div className="px-3">
              <p className="text-white mb-6 text-center">Select a wallet to connect to VeriLens</p>
              
              {/* zkLogin Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-300 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Social Login (zkLogin)
                  </h4>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowZkLogin(!showZkLogin)}
                    className="text-primary hover:text-primary-light text-xs font-medium transition-colors flex items-center"
                  >
                    {showZkLogin ? 'Hide' : 'Show'}
                    <svg 
                      className={`w-4 h-4 ml-1 transition-transform ${showZkLogin ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.button>
                </div>
                
                <AnimatePresence>
                  {showZkLogin && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2 mb-4 overflow-hidden"
                    >
                      {/* Google Login */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleEnokiConnect(googleWallet, 'Google')}
                        disabled={connectingWallet === 'Google' || !googleWallet}
                        className="w-full bg-white hover:bg-gray-100 text-gray-800 px-4 py-3 rounded-lg transition-colors duration-200 font-medium flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-wait"
                      >
                        {connectingWallet === 'Google' ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span>Continue with Google</span>
                          </>
                        )}
                      </motion.button>

                      {/* Facebook Login */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleEnokiConnect(facebookWallet, 'Facebook')}
                        disabled={connectingWallet === 'Facebook' || !facebookWallet}
                        className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white px-4 py-3 rounded-lg transition-colors duration-200 font-medium flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-wait"
                      >
                        {connectingWallet === 'Facebook' ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            <span>Continue with Facebook</span>
                          </>
                        )}
                      </motion.button>

                      {/* Twitch Login */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleEnokiConnect(twitchWallet, 'Twitch')}
                        disabled={connectingWallet === 'Twitch' || !twitchWallet}
                        className="w-full bg-[#9146FF] hover:bg-[#7D3CE8] text-white px-4 py-3 rounded-lg transition-colors duration-200 font-medium flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-wait"
                      >
                        {connectingWallet === 'Twitch' ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                            </svg>
                            <span>Continue with Twitch</span>
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-darkblue px-2 text-gray-400">Or use wallet extension</span>
                  </div>
                </div>
              </div>

              {/* Regular Wallets */}
              {regularWallets.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-400 mb-4">No wallets detected</p>
                  <p className="text-xs text-gray-500">Please install a Sui-compatible wallet extension</p>
                </motion.div>
              ) : (
                <AnimatePresence>
                  {regularWallets.map((wallet, index) => {
                    const isThisWalletConnecting = connectingWallet === wallet.name;
                    
                    return (
                      <motion.button
                        key={wallet.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full btn-primary-glow rounded-xl px-4 py-3 text-sm font-medium mb-3 flex items-center justify-center transition-colors duration-200 ${
                          isThisWalletConnecting 
                            ? 'bg-primary-dark text-white opacity-80 cursor-wait' 
                            : 'bg-primary hover:bg-primary-dark text-white'
                        }`}
                        onClick={() => handleRegularWalletConnect(wallet)}
                        disabled={isThisWalletConnecting}
                      >
                        {isThisWalletConnecting ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Connecting to {wallet.name}...
                          </>
                        ) : (
                          <>
                            {wallet.icon ? (
                              <Image
                                src={wallet.icon}
                                alt={`${wallet.name} icon`}
                                width={20}
                                height={20}
                                className="mr-2 flex-shrink-0 rounded"
                              />
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                            )}
                            <span className="truncate">Connect {wallet.name}</span>
                          </>
                        )}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              )}
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