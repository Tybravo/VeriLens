'use client';

import React, { useEffect } from 'react';

// Extend Window interface for ParticlesJS
declare global {
  interface Window {
    particlesJS: any;
    pJSDom: any[];
  }
}

const ParticlesBackground: React.FC = () => {
  useEffect(() => {
    // Load ParticlesJS script dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js';
    script.async = true;
    
    script.onload = () => {
      if (window.particlesJS) {
        window.particlesJS('particles-js', {
          particles: {
            number: {
              value: 80,
              density: {
                enable: true,
                value_area: 800
              }
            },
            color: { 
              value: '#00FFFF' // Cyan color for molecules
            },
            shape: {
              type: 'circle',
              stroke: { 
                width: 0, 
                color: '#000000' 
              },
              polygon: { 
                nb_sides: 5 
              }
            },
            opacity: {
              value: 0.5,
              random: false,
              anim: { 
                enable: false 
              }
            },
            size: {
              value: 4, // Smaller size for molecule effect
              random: true,
              anim: { 
                enable: false 
              }
            },
            line_linked: {
              enable: true,
              distance: 150,
              color: '#00FFFF', // Cyan color for lines
              opacity: 0.5,
              width: 2
            },
            move: {
              enable: true,
              speed: 3,
              direction: 'none',
              random: false,
              straight: false,
              out_mode: 'out',
              bounce: false
            }
          },
          interactivity: {
            detect_on: 'canvas',
            events: {
              onhover: { 
                enable: true, 
                mode: 'repulse' 
              },
              onclick: { 
                enable: true, 
                mode: 'push' 
              },
              resize: true
            },
            modes: {
              repulse: { 
                distance: 100, 
                duration: 0.4 
              },
              push: { 
                particles_nb: 4 
              }
            }
          },
          retina_detect: true
        });
      }
    };

    document.body.appendChild(script);

    return () => {
      // Clean up particles when component unmounts
      if (window.pJSDom && window.pJSDom.length > 0) {
        window.pJSDom.forEach((dom) => {
          if (dom && dom.pJS && dom.pJS.fn && dom.pJS.fn.vendors) {
            dom.pJS.fn.vendors.destroypJS();
          }
        });
        window.pJSDom = [];
      }
      
      // Remove script
      const scripts = document.querySelectorAll('script[src*="particles.js"]');
      scripts.forEach(s => s.remove());
      
      // Remove canvas
      const canvas = document.getElementById('particles-js');
      if (canvas) {
        canvas.innerHTML = '';
      }
    };
  }, []);

  return (
    <div 
      id="particles-js" 
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
    />
  );
};

export default ParticlesBackground;
