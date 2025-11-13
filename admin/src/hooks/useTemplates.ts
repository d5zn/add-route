import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api.ts'
import { useClubStore } from '../store/useClubStore.ts'
import { mockTemplates } from '../data/mockClubs.ts'

export const useTemplates = (clubId?: string) => {
  return useQuery({
    queryKey: ['templates', clubId],
    queryFn: async () => {
      try {
        const templates = await api.getTemplates(clubId)
        const existingTemplates = useClubStore.getState().templates
        
        if (clubId) {
          // Replace templates for specific club
          if (templates.length > 0) {
            const otherTemplates = existingTemplates.filter((t) => t.clubId !== clubId)
            const newTemplates = [...otherTemplates, ...templates]
            useClubStore.getState().setTemplates(newTemplates)
            return templates
          }
          // Keep existing templates for this club
          return existingTemplates.filter((t) => t.clubId === clubId)
        } else {
          // Replace all templates
          const templatesToUse = templates.length > 0 ? templates : mockTemplates
          useClubStore.getState().setTemplates(templatesToUse)
          return templatesToUse
        }
      } catch (error) {
        console.error('Failed to load templates:', error)
        const existingTemplates = useClubStore.getState().templates
        if (!clubId && existingTemplates.length === 0) {
          useClubStore.getState().setTemplates(mockTemplates)
          return mockTemplates
        }
        return clubId ? existingTemplates.filter((t) => t.clubId === clubId) : existingTemplates
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: true,
  })
}

export const useTemplatesData = (clubId?: string | null) => {
  return useClubStore((store) => 
    clubId ? store.templates.filter((t) => t.clubId === clubId) : store.templates
  )
}

