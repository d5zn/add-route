import { NextRequest, NextResponse } from 'next/server'
import { getStravaAuthUrl } from '@/lib/strava'

/**
 * GET /api/strava/auth
 * Redirect to Strava OAuth authorization page
 */
export async function GET(request: NextRequest) {
  try {
    const authUrl = getStravaAuthUrl(['read', 'activity:read_all'])
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Strava auth error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Strava authentication' },
      { status: 500 }
    )
  }
}

