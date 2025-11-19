'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from "framer-motion";
import { useSuiClientContext, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { usePathname } from 'next/navigation';
import WalletModal from './WalletModal';
import RouteProgressBar from './RouteProgressBar';

const Header = () => {
  const ctx = useSuiClientContext();
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const [currentNetwork, setCurrentNetwork] = useState('testnet');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isEcosystemDropdownOpen, setIsEcosystemDropdownOpen] = useState(false);
  const pathname = usePathname();

  const { scrollYProgress } = useScroll();
  const headerY = useTransform(scrollYProgress, [0, 1], [0, -8]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2, 1], [0.95, 0.98, 1]);
  const [copiedDesktop, setCopiedDesktop] = useState(false);
  const [copiedMobile, setCopiedMobile] = useState(false);
  const handleCopy = (scope) => {
    if (!currentAccount) return;
    navigator.clipboard.writeText(currentAccount.address);
    if (scope === 'desktop') {
      setCopiedDesktop(true);
      setTimeout(() => setCopiedDesktop(false), 1500);
    } else {
      setCopiedMobile(true);
      setTimeout(() => setCopiedMobile(false), 1500);
    }
  };

  useEffect(() => {
    setIsMenuOpen(false);
    setIsEcosystemDropdownOpen(false);
  }, [pathname]);

  return (
    <motion.header
      className="sticky top-0 z-[1000] bg-darkblue backdrop-blur-sm shadow-[0_12px_24px_-12px_rgba(186,85,211,0.6)]"
      style={{ y: headerY, opacity: headerOpacity }}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 20 }}
    >
      <nav className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-2">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          {/* Logo - Floated Left */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/VeriLens_Logo.png" // Assuming the logo file itself is not changing
                alt="VeriLens Logo"
                width={32}
                height={32}
                className="h-8 sm:h-10 w-auto"
              />
              <span className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold text-secondary-light VeriLens">VeriLens</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link href="/" className="text-secondary hover:text-primary transition-colors">
                HOME
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link href="/about" className="text-secondary hover:text-primary transition-colors">
                ABOUT US
              </Link>
            </motion.div>
            <div className="relative group"> {/* Parent container for dropdown */}
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link href="/ecosystem" className="text-secondary hover:text-primary transition-colors flex items-center"> {/* Added flex and items-center */}
                  ECOSYSTEM
                  {/* Add an icon for dropdown if needed, e.g., a chevron down */}
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </Link>
              </motion.div>
              {/* Dropdown Menu */}
              <div className="absolute hidden group-hover:block bg-darkblue-light text-secondary-light rounded-lg shadow-lg py-2 px-4 w-48 z-50 top-full left-0">
                <Link href="/creator/upload-content" className="block px-4 py-2 hover:bg-primary/20 rounded-md">Creator</Link>
                <Link href="/ecosystem/developer" className="block px-4 py-2 hover:bg-primary/20 rounded-md">Developer</Link>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link href="/creator/generate-manifest?close=1" className="text-secondary hover:text-primary transition-colors">
                INSTANCES
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link href="/ambassadors" className="text-secondary hover:text-primary transition-colors">
                AMBASSADORS
              </Link>
            </motion.div>
          </div>

          {/* Network Selection and Connect Wallet */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <select
              value={currentNetwork}
              onChange={(e) => {
                setCurrentNetwork(e.target.value);
                ctx.selectNetwork(e.target.value);
              }}
              className="bg-darkblue-light text-gray-300 rounded-lg px-3 py-1 border border-gray-700 focus:outline-none focus:border-primary"
            >
              <option value="testnet">Testnet</option>
              <option value="mainnet">Mainnet</option>
              <option value="localnet">Localnet</option>
            </select>
            
            {currentAccount ? (
                <div className="flex items-center space-x-4">
                  <span className="text-primary font-mono text-sm">
                    {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
                  </span>
                  <button
                    onClick={() => handleCopy('desktop')}
                    className="p-2 rounded hover:bg-darkblue-light"
                    aria-label="Copy address"
                  >
                    {copiedDesktop ? (
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8M8 8h8M4 6a2 2 0 012-2h8l4 4v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => disconnect()}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all duration-300 border border-red-500/30 shadow-glow"
                  >
                    Disconnect
                  </button>
                </div>
            ) : (
              <button
                onClick={() => setIsWalletModalOpen(true)}
                className="bg-black hover:bg-secondary text-white px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 border border-white/30 shadow-button-glow hover:shadow-lg"
              >
                Connect Wallet
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white p-2"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 bg-primary/10 rounded-lg mt-2">
            <div className="space-y-2 px-4">
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link href="/" className="block text-secondary-light hover:text-primary transition py-2 border-b border-primary/20" onClick={() => setIsMenuOpen(false)}>
                  HOME
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link href="/about" className="block text-secondary-light hover:text-primary transition py-2 border-b border-primary/20" onClick={() => setIsMenuOpen(false)}>
                  ABOUT US
                </Link>
              </motion.div>
              <div className="relative"> {/* Parent container for mobile dropdown */}
                <button
                  onClick={() => setIsEcosystemDropdownOpen(!isEcosystemDropdownOpen)}
                  className="block text-secondary-light hover:text-primary transition py-2 w-full text-left flex items-center justify-between" // Added flex and justify-between
                >
                  ECOSYSTEM
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                {isEcosystemDropdownOpen && (
                  <div className="ml-4 mt-2 space-y-2">
                    <Link href="/creator/upload-content" className="block text-secondary-light hover:text-primary transition py-1" onClick={() => { setIsMenuOpen(false); setIsEcosystemDropdownOpen(false); }}>Creator</Link>
                    <Link href="/ecosystem/developer" className="block text-secondary-light hover:text-primary transition py-1" onClick={() => { setIsMenuOpen(false); setIsEcosystemDropdownOpen(false); }}>Developer</Link>
                  </div>
                )}
              </div>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link href="/creator/generate-manifest?close=1" className="block text-secondary-light hover:text-primary transition py-2 border-b border-primary/20" onClick={() => setIsMenuOpen(false)}>
                  INSTANCES
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link href="/ambassadors" className="block text-secondary-light hover:text-primary transition py-2 border-b border-primary/20" onClick={() => setIsMenuOpen(false)}>
                  AMBASSADORS
                </Link>
              </motion.div>
              
              <div className="pt-4 space-y-4">
                <select
                  value={currentNetwork}
                  onChange={(e) => {
                    setCurrentNetwork(e.target.value);
                    ctx.selectNetwork(e.target.value);
                  }}
                  className="w-full bg-white text-black rounded-lg px-3 py-2 border border-white/60 shadow-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                >
                  <option value="testnet">Testnet</option>
                  <option value="mainnet">Mainnet</option>
                  <option value="localnet">Localnet</option>
                </select>
                {currentAccount ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-2 text-primary font-mono text-sm p-2 bg-darkblue-light rounded-lg">
                        <span>{currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}</span>
                        <button
                          onClick={() => handleCopy('mobile')}
                          className="p-1 rounded hover:bg-primary/20"
                          aria-label="Copy address"
                        >
                          {copiedMobile ? (
                            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8M8 8h8M4 6a2 2 0 012-2h8l4 4v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <button
                        onClick={() => disconnect()}
                        className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-all duration-300 border border-red-500/30 shadow-glow"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                  <button
                    onClick={() => setIsWalletModalOpen(true)}
                    className="w-full bg-black hover:bg-secondary text-white px-6 py-2 rounded-lg transition-all duration-300 border border-white/30 shadow-button-glow"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
      <RouteProgressBar />
      
      <WalletModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
      />
    </motion.header>
  );
};

export default Header;
