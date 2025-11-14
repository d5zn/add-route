'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { api } from '@/lib/api'

// Public API doesn't require auth
async function fetchPublic<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`)
  }

  return response.json()
}

const CLUBS = [
  { id: 'not-in-paris', name: 'NOT IN PARIS' },
  { id: 'hedonism', name: 'HEDONISM' },
]

export function ClubSelector({ onSelect }: { onSelect: (clubId: string) => void }) {
  const { setCurrentClub, setTemplates } = useAppStore()
  const [loading, setLoading] = useState(false)

  const handleSelect = async (clubId: string) => {
    setLoading(true)
    try {
      // Load templates for selected club (public API)
      const templates = await fetchPublic<any[]>(`/api/templates?clubId=${encodeURIComponent(clubId)}`)
      setTemplates(templates)
      setCurrentClub(clubId)
      onSelect(clubId)
    } catch (error) {
      console.error('Failed to load templates:', error)
      // Continue anyway with fallback
      setCurrentClub(clubId)
      onSelect(clubId)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="text-center max-w-md">
      <h2 className="text-2xl font-bold mb-4">Select Club</h2>
      <p className="text-gray-400 mb-6">
        Choose which club to work with before editing your workout.
      </p>
      <div className="flex flex-col gap-3">
        {CLUBS.map((club) => (
          <button
            key={club.id}
            onClick={() => handleSelect(club.id)}
            disabled={loading}
            className="px-6 py-3 border border-gray-800 hover:border-white transition-colors text-left disabled:opacity-50"
          >
            {club.name}
          </button>
        ))}
      </div>
    </div>
  )
}

