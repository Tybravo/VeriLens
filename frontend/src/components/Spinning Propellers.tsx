import React from 'react';
import { motion } from 'framer-motion';

/**
 * DroneWithSpinningPropellers Component
 * - Drone with floating animation
 * - 4 spinning propeller overlays
 * - Responsive sizing for mobile and desktop
 * - Blinking light effect
 */

export default function DroneWithSpinningPropellers() {
  return (
    <div className="relative flex justify-center">
      {/* Soft Blue Glow */}
      <motion.div
        className="absolute w-64 h-32 bg-gradient-to-t from-blue-500/40 to-transparent rounded-full filter blur-3xl"
        style={{
          bottom: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
        animate={{
          scale: [0.9, 1.1, 0.9],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Drone Container with Floating Animation */}
      <motion.div
        className="relative w-80 md:w-[28rem]"
        animate={{
          y: [0, -10, 0],
          rotate: [0, 3, -2, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Propeller Overlays */}
        {/* Top Left Propeller */}
        <motion.div
          className="absolute w-16 h-16 md:w-24 md:h-24 rounded-full"
          style={{
            top: '8%',
            left: '8%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(139,92,246,0.1) 50%, transparent 70%)',
            boxShadow: '0 0 20px rgba(139,92,246,0.4)',
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Top Right Propeller */}
        <motion.div
          className="absolute w-16 h-16 md:w-24 md:h-24 rounded-full"
          style={{
            top: '8%',
            right: '8%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(139,92,246,0.1) 50%, transparent 70%)',
            boxShadow: '0 0 20px rgba(139,92,246,0.4)',
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Bottom Left Propeller */}
        <motion.div
          className="absolute w-16 h-16 md:w-24 md:h-24 rounded-full"
          style={{
            bottom: '32%',
            left: '8%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(139,92,246,0.1) 50%, transparent 70%)',
            boxShadow: '0 0 20px rgba(139,92,246,0.4)',
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Bottom Right Propeller */}
        <motion.div
          className="absolute w-16 h-16 md:w-24 md:h-24 rounded-full"
          style={{
            bottom: '32%',
            right: '8%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(139,92,246,0.1) 50%, transparent 70%)',
            boxShadow: '0 0 20px rgba(139,92,246,0.4)',
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Drone Image */}
        <img
          src="/Drone_camera.png"
          alt="Drone capturing event"
          className="w-full h-auto object-contain relative z-10"
        />

        {/* Blinking Light */}
        <motion.div
          className="absolute w-4 h-4 bg-indigo-400 rounded-full shadow-[0_0_20px_5px_rgba(99,102,241,0.6)]"
          style={{
            bottom: '35%',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
          animate={{
            opacity: [1, 0.2, 1],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
    </div>
  );
}
