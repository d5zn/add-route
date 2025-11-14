'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { RouteCanvas } from '@/components/app/RouteCanvas'
import { ClubSelector } from '@/components/app/ClubSelector'
import { ActivitySelector } from '@/components/app/ActivitySelector'
import { TemplateSelector } from '@/components/app/TemplateSelector'
import { EditingPanel } from '@/components/app/EditingPanel'
import { useAppStore } from '@/store/useAppStore'

type AppStage = 'not-connected' | 'club-selection' | 'workout-selection' | 'connected' | 'loading'

function AppContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { stage, setStage, currentClub, currentTemplate, currentActivity } = useAppStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check for Strava callback
    const athleteId = searchParams.get('athlete_id')
    if (athleteId) {
      // User just connected via Strava
      setStage('club-selection')
    } else {
      // Check if user has token
      const token = localStorage.getItem('strava_token')
      if (token) {
        setStage('club-selection')
      } else {
        setStage('not-connected')
      }
    }
  }, [searchParams, setStage])

  const handleConnectStrava = () => {
    window.location.href = '/api/strava/auth'
  }

  const handleClubSelect = (clubId: string) => {
    useAppStore.getState().setCurrentClub(clubId)
    setStage('workout-selection')
  }

  const handleActivitySelect = (activity: any) => {
    useAppStore.getState().setCurrentActivity(activity)
    setStage('connected')
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Navbar */}
      <nav className="h-12 border-b border-gray-800 flex items-center justify-between px-4">
        <div className="text-lg font-bold tracking-widest uppercase italic">
          addicted
        </div>
        <div className="flex gap-2">
          <button
            className="p-2 hover:bg-gray-900 transition-colors"
            title="Select Workout"
            onClick={() => setStage('workout-selection')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </button>
          <button
            className="p-2 hover:bg-gray-900 transition-colors"
            title="Download"
            onClick={() => {
              const canvas = document.getElementById('route-canvas') as HTMLCanvasElement
              if (canvas) {
                const link = document.createElement('a')
                link.download = `route-${Date.now()}.png`
                link.href = canvas.toDataURL()
                link.click()
              }
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Preview Area */}
        <div className="flex-1 flex items-center justify-center p-4 min-h-0">
          {stage === 'not-connected' && (
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-bold mb-4">Authorization</h2>
              <p className="text-gray-400 mb-6">
                Visualize your cycling routes and workout data.
              </p>
              <button
                onClick={handleConnectStrava}
                className="px-8 py-4 bg-white text-black hover:bg-gray-200 transition-colors font-semibold"
              >
                Connect with Strava
              </button>
              <div className="mt-8 text-xs text-gray-500">
                <a href="/information.html" className="hover:text-white transition-colors">
                  Information Center
                </a>
              </div>
            </div>
          )}

          {stage === 'club-selection' && (
            <ClubSelector onSelect={handleClubSelect} />
          )}

          {stage === 'workout-selection' && (
            <ActivitySelector onSelect={handleActivitySelect} />
          )}

          {stage === 'connected' && currentActivity && (
            <div className="w-full h-full flex items-center justify-center">
              <RouteCanvas
                activity={currentActivity}
                template={currentTemplate}
                club={currentClub}
              />
            </div>
          )}

          {stage === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-gray-400">Loading...</p>
            </div>
          )}
        </div>

        {/* Editing Panel */}
        {stage === 'connected' && (
          <EditingPanel />
        )}
      </div>
    </div>
  )
}

export default function AppPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    }>
      <AppContent />
    </Suspense>
  )
}
