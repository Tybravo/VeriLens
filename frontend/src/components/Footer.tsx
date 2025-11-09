'use client';

import React from 'react';
import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-darkblue text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        {/* Logo and Project Name */}
        <div className="flex items-center space-x-3">
          <img src="/VeriLens_Logo.png" alt="VeriLens Logo" className="h-8 w-auto" />
          <span className="text-lg font-bold text-primary">VeriLens</span>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap justify-center md:justify-start space-x-4 md:space-x-6 text-sm">
          <Link href="/" className="hover:text-secondary transition-colors">Home</Link>
          <Link href="/about" className="hover:text-secondary transition-colors">About</Link>
          <Link href="/privacy" className="hover:text-secondary transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-secondary transition-colors">Terms of Service</Link>
        </div>

        {/* Copyright */}
        <div className="text-sm text-gray-400">
          © {currentYear} VeriLens. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
