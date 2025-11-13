import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api.ts'
import { useClubStore } from '../store/useClubStore.ts'
import { mockClubs } from '../data/mockClubs.ts'

export const useClubs = () => {
  return useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      try {
        const clubs = await api.getClubs()
        const clubsToUse = clubs.length > 0 ? clubs : mockClubs
        // Обновляем store напрямую через getState
        useClubStore.getState().setClubs(clubsToUse)
        return clubsToUse
      } catch (error) {
        console.error('Failed to load clubs:', error)
        useClubStore.getState().setClubs(mockClubs)
        return mockClubs
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}

export const useClubsData = () => {
  return useClubStore((store) => store.clubs)
}

