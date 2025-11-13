import { useEffect, useRef } from 'react'
import { api } from '../services/api.ts'
import { useClubStore } from '../store/useClubStore.ts'
import { mockClubs, mockTemplates } from '../data/mockClubs.ts'

// Функция для сравнения массивов по ID
const arraysEqual = <T extends { id: string }>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) return false
  const aIds = new Set(a.map(item => item.id))
  const bIds = new Set(b.map(item => item.id))
  if (aIds.size !== bIds.size) return false
  for (const id of aIds) {
    if (!bIds.has(id)) return false
  }
  return true
}

export const useInitializeData = () => {
  const hasInitializedRef = useRef(false)
  const isInitializingRef = useRef(false)

  useEffect(() => {
    if (hasInitializedRef.current || isInitializingRef.current) return
    
    isInitializingRef.current = true
    hasInitializedRef.current = true

    // Загружаем данные один раз при монтировании приложения
    const initialize = async () => {
      try {
        const currentClubs = useClubStore.getState().clubs
        const currentTemplates = useClubStore.getState().templates
        
        // Загружаем клубы
        const clubs = await api.getClubs()
        const clubsToUse = clubs.length > 0 ? clubs : mockClubs
        
        // Обновляем только если данные изменились
        if (!arraysEqual(currentClubs, clubsToUse)) {
          useClubStore.getState().setClubs(clubsToUse)
        }

        // Загружаем шаблоны
        const templates = await api.getTemplates()
        const templatesToUse = templates.length > 0 ? templates : mockTemplates
        
        // Обновляем только если данные изменились
        if (!arraysEqual(currentTemplates, templatesToUse)) {
          useClubStore.getState().setTemplates(templatesToUse)
        }
      } catch (error) {
        console.error('Failed to initialize data:', error)
        // Fallback to mock data только если store пустой
        const currentClubs = useClubStore.getState().clubs
        const currentTemplates = useClubStore.getState().templates
        
        if (currentClubs.length === 0 && !arraysEqual(currentClubs, mockClubs)) {
          useClubStore.getState().setClubs(mockClubs)
        }
        if (currentTemplates.length === 0 && !arraysEqual(currentTemplates, mockTemplates)) {
          useClubStore.getState().setTemplates(mockTemplates)
        }
      } finally {
        isInitializingRef.current = false
      }
    }

    initialize()
  }, [])
}

