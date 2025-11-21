import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * POST /api/analytics
 * Record analytics events (downloads, visits)
 */
export async function POST(request: NextRequest) {
    try {
        const data = await request.json()
        const eventType = data.type

        // Get client info
        const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'

        if (eventType === 'download') {
            const { athlete_id, club_id } = data

            await prisma.download.create({
                data: {
                    athleteId: athlete_id ? BigInt(athlete_id) : null,
                    clubId: club_id,
                    ipAddress,
                    userAgent,
                    fileFormat: 'png',
                },
            })

            return NextResponse.json({ status: 'ok' })
        }

        if (eventType === 'visit') {
            const { session_id, athlete_id, club_id, page_path } = data

            await prisma.visit.create({
                data: {
                    sessionId: session_id,
                    athleteId: athlete_id ? BigInt(athlete_id) : null,
                    clubId: club_id,
                    pagePath: page_path || '/',
                    ipAddress,
                    userAgent,
                },
            })

            return NextResponse.json({ status: 'ok' })
        }

        return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    } catch (error) {
        console.error('Analytics error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
