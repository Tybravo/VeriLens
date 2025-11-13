'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import SuiGalaxyOrbit from '@/components/SuiGalaxyOrbit';
import ParticlesBackground from '@/components/Particles';

const HomePage = () => {
  return (
    <>
      {/* HERO SECTION */}
      <section className="hero relative bg-gradient-to-b from-gray-900 via-black to-gray-950 text-white -my-8 py-24 px-6 md:px-16 flex flex-col md:flex-row items-center justify-between overflow-hidden">
        {/* Particles Background Layer */}
        {/* <ParticlesBackground /> */}
        
        {/* LEFT SIDE - TEXT CONTENT */}
        <div className="md:w-1/2 space-y-6 text-left z-10 relative">
          <h1 className="text-primary text-4xl md:text-5xl font-extrabold leading-tight">
            The Truth Engine for{' '}
            <br />
            <span className="text-secondary-light">
              SUI Ecosystem, dApp, Creators, and Media
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-300 max-w-xl">
            VeriLens lets developers build, creators verify, and journalists with
            audiences believe, together creating a transparent digital ecosystem.
          </p>

          <div className="pt-6 flex gap-4">
           <button className="bg-primary hover:bg-secondary-light px-6 py-3 rounded-2xl font-medium transition">
              Creator
            </button>
            <button className="border border-secondary-light px-6 py-3 rounded-2xl font-medium hover:bg-secondary-light hover:text-black transition">
              Developer
            </button>
          </div>
        </div>

        {/* RIGHT SIDE - DRONE IMAGE + LIGHT */}
        <div className="md:w-1/2 mt-12 md:mt-0 flex justify-center relative z-10">
          {/* Replaced DroneWithSpinningPropellers with Drone_Camera.gif */}
          <img
            src="/DroneCamera.gif"
            alt="Drone capturing event"
            className="w-180 md:w-[22 8rem] h-auto object-contain relative z-10"
          />
        </div>
      </section>


      {/* GALAXY SECTION */}
      <section className="relative flex flex-col md:flex-row items-center justify-between  pt-0 pb-0 md:py-24 px-6 md:px-16 overflow-hidden text-white">        {/* <ParticlesBackground /> */}
        
        {/* 🌌 BACKGROUND LAYER */}
        <div className="absolute inset-0 -z-10">
          {/* Animated Gradient Mesh */}
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(15,121,187,0.15),transparent_70%),radial-gradient(circle_at_70%_60%,rgba(137,100,255,0.15),transparent_70%)] blur-3xl"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          />

          {/* Galaxy Noise Overlay */}
          <motion.div
            className="absolute inset-0 bg-[url('/galaxy-noise.png')] opacity-80 mix-blend-soft-light"
            animate={{
              opacity: [0.78, 0.82, 0.78],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Starfield Layer */}
          <motion.div
            className="absolute inset-0 bg-[url('/stars.png')] opacity-20"
            animate={{
              backgroundPosition: ['0px 0px', '100px 100px', '0px 0px'],
            }}
            transition={{
              duration: 60,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>

        {/* LEFT - GALAXY ORBIT */}
        <div className="relative w-full md:w-1/2 flex items-center justify-center min-h-[320px] md:h-[420px] z-10">
        <SuiGalaxyOrbit />
        </div>

       {/* RIGHT - CREATOR/DEV CARDS */}
      <div className="md:w-1/2 mt-16 md:mt-0 flex flex-col gap-8 relative z-10">
        <motion.div
          whileHover={{
            scale: 1.05,
            boxShadow: '0 0 25px 5px rgba(15,121,187,0.6)',
          }}
          whileTap={{
            scale: 1.05,
            boxShadow: '0 0 25px 5px rgba(15,121,187,0.6)',
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="bg-white/10 backdrop-blur-lg border border-blue-500/20 rounded-2xl p-6 hover:border-blue-400/50 active:border-blue-400/50 cursor-pointer"
        >
          <h3 className="text-2xl font-semibold text-blue-400 mb-2">For Creators</h3>
          <p className="text-gray-300">
            Capture, upload, and share your content with verifiable proof of authenticity.
            Every creation you publish is transparently traceable.
          </p>
        </motion.div>

        <motion.div
          whileHover={{
            scale: 1.05,
            boxShadow: '0 0 25px 5px rgba(15,121,187,0.6)',
          }}
          whileTap={{
            scale: 1.05,
            boxShadow: '0 0 25px 5px rgba(15,121,187,0.6)',
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="bg-white/10 backdrop-blur-lg border border-blue-500/20 rounded-2xl p-6 hover:border-blue-400/50 active:border-blue-400/50 cursor-pointer"
        >
          <h3 className="text-2xl font-semibold text-blue-400 mb-2">For Developers</h3>
          <p className="text-gray-300">
            Integrate VeriLens Proof-as-a-Service APIs to verify and trace digital media
            from within your dApps and SUI-powered products.
          </p>
        </motion.div>
      </div>
      </section>
    </>
  );
};

export default HomePage;
