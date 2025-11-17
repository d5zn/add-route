import type { NextConfig } from 'next'

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
  
  // Turbopack configuration (empty for now, can be extended if needed)
  turbopack: {},
  
  // Ensure API routes are not statically generated
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Disable static optimization for API routes during build
  output: 'standalone',
}

export default nextConfig
