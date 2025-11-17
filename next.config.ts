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
    
    const projectRoot = path.resolve(__dirname)
    
    // Configure aliases - ensure @ points to project root
    // This is critical for Docker builds where path resolution can fail
    const existingAlias = config.resolve.alias || {}
    config.resolve.alias = {
      ...existingAlias,
      '@': projectRoot,
    }
    
    // Ensure modules can be resolved from project root
    // This helps webpack find modules when @ alias is used
    if (!config.resolve.modules) {
      config.resolve.modules = ['node_modules']
    }
    if (Array.isArray(config.resolve.modules)) {
      // Add project root to modules resolution
      if (!config.resolve.modules.includes(projectRoot)) {
        config.resolve.modules = [projectRoot, ...config.resolve.modules]
      }
    }
    
    // Debug logging (always in Docker/build environments)
    if (process.env.NODE_ENV === 'development' || process.env.DOCKER_BUILD === '1') {
      console.log('🔧 Webpack config - projectRoot:', projectRoot)
      console.log('🔧 Webpack config - alias @:', config.resolve.alias['@'])
      console.log('🔧 Webpack config - modules:', config.resolve.modules)
      console.log('🔧 Webpack config - __dirname:', __dirname)
    }
    
    return config
  },
}

export default nextConfig
