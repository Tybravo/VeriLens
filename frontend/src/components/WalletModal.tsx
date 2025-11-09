// WalletModal component
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useCurrentAccount, useWallets, useConnectWallet, useDisconnectWallet } from '@mysten/dapp-kit';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const currentAccount = useCurrentAccount();
  const wallets = useWallets();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass rounded-2xl p-6 max-w-md w-full shadow-[0_0_20px_rgba(6,182,212,0.5)] max-h-[80vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-4 border-b border-cyan-500/30 pb-4">
          <h3 className="text-xl font-semibold text-white">Connect Wallet</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-center overflow-y-auto pr-1 custom-scrollbar">
          {currentAccount ? (
            <>
              <div className="bg-cyan-500/20 rounded-xl p-4 mb-4">
                <p className="text-sm text-white mb-2">Connected as:</p>
                <p className="text-cyan-300 font-mono break-all text-sm">{currentAccount.address}</p>
              </div>
              
              {/* Selection box with connected address and disconnect button */}
              <div className="bg-darkblue-light border border-cyan-500/30 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-sm font-medium">Connected Wallet</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-green-400 text-xs">Connected</span>
                  </div>
                </div>
                
                <div className="bg-darkblue border border-cyan-500/20 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-300 font-mono text-xs">
                      {currentAccount.address.slice(0, 8)}...{currentAccount.address.slice(-6)}
                    </span>
                    <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-darkblue" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    disconnect();
                    onClose();
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all duration-300 border border-red-500/30 shadow-button-glow"
                >
                  Disconnect Wallet
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-white mb-6">Select a wallet to connect to StarFundMe</p>
              
              {wallets.map((wallet) => (
                <button
                  key={wallet.name}
                  className="w-full btn-primary-glow rounded-xl px-4 py-3 text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white mb-2 flex items-center justify-center"
                  onClick={() => {
                    connect({ wallet });
                  }}
                >
                  {wallet.name.toLowerCase().includes('sui') && (
                    <svg className="h-5 w-5 mr-2 text-orange-400" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 7.163 32 16 32C24.837 32 32 24.837 32 16C32 7.163 24.837 0 16 0Z" fill="#6FBCF0"/>
                      <path d="M23.5 16.5C23.5 20.366 20.366 23.5 16.5 23.5C12.634 23.5 9.5 20.366 9.5 16.5C9.5 12.634 12.634 9.5 16.5 9.5C20.366 9.5 23.5 12.634 23.5 16.5Z" fill="white"/>
                      <path d="M16.5 20.5C18.7091 20.5 20.5 18.7091 20.5 16.5C20.5 14.2909 18.7091 12.5 16.5 12.5C14.2909 12.5 12.5 14.2909 12.5 16.5C12.5 18.7091 14.2909 20.5 16.5 20.5Z" fill="#6FBCF0"/>
                    </svg>
                  )}
                  {wallet.name.toLowerCase().includes('suiet') && (
                    <svg className="h-5 w-5 mr-2 text-orange-400" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="32" height="32" rx="16" fill="#FF5F5F"/>
                      <path d="M9 16C9 12.134 12.134 9 16 9C19.866 9 23 12.134 23 16C23 19.866 19.866 23 16 23C12.134 23 9 19.866 9 16Z" fill="white"/>
                      <path d="M13 16C13 14.343 14.343 13 16 13C17.657 13 19 14.343 19 16C19 17.657 17.657 19 16 19C14.343 19 13 17.657 13 16Z" fill="#FF5F5F"/>
                    </svg>
                  )}
                  {wallet.name.toLowerCase().includes('ethos') && (
                    <svg className="h-5 w-5 mr-2 text-orange-400" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="32" height="32" rx="16" fill="#2D2D2D"/>
                      <path d="M8 12H24V20H8V12Z" fill="#00FFCE"/>
                      <path d="M12 16H20V24H12V16Z" fill="#00FFCE"/>
                    </svg>
                  )}
                  {wallet.name.toLowerCase().includes('sluch') && (
                    <svg className="h-5 w-5 mr-2 text-orange-400" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="32" height="32" rx="16" fill="#6F4CFF"/>
                      <path d="M9 13.5L16 9L23 13.5V22.5L16 27L9 22.5V13.5Z" fill="white"/>
                      <path d="M12 16.5L16 14L20 16.5V21.5L16 24L12 21.5V16.5Z" fill="#6F4CFF"/>
                    </svg>
                  )}
                  {!wallet.name.toLowerCase().includes('sui') && 
                   !wallet.name.toLowerCase().includes('suiet') && 
                   !wallet.name.toLowerCase().includes('ethos') && 
                   !wallet.name.toLowerCase().includes('sluch') && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  )}
                  Connect {wallet.name}
                </button>
              ))}
            </>
          )}

          {!currentAccount && (
            <div className="mt-4 text-center">
              <p className="text-xs text-white mb-2">
                Don't see any wallets? Install a Sui-compatible wallet (e.g., Sui Wallet, Suiet, Ethos) and reload.
              </p>
              
              <div className="flex items-center my-6">
                <div className="flex-grow h-px bg-gray-400"></div>
                <p className="mx-4 text-sm text-white">Or connect with google</p>
                <div className="flex-grow h-px bg-gray-400"></div>
              </div>
              
              <button 
                className="w-full btn-primary-glow rounded-xl px-4 py-3 text-sm font-medium bg-teal-700 hover:bg-teal-500 text-white mb-2 flex items-center justify-center"
                onClick={() => {
                  // Google OAuth ZK-Login logic will go here
                  console.log("Google OAuth ZK-Login clicked");
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                </svg>
                Continue with Google
              </button>
            </div>
          )}

          <p className="mt-6 text-xs text-white">
            By connecting your wallet, you agree to the StarFundMe Terms of Service and Privacy Policy
          </p>
          
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default WalletModal;

