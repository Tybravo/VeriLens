import React, { useEffect, useRef, useState } from "react";

/**
 * SuiGalaxyOrbit.tsx (Desktop & Mobile Versions - Fixed)
 * - Separate implementations for desktop and mobile
 * - Mobile version with proper container sizing
 * - Ensures visibility on all screen sizes
 */

const orbitConfig = [
  {
    radiusRatio: 0.2,
    duration: 22,
    reverse: false,
    icons: ["/Walrus_icon.png", "/Seal_icon.png"],
  },
  {
    radiusRatio: 0.333,
    duration: 34,
    reverse: true,
    icons: ["/Verilens_icon.png", "/Nautilus_icon.png"],
  },
];

// Mobile version configuration
const mobileOrbitConfig = [
  {
    radiusRatio: 0.22,
    duration: 22,
    reverse: false,
    icons: ["/Walrus_icon.png", "/Seal_icon.png"],
  },
  {
    radiusRatio: 0.357,
    duration: 34,
    reverse: true,
    icons: ["/Verilens_icon.png", "/Nautilus_icon.png"],
  },
];

// Desktop Version Component
function DesktopOrbit() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<number>(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      setSize(Math.min(w, h));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const calculatePosition = (index: number, totalIcons: number, radiusPx: number) => {
    const angle = (index * 2 * Math.PI) / totalIcons - Math.PI / 2;
    const cx = size / 2;
    const cy = size / 2;
    const x = cx + radiusPx * Math.cos(angle);
    const y = cy + radiusPx * Math.sin(angle);
    return { x, y };
  };

  return (
    <div className="w-full h-full flex items-center justify-center pointer-events-none select-none">
      <div ref={containerRef} className="relative w-full max-w-[600px] aspect-square">
        {/* SVG rings */}
        <svg
          width={size}
          height={size}
          className="absolute top-0 left-0 pointer-events-none"
          style={{ filter: "drop-shadow(0 0 8px rgba(0,212,255,0.35))" }}
        >
          {orbitConfig.map((o, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={o.radiusRatio * size}
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
          <circle cx={size / 2} cy={size / 2} r={6} fill="url(#gradCenter)" />
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
            const radiusPx = orbitConfig[0].radiusRatio * size;
            const pos = calculatePosition(idx, orbitConfig[0].icons.length, radiusPx);
            return (
              <div
                key={idx}
                className="absolute"
                style={{
                  left: `${(pos.x / size) * 100}%`,
                  top: `${(pos.y / size) * 100}%`,
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
            const radiusPx = orbitConfig[1].radiusRatio * size;
            const pos = calculatePosition(idx, orbitConfig[1].icons.length, radiusPx);
            return (
              <div
                key={idx}
                className="absolute"
                style={{
                  left: `${(pos.x / size) * 100}%`,
                  top: `${(pos.y / size) * 100}%`,
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<number>(280);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      setSize(Math.min(w, h));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const calculatePosition = (index: number, totalIcons: number, radiusPx: number) => {
    const angle = (index * 2 * Math.PI) / totalIcons - Math.PI / 2;
    const cx = size / 2;
    const cy = size / 2;
    const x = cx + radiusPx * Math.cos(angle);
    const y = cy + radiusPx * Math.sin(angle);
    return { x, y };
  };

  return (
    <div className="w-full h-full flex items-center justify-center pointer-events-none select-none">
      <div ref={containerRef} className="relative w-full max-w-[280px] aspect-square">
        {/* SVG rings */}
        <svg
          width={size}
          height={size}
          className="absolute top-0 left-0 pointer-events-none"
          style={{ filter: "drop-shadow(0 0 6px rgba(0,212,255,0.35))" }}
        >
          {mobileOrbitConfig.map((o, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={o.radiusRatio * size}
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
          <circle cx={size / 2} cy={size / 2} r={5} fill="url(#gradCenterMobile)" />
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
            const radiusPx = mobileOrbitConfig[0].radiusRatio * size;
            const pos = calculatePosition(idx, mobileOrbitConfig[0].icons.length, radiusPx);
            return (
              <div
                key={idx}
                className="absolute"
                style={{
                  left: `${(pos.x / size) * 100}%`,
                  top: `${(pos.y / size) * 100}%`,
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
            const radiusPx = mobileOrbitConfig[1].radiusRatio * size;
            const pos = calculatePosition(idx, mobileOrbitConfig[1].icons.length, radiusPx);
            return (
              <div
                key={idx}
                className="absolute"
                style={{
                  left: `${(pos.x / size) * 100}%`,
                  top: `${(pos.y / size) * 100}%`,
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
