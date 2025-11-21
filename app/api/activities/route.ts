import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getStravaActivities, refreshStravaToken } from '@/lib/strava'

/**
 * GET /api/activities?athleteId=123
 * Fetch activities for an athlete using their stored token
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const athleteIdParam = searchParams.get('athleteId')
        const page = parseInt(searchParams.get('page') || '1')
        const perPage = parseInt(searchParams.get('per_page') || '30')

        if (!athleteIdParam) {
            return NextResponse.json({ error: 'Missing athleteId' }, { status: 400 })
        }

        const athleteId = BigInt(athleteIdParam)

        // Get the latest token for this athlete
        const token = await prisma.token.findFirst({
            where: { athleteId },
            orderBy: { expiresAt: 'desc' },
        })

        if (!token) {
            return NextResponse.json({ error: 'No token found for athlete' }, { status: 401 })
        }

        let accessToken = token.accessToken

        // Check if token is expired or about to expire (within 5 minutes)
        // We need both expiresAt and refreshToken to perform a refresh
        if (token.expiresAt && token.refreshToken &&
            token.expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
            try {
                console.log(`Refreshing token for athlete ${athleteId}`)
                const refreshed = await refreshStravaToken(token.refreshToken)

                // Update token in database
                await prisma.token.update({
                    where: { id: token.id },
                    data: {
                        accessToken: refreshed.access_token,
                        refreshToken: refreshed.refresh_token,
                        expiresAt: new Date(refreshed.expires_at * 1000),
                    },
                })

                accessToken = refreshed.access_token
            } catch (error) {
                console.error('Failed to refresh token:', error)
                // If refresh fails, we'll try to use the existing token
                // but it might fail at the Strava API call
            }
        }

        // Fetch activities from Strava
        const activities = await getStravaActivities(accessToken, page, perPage)

        return NextResponse.json(activities)
    } catch (error) {
        console.error('Activities API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
