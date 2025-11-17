import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  /* Config options */
  reactStrictMode: true,
  
  // Serve static files from the old structure
  async rewrites() {
    return [
      {
        source: '/route/:path*',
        destination: '/:path*',
      },
    ]
  },
  
  // Ensure API routes are not statically generated
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Use standalone output for Railway Docker deployment
  output: 'standalone',
  
  // Turbopack configuration (empty to allow webpack fallback)
  turbopack: {},
  
  // Webpack configuration for better module resolution in Docker
  // This will be used when NEXT_PRIVATE_SKIP_TURBOPACK=1 is set
  webpack: (config, { isServer }) => {
    // Explicitly configure path aliases for webpack
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname),
      }
    }
    return config
  },
}

export default nextConfig
