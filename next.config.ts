import type { NextConfig } from 'next'
import path from 'path'

// Try to use tsconfig-paths-webpack-plugin if available
let TsconfigPathsPlugin: any = null
try {
  TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
} catch (e) {
  // Plugin not available, will use manual configuration
}

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
    const projectRoot = path.resolve(__dirname)
    
    // CRITICAL FIX: Next.js should read paths from tsconfig.json automatically,
    // but in Docker/webpack builds it sometimes fails. We explicitly configure it.
    if (!config.resolve) {
      config.resolve = {}
    }
    
    // Get existing aliases (Next.js may have already set some from tsconfig.json)
    const existingAlias = config.resolve.alias || {}
    
    // CRITICAL: Set @ alias to project root with trailing slash handling
    // Webpack needs this to resolve @/lib/api correctly
    config.resolve.alias = {
      ...existingAlias,
      // Main alias - points to project root
      '@': projectRoot,
    }
    
    // Ensure modules can be resolved from project root
    if (!config.resolve.modules) {
      config.resolve.modules = ['node_modules']
    }
    if (Array.isArray(config.resolve.modules)) {
      // Add project root to modules resolution
      if (!config.resolve.modules.includes(projectRoot)) {
        config.resolve.modules = [projectRoot, ...config.resolve.modules]
      }
    }
    
    // Try to use tsconfig-paths-webpack-plugin if available (better path resolution)
    if (TsconfigPathsPlugin && config.plugins) {
      try {
        config.plugins.push(
          new TsconfigPathsPlugin({
            configFile: path.join(projectRoot, 'tsconfig.json'),
            extensions: config.resolve.extensions || ['.ts', '.tsx', '.js', '.jsx'],
          })
        )
        if (process.env.DOCKER_BUILD === '1') {
          console.log('✅ Using TsconfigPathsPlugin for path resolution')
        }
      } catch (e) {
        if (process.env.DOCKER_BUILD === '1') {
          console.warn('⚠️ Failed to add TsconfigPathsPlugin:', e)
        }
      }
    }
    
    // Debug logging (always in Docker/build environments)
    if (process.env.NODE_ENV === 'development' || process.env.DOCKER_BUILD === '1') {
      const fs = require('fs')
      console.log('🔧 Webpack config - projectRoot:', projectRoot)
      console.log('🔧 Webpack config - alias @:', config.resolve.alias['@'])
      console.log('🔧 Webpack config - modules:', config.resolve.modules)
      console.log('🔧 Testing lib/api.ts exists:', fs.existsSync(path.join(projectRoot, 'lib', 'api.ts')))
      console.log('🔧 Testing lib/polyline.ts exists:', fs.existsSync(path.join(projectRoot, 'lib', 'polyline.ts')))
      console.log('🔧 Testing lib/db.ts exists:', fs.existsSync(path.join(projectRoot, 'lib', 'db.ts')))
    }
    
    return config
  },
}

export default nextConfig
