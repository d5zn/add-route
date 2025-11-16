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
}

export default nextConfig
