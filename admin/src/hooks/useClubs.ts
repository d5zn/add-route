import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api.ts'
import { useClubStore } from '../store/useClubStore.ts'
import { mockClubs } from '../data/mockClubs.ts'

export const useClubs = () => {
  const setClubs = useClubStore((store) => store.setClubs)
  
  return useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      try {
        const clubs = await api.getClubs()
        const clubsToUse = clubs.length > 0 ? clubs : mockClubs
        setClubs(clubsToUse)
        return clubsToUse
      } catch (error) {
        console.error('Failed to load clubs:', error)
        setClubs(mockClubs)
        return mockClubs
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useClubsData = () => {
  return useClubStore((store) => store.clubs)
}

