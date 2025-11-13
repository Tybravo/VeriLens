'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from "framer-motion";
import { useSuiClientContext, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import WalletModal from './WalletModal';

const Header = () => {
  const ctx = useSuiClientContext();
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const [currentNetwork, setCurrentNetwork] = useState('testnet');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isEcosystemDropdownOpen, setIsEcosystemDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[1000] bg-darkblue backdrop-blur-sm shadow-[0_12px_24px_-12px_rgba(186,85,211,0.6)]">
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
              <div className="absolute hidden group-hover:block bg-darkblue-light text-secondary-light rounded-lg shadow-lg py-2 px-4 mt-2 w-48 z-50">
                <Link href="/ecosystem/creator" className="block px-4 py-2 hover:bg-primary/20 rounded-md">Creator</Link>
                <Link href="/ecosystem/developer" className="block px-4 py-2 hover:bg-primary/20 rounded-md">Developer</Link>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link href="/instances" className="text-secondary hover:text-primary transition-colors">
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
                <Link href="/" className="block text-secondary-light hover:text-primary transition py-2 border-b border-primary/20">
                  HOME
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link href="/about" className="block text-secondary-light hover:text-primary transition py-2 border-b border-primary/20">
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
                  <div className="ml-4 mt-2 space-y-2"> {/* Indented dropdown items */}
                    <Link href="/ecosystem/creator" className="block text-secondary-light hover:text-primary transition py-1">Creator</Link>
                    <Link href="/ecosystem/developer" className="block text-secondary-light hover:text-primary transition py-1">Developer</Link>
                  </div>
                )}
              </div>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link href="/instances" className="block text-secondary-light hover:text-primary transition py-2 border-b border-primary/20">
                  INSTANCES
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link href="/ambassadors" className="block text-secondary-light hover:text-primary transition py-2 border-b border-primary/20">
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
                  className="w-full bg-primary/20 text-turquoise rounded-lg px-3 py-2 border border-primary/30"
                >
                  <option value="testnet">Testnet</option>
                  <option value="mainnet">Mainnet</option>
                  <option value="localnet">Localnet</option>
                </select>
                {currentAccount ? (
                  <div className="space-y-2">
                    <div className="text-primary font-mono text-sm text-center p-2 bg-darkblue-light rounded-lg">
                      {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
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
      
      <WalletModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
      />
    </header>
  );
};

export default Header;
