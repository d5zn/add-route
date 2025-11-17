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
  webpack: (config, { isServer }) => {
    // Explicitly configure path aliases for webpack
    if (!config.resolve) {
      config.resolve = {}
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {}
    }
    
    // Set @ alias to project root
    const projectRoot = path.resolve(__dirname)
    config.resolve.alias['@'] = projectRoot
    
    // Also ensure modules can be resolved from project root
    if (!config.resolve.modules) {
      config.resolve.modules = []
    }
    if (!config.resolve.modules.includes(projectRoot)) {
      config.resolve.modules.push(projectRoot)
    }
    
    return config
  },
}

export default nextConfig
