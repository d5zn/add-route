import { useEffect, useRef } from 'react'
import { api } from '../services/api.ts'
import { useClubStore } from '../store/useClubStore.ts'
import { mockClubs, mockTemplates } from '../data/mockClubs.ts'

export const useInitializeData = () => {
  const hasInitializedRef = useRef(false)

  useEffect(() => {
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true

    // Загружаем данные один раз при монтировании приложения
    const initialize = async () => {
      try {
        // Загружаем клубы
        const clubs = await api.getClubs()
        const clubsToUse = clubs.length > 0 ? clubs : mockClubs
        useClubStore.getState().setClubs(clubsToUse)

        // Загружаем шаблоны
        const templates = await api.getTemplates()
        const templatesToUse = templates.length > 0 ? templates : mockTemplates
        useClubStore.getState().setTemplates(templatesToUse)
      } catch (error) {
        console.error('Failed to initialize data:', error)
        // Fallback to mock data
        useClubStore.getState().setClubs(mockClubs)
        useClubStore.getState().setTemplates(mockTemplates)
      }
    }

    initialize()
  }, [])
}

