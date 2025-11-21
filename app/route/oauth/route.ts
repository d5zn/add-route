import { NextRequest, NextResponse } from 'next/server'
import { exchangeStravaCode } from '@/lib/strava'
import { prisma } from '@/lib/db'
import { createHmac } from 'crypto'

/**
 * GET /api/strava/callback?code=XXX
 * Handle Strava OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      // User declined authorization
      return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://stg.addicted.design'}/?error=access_denied`))
    }

    if (!code) {
      return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://stg.addicted.design'}/?error=missing_code`))
    }

    // Exchange code for access token
    const tokenResponse = await exchangeStravaCode(code)

    // Hash access token for storage (for security)
    const accessTokenHash = createHmac('sha256', process.env.ADMIN_SESSION_SECRET || 'secret')
      .update(tokenResponse.access_token)
      .digest('hex')
      .substring(0, 64)

    // Upsert athlete
    const athlete = await prisma.athlete.upsert({
      where: { athleteId: tokenResponse.athlete.id },
      update: {
        username: tokenResponse.athlete.username,
        firstname: tokenResponse.athlete.firstname,
        lastname: tokenResponse.athlete.lastname,
        city: tokenResponse.athlete.city,
        country: tokenResponse.athlete.country,
        profilePicture: tokenResponse.athlete.profile,
        accessTokenHash,
        stravaUpdatedAt: new Date(tokenResponse.athlete.updated_at),
        lastSeenAt: new Date(),
        isActive: true,
      },
      create: {
        athleteId: tokenResponse.athlete.id,
        username: tokenResponse.athlete.username,
        firstname: tokenResponse.athlete.firstname,
        lastname: tokenResponse.athlete.lastname,
        city: tokenResponse.athlete.city,
        country: tokenResponse.athlete.country,
        profilePicture: tokenResponse.athlete.profile,
        accessTokenHash,
        stravaCreatedAt: new Date(tokenResponse.athlete.created_at),
        stravaUpdatedAt: new Date(tokenResponse.athlete.updated_at),
        lastSeenAt: new Date(),
        isActive: true,
      },
    })

    // Upsert token (delete old tokens and create new one for simplicity)
    await prisma.token.deleteMany({
      where: { athleteId: tokenResponse.athlete.id },
    })

    await prisma.token.create({
      data: {
        athleteId: tokenResponse.athlete.id,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: new Date(tokenResponse.expires_at * 1000),
      },
    })

    // Track auth event for analytics
    await prisma.authEvent.create({
      data: {
        athleteId: tokenResponse.athlete.id,
      },
    })

    // Redirect to app with athlete ID
    // Use explicit domain to avoid localhost redirection issues
    const appUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://stg.addicted.design'}/route`)
    appUrl.searchParams.set('athlete_id', tokenResponse.athlete.id.toString())
    return NextResponse.redirect(appUrl)
  } catch (error) {
    console.error('Strava callback error:', error)
    return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://stg.addicted.design'}/?error=auth_failed`))
  }
}

