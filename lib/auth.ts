import { createHmac, randomBytes } from 'crypto'
import { cookies } from 'next/headers'

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '54321'
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'change-this-secret'
const SESSION_COOKIE_NAME = 'admin_session'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface AdminSession {
  username: string
  createdAt: number
  expiresAt: number
}

/**
 * Create HMAC signature for session data
 */
function createSignature(data: string): string {
  return createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('hex')
}

/**
 * Verify HMAC signature
 */
function verifySignature(data: string, signature: string): boolean {
  const expected = createSignature(data)
  return signature === expected
}

/**
 * Encode session data with signature
 */
function encodeSession(session: AdminSession): string {
  const data = Buffer.from(JSON.stringify(session)).toString('base64')
  const signature = createSignature(data)
  return `${data}.${signature}`
}

/**
 * Decode and verify session data
 */
function decodeSession(token: string): AdminSession | null {
  try {
    const [data, signature] = token.split('.')
    if (!data || !signature) return null
    
    if (!verifySignature(data, signature)) {
      return null
    }
    
    const session = JSON.parse(Buffer.from(data, 'base64').toString('utf-8')) as AdminSession
    
    // Check expiration
    if (session.expiresAt < Date.now()) {
      return null
    }
    
    return session
  } catch (error) {
    console.error('Failed to decode session:', error)
    return null
  }
}

/**
 * Verify admin credentials
 */
export function verifyAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD
}

/**
 * Create admin session token
 */
export function createAdminSession(username: string): string {
  const now = Date.now()
  const session: AdminSession = {
    username,
    createdAt: now,
    expiresAt: now + SESSION_DURATION,
  }
  return encodeSession(session)
}

/**
 * Get admin session from cookies
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  
  if (!token) return null
  
  return decodeSession(token)
}

/**
 * Set admin session cookie
 */
export async function setAdminSession(username: string): Promise<void> {
  const token = createAdminSession(username)
  const cookieStore = await cookies()
  
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // in seconds
    path: '/',
  })
}

/**
 * Clear admin session cookie
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Check if user is authenticated admin
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getAdminSession()
  return session !== null
}

/**
 * Require admin authentication (throws if not authenticated)
 */
export async function requireAdminAuth(): Promise<AdminSession> {
  const session = await getAdminSession()
  
  if (!session) {
    throw new Error('Unauthorized: Admin authentication required')
  }
  
  return session
}

