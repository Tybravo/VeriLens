import React from "react";

/**
 * SuiGalaxyOrbit.tsx (Desktop & Mobile Versions - Fixed)
 * - Separate implementations for desktop and mobile
 * - Mobile version with proper container sizing
 * - Ensures visibility on all screen sizes
 */

const orbitConfig = [
  {
    radius: 120,
    duration: 22,
    reverse: false,
    icons: ["/Walrus_icon.png", "/Seal_icon.png"],
  },
  {
    radius: 200,
    duration: 34,
    reverse: true,
    icons: ["/Verilens_icon.png", "/Nautilus_icon.png"],
  },
];

// Mobile version configuration
const mobileOrbitConfig = [
  {
    radius: 60,
    duration: 22,
    reverse: false,
    icons: ["/Walrus_icon.png", "/Seal_icon.png"],
  },
  {
    radius: 100,
    duration: 34,
    reverse: true,
    icons: ["/Verilens_icon.png", "/Nautilus_icon.png"],
  },
];

// Desktop Version Component
function DesktopOrbit() {
  const calculatePosition = (index, totalIcons, radius) => {
    const angle = (index * 2 * Math.PI) / totalIcons - Math.PI / 2;
    const x = 300 + radius * Math.cos(angle);
    const y = 300 + radius * Math.sin(angle);
    return { x, y };
  };

  return (
    <div className="w-full h-full flex items-center justify-center pointer-events-none select-none">
      <div className="relative w-[600px] h-[600px]">
        {/* SVG rings */}
        <svg
          width="600"
          height="600"
          className="absolute top-0 left-0 pointer-events-none"
          style={{ filter: "drop-shadow(0 0 8px rgba(0,212,255,0.35))" }}
        >
          {orbitConfig.map((o, i) => (
            <circle
              key={i}
              cx="300"
              cy="300"
              r={o.radius}
              stroke="rgba(0,212,255,0.18)"
              strokeWidth="2"
              fill="none"
            />
          ))}
          <defs>
            <radialGradient id="gradCenter">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="300" cy="300" r="6" fill="url(#gradCenter)" />
        </svg>

        {/* Central SUI Emboss Image */}
        <img
          src="/SUI_emboss.png"
          alt="SUI Emboss Logo"
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 object-contain z-20"
        />

        {/* Orbit 1 - Inner ring */}
        <div
          className="absolute inset-0 animate-spin"
          style={{
            animationDuration: `${orbitConfig[0].duration}s`,
            animationDirection: orbitConfig[0].reverse ? "reverse" : "normal",
          }}
        >
          {orbitConfig[0].icons.map((src, idx) => {
            const pos = calculatePosition(idx, orbitConfig[0].icons.length, orbitConfig[0].radius);
            return (
              <div
                key={idx}
                className="absolute"
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full"
                  style={{
                    width: "100px",
                    height: "100px",
                    background: "rgba(0,212,255,0.12)",
                    filter: "blur(14px)",
                    zIndex: 0,
                    transform: "translate(-10px, -10px)",
                  }}
                />
                <img
                  src={src}
                  alt=""
                  className="relative"
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "contain",
                    zIndex: 2,
                    filter: "drop-shadow(0 0 10px rgba(0,212,255,0.7))",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Orbit 2 - Outer ring */}
        <div
          className="absolute inset-0 animate-spin"
          style={{
            animationDuration: `${orbitConfig[1].duration}s`,
            animationDirection: orbitConfig[1].reverse ? "reverse" : "normal",
          }}
        >
          {orbitConfig[1].icons.map((src, idx) => {
            const pos = calculatePosition(idx, orbitConfig[1].icons.length, orbitConfig[1].radius);
            return (
              <div
                key={idx}
                className="absolute"
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full"
                  style={{
                    width: "100px",
                    height: "100px",
                    background: "rgba(0,212,255,0.12)",
                    filter: "blur(14px)",
                    zIndex: 0,
                    transform: "translate(-10px, -10px)",
                  }}
                />
                <img
                  src={src}
                  alt=""
                  className="relative"
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "contain",
                    zIndex: 2,
                    filter: "drop-shadow(0 0 10px rgba(0,212,255,0.7))",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Mobile Version Component
function MobileOrbit() {
  const calculatePosition = (index, totalIcons, radius) => {
    const angle = (index * 2 * Math.PI) / totalIcons - Math.PI / 2;
    const x = 140 + radius * Math.cos(angle);
    const y = 140 + radius * Math.sin(angle);
    return { x, y };
  };

  return (
    <div className="w-full h-full flex items-center justify-center pointer-events-none select-none">
      <div className="relative" style={{ width: "280px", height: "280px" }}>
        {/* SVG rings */}
        <svg
          width="280"
          height="280"
          className="absolute top-0 left-0 pointer-events-none"
          style={{ filter: "drop-shadow(0 0 6px rgba(0,212,255,0.35))" }}
        >
          {mobileOrbitConfig.map((o, i) => (
            <circle
              key={i}
              cx="140"
              cy="140"
              r={o.radius}
              stroke="rgba(0,212,255,0.25)"
              strokeWidth="2"
              fill="none"
            />
          ))}
          <defs>
            <radialGradient id="gradCenterMobile">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="140" cy="140" r="5" fill="url(#gradCenterMobile)" />
        </svg>

        {/* Central SUI Emboss Image */}
        <img
          src="/SUI_emboss.png"
          alt="SUI Emboss Logo"
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 object-contain z-20"
          style={{ width: "56px", height: "56px" }}
        />

        {/* Orbit 1 - Inner ring */}
        <div
          className="absolute inset-0 animate-spin"
          style={{
            animationDuration: `${mobileOrbitConfig[0].duration}s`,
            animationDirection: mobileOrbitConfig[0].reverse ? "reverse" : "normal",
          }}
        >
          {mobileOrbitConfig[0].icons.map((src, idx) => {
            const pos = calculatePosition(idx, mobileOrbitConfig[0].icons.length, mobileOrbitConfig[0].radius);
            return (
              <div
                key={idx}
                className="absolute"
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full"
                  style={{
                    width: "50px",
                    height: "50px",
                    background: "rgba(0,212,255,0.15)",
                    filter: "blur(10px)",
                    zIndex: 0,
                    transform: "translate(-5px, -5px)",
                  }}
                />
                <img
                  src={src}
                  alt=""
                  className="relative"
                  style={{
                    width: "40px",
                    height: "40px",
                    objectFit: "contain",
                    zIndex: 2,
                    filter: "drop-shadow(0 0 8px rgba(0,212,255,0.7))",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Orbit 2 - Outer ring */}
        <div
          className="absolute inset-0 animate-spin"
          style={{
            animationDuration: `${mobileOrbitConfig[1].duration}s`,
            animationDirection: mobileOrbitConfig[1].reverse ? "reverse" : "normal",
          }}
        >
          {mobileOrbitConfig[1].icons.map((src, idx) => {
            const pos = calculatePosition(idx, mobileOrbitConfig[1].icons.length, mobileOrbitConfig[1].radius);
            return (
              <div
                key={idx}
                className="absolute"
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full"
                  style={{
                    width: "50px",
                    height: "50px",
                    background: "rgba(0,212,255,0.15)",
                    filter: "blur(10px)",
                    zIndex: 0,
                    transform: "translate(-5px, -5px)",
                  }}
                />
                <img
                  src={src}
                  alt=""
                  className="relative"
                  style={{
                    width: "40px",
                    height: "40px",
                    objectFit: "contain",
                    zIndex: 2,
                    filter: "drop-shadow(0 0 8px rgba(0,212,255,0.7))",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Main Component with conditional rendering
export default function SuiGalaxyOrbit() {
  return (
    <>
      {/* Desktop version - hidden on mobile (below 768px) */}
      <div className="hidden md:flex w-full h-full">
        <DesktopOrbit />
      </div>
      
      {/* Mobile version - hidden on desktop (768px and above) */}
      <div className="flex md:hidden w-full h-full">
        <MobileOrbit />
      </div>
    </>
  );
}
