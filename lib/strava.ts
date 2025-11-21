/**
 * Strava API client utilities
 */

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID || ''
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET || ''
const STRAVA_REDIRECT_URI = process.env.STRAVA_REDIRECT_URI || (process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/route/oauth` : 'https://stg.addicted.design/route/oauth')

export interface StravaTokenResponse {
  token_type: string
  expires_at: number
  expires_in: number
  refresh_token: string
  access_token: string
  athlete: {
    id: number
    username: string | null
    firstname: string
    lastname: string | null
    city: string | null
    country: string | null
    profile: string | null
    created_at: string
    updated_at: string
  }
}

export interface StravaActivity {
  id: number
  name: string
  distance: number
  moving_time: number
  elapsed_time: number
  total_elevation_gain: number
  type: string
  sport_type: string
  start_date: string
  start_date_local: string
  timezone: string
  map: {
    id: string
    summary_polyline: string | null
    polyline: string | null
  }
  average_speed: number
  max_speed: number
  average_watts?: number
  kilojoules?: number
  calories?: number
}

/**
 * Get Strava OAuth authorization URL
 */
export function getStravaAuthUrl(scope: string[] = ['read', 'activity:read']): string {
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: STRAVA_REDIRECT_URI,
    response_type: 'code',
    scope: scope.join(','),
  })

  return `https://www.strava.com/oauth/authorize?${params.toString()}`
}

/**
 * Exchange Strava authorization code for access token
 */
export async function exchangeStravaCode(code: string): Promise<StravaTokenResponse> {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange Strava code: ${error}`)
  }

  return response.json()
}

/**
 * Refresh Strava access token
 */
export async function refreshStravaToken(refreshToken: string): Promise<StravaTokenResponse> {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to refresh Strava token: ${error}`)
  }

  return response.json()
}

/**
 * Get athlete activities from Strava
 */
export async function getStravaActivities(
  accessToken: string,
  page: number = 1,
  perPage: number = 30
): Promise<StravaActivity[]> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  })

  const response = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch Strava activities: ${error}`)
  }

  return response.json()
}

/**
 * Get a specific activity from Strava
 */
export async function getStravaActivity(
  accessToken: string,
  activityId: number
): Promise<StravaActivity> {
  const response = await fetch(
    `https://www.strava.com/api/v3/activities/${activityId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch Strava activity: ${error}`)
  }

  return response.json()
}

