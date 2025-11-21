'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'

interface ActivitySelectorProps {
  onSelect: (activity: any) => void
  athleteId?: string
}

export function ActivitySelector({ onSelect, athleteId }: ActivitySelectorProps) {
  const { setActivities, activities } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (athleteId) {
      loadActivities()
    } else {
      setLoading(false)
    }
  }, [athleteId])

  const loadActivities = async () => {
    if (!athleteId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/activities?athleteId=${athleteId}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 401) {
          throw new Error('Unauthorized. Please reconnect with Strava.')
        }
        throw new Error(errorData.error || 'Failed to fetch activities')
      }

      const data = await response.json()
      setActivities(data)
    } catch (err: any) {
      console.error('Failed to load activities:', err)
      setError(err.message || 'Failed to load activities')
    } finally {
      setLoading(false)
    }
  }

  if (!athleteId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 mb-4">Connect with Strava to see your activities</p>
        <a
          href="/api/strava/auth"
          className="px-6 py-3 bg-[#fc4c02] text-white font-bold rounded hover:bg-[#e34402] transition-colors"
        >
          Connect with Strava
        </a>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-gray-400">Loading activities...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center max-w-md mx-auto py-8">
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

