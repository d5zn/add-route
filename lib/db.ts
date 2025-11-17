import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check if we're in build phase
const isBuildPhase = () => {
  // Next.js sets NEXT_PHASE during build
  if (process.env.NEXT_PHASE === 'phase-production-build' || 
      process.env.NEXT_PHASE === 'phase-development-build') {
    return true
  }
  
  // Check if we're running npm run build (Railway build phase)
  // Railway sets RAILWAY_ENVIRONMENT_NAME during runtime, not during build
  const isRailwayBuild = process.env.NODE_ENV === 'production' && 
                         process.env.DATABASE_URL?.includes('railway.internal') &&
                         !process.env.RAILWAY_ENVIRONMENT_NAME &&
                         !process.env.RAILWAY_ENVIRONMENT
  
  if (isRailwayBuild) {
    return true
  }
  
  // Additional check: if we're in a build script context
  if (process.env.npm_lifecycle_event === 'build' || 
      process.env.npm_lifecycle_script?.includes('build')) {
    return true
  }
  
  return false
}

// Use placeholder DATABASE_URL during build if not set or if using internal Railway URL
const getDatabaseUrl = () => {
  // During build, Railway internal URLs are not accessible
  // Use placeholder to allow Prisma client generation without connection
  if (isBuildPhase()) {
    if (process.env.DATABASE_URL?.includes('railway.internal')) {
      console.warn('⚠️  Using placeholder DATABASE_URL during build (Railway internal URL not accessible)')
      return 'postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public'
    }
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️  DATABASE_URL not set during build, using placeholder')
      return 'postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public'
    }
  }
  
  return process.env.DATABASE_URL || 'postgresql://localhost:5432/dev'
}

// Lazy initialization to avoid connection attempts during build
let prismaInstance: PrismaClient | null = null

export const prisma = (() => {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }
  
  if (!prismaInstance) {
    const databaseUrl = getDatabaseUrl()
    
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: databaseUrl
        }
      },
    })
    
    // Prevent connection attempts during build
    if (isBuildPhase()) {
      // Override $connect to prevent actual connection during build
      const originalConnect = prismaInstance.$connect.bind(prismaInstance)
      prismaInstance.$connect = async () => {
        if (isBuildPhase()) {
          console.warn('⚠️  Skipping database connection during build phase')
          return Promise.resolve()
        }
        return originalConnect()
      }
    }
  }
  
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance
  }
  
  return prismaInstance
})()

