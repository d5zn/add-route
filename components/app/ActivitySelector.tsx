'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
// Helper to get Strava activities (client-side only)
async function getStravaActivities(accessToken: string, page: number = 1, perPage: number = 30) {
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

export function ActivitySelector({ onSelect }: { onSelect: (activity: any) => void }) {
  const { setActivities, activities } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Get access token from localStorage
      const tokenData = localStorage.getItem('strava_token')
      if (!tokenData) {
        throw new Error('No Strava token found')
      }
      
      const token = JSON.parse(tokenData)
      const activities = await getStravaActivities(token.access_token, 1, 30)
      setActivities(activities)
    } catch (err: any) {
      console.error('Failed to load activities:', err)
      setError(err.message || 'Failed to load activities')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-gray-400">Loading activities...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center max-w-md">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={loadActivities}
          className="px-4 py-2 border border-gray-800 hover:border-white transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">Select Workout</h2>
        <p className="text-gray-400">Pick an activity to load into the editor.</p>
      </div>
      <div className="space-y-2">
        {activities.map((activity) => (
          <button
            key={activity.id}
            onClick={() => onSelect(activity)}
            className="w-full p-4 border border-gray-800 hover:border-white transition-colors text-left"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold mb-1">{activity.name}</h3>
                <p className="text-sm text-gray-400">
                  {new Date(activity.start_date_local).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>{(activity.distance / 1000).toFixed(2)} km</span>
                  <span>{activity.total_elevation_gain} m</span>
                  <span>{Math.floor(activity.moving_time / 60)} min</span>
                </div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

