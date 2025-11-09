'use client';

import React from 'react';
// import Header from '../components/Header';
// import Footer from '../components/Footer';
import Link from 'next/link';


const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* <Header /> */}
      <main className="flex-grow flex items-center justify-center text-center py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white to-gray-100">
        <div className="max-w-4xl">
          <h1 className="text-5xl sm:text-6xl font-bold text-primary mb-6">
            Welcome to VeriLens
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 mb-10">
            Your on-chain media authenticity platform.
            Ensuring trust and transparency in the digital world.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link
              href="/get-started"
              className="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Get Started
            </Link>
            <Link
              href="/about"
              className="bg-secondary hover:bg-secondary-dark text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Learn More
            </Link>
          </div>
        </div>
      </main>
      {/* <Footer /> */}
    </div>
  );
};

export default HomePage;
