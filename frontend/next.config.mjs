import { fileURLToPath } from 'url';
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: 'loose',
  },
  webpack: (config, { isServer }) => {
    // Handle ESM compatibility issues
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    // Handle lru-cache module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
    };

    // Point 'lru-cache' to our local shim without overwriting Next's aliases
    const localLruCache = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      'src',
      'shims',
      'lru-cache.js'
    );
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'lru-cache': localLruCache,
    };

    // Remove broad JS rules that can interfere with Next internals
    // (No extra .m?js rules; rely on Next's defaults)

    return config;
  },
  transpilePackages: ['@mysten/dapp-kit', '@vanilla-extract/css'],
};

export default nextConfig;
