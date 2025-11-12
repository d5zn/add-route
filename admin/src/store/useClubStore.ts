import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { useShallow } from 'zustand/react/shallow'
import { nanoid } from 'nanoid'
import type { Club, ClubSummary, Template } from '../types/index.ts'
import { mockClubs, mockTemplates } from '../data/mockClubs.ts'
import { createTemplateDraft } from '../utils/templateFactory.ts'
import { api } from '../services/api.ts'

export type ClubStoreState = {
  clubs: Club[]
  summaries: ClubSummary[]
  templates: Template[]
  selectedClubId: string | null
  isLoading: boolean
}

type CreateClubPayload = {
  name: string
  slug: string
  description?: string
  theme: Club['theme']
}

type ClubStoreActions = {
  selectClub(clubId: string): void
  createClub(payload: CreateClubPayload): Club
  createTemplate(payload: { clubId: string; name?: string; background?: Template['pages'][number]['background'] }): Template
  upsertTemplate(template: Template): void
  duplicateTemplate(templateId: string): Template | null
  archiveTemplate(templateId: string): void
  loadClubs(): Promise<void>
  loadTemplates(clubId?: string): Promise<void>
}

type ClubStore = ClubStoreState & ClubStoreActions

export const useClubStore = create<ClubStore>()(
  devtools(
    immer((set, get) => ({
      clubs: mockClubs,
      summaries: mockClubs.map((club: Club) => ({
        id: club.id,
        name: club.name,
        slug: club.slug,
        theme: club.theme,
        status: club.status,
        templatesCount: mockTemplates.filter((template: Template) => template.clubId === club.id).length,
      })),
      templates: mockTemplates,
      selectedClubId: mockClubs[0]?.id ?? null,
      isLoading: false,
      selectClub: (clubId) => {
        set((draft) => {
          draft.selectedClubId = clubId
        }, false, 'selectClub')
      },
      createClub: (payload) => {
        const club: Club = {
          id: nanoid(),
          name: payload.name,
          slug: payload.slug,
          description: payload.description,
          theme: payload.theme,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active',
        }
        set((draft) => {
          draft.clubs.push(club)
          draft.summaries.push({
            id: club.id,
            name: club.name,
            slug: club.slug,
            theme: club.theme,
            status: club.status,
            templatesCount: 0,
          })
          draft.selectedClubId = club.id
        }, false, 'createClub')
        return club
      },
      createTemplate: ({ clubId, name, background }) => {
        const template = createTemplateDraft({
          clubId,
          name,
          background: background ?? { color: '#ffffff' },
        })
        set((draft) => {
          draft.templates.push(template)
        const summary = draft.summaries.find((item) => item.id === clubId)
          if (summary) {
            summary.templatesCount += 1
          }
        }, false, 'createTemplate')
        return template
      },
      upsertTemplate: (template) => {
        set((draft) => {
          const index = draft.templates.findIndex((item) => item.id === template.id)
          if (index >= 0) {
            draft.templates[index] = template
          } else {
            draft.templates.push(template)
          }
          const summary = draft.summaries.find((item) => item.id === template.clubId)
          if (summary) {
            summary.templatesCount = draft.templates.filter(
              (item: Template) => item.clubId === template.clubId,
            ).length
          }
        }, false, 'upsertTemplate')
      },
      duplicateTemplate: (templateId) => {
        const { templates } = get()
        const source = templates.find((item) => item.id === templateId)
        if (!source) return null

        const clone: Template = {
          ...source,
          id: nanoid(),
          name: `${source.name} Copy`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: source.version + 1,
        }

        set((draft) => {
          draft.templates.push(clone)
          const summary = draft.summaries.find((item) => item.id === clone.clubId)
          if (summary) {
            summary.templatesCount += 1
          }
        }, false, 'duplicateTemplate')

        return clone
      },
      archiveTemplate: (templateId) => {
        set((draft) => {
          const template = draft.templates.find((item) => item.id === templateId)
          if (!template) return
          template.status = 'archived'
          template.updatedAt = new Date().toISOString()
        }, false, 'archiveTemplate')
      },
      loadClubs: async () => {
        set((draft) => {
          draft.isLoading = true
        }, false, 'loadClubs:start')
        
        try {
          const clubs = await api.getClubs()
          
          // Use mock data as fallback if API returns empty array
          const clubsToUse = clubs.length > 0 ? clubs : mockClubs
          
          set((draft) => {
            draft.clubs = clubsToUse
            draft.summaries = clubsToUse.map((club: Club) => {
              const templatesCount = draft.templates.filter(
                (template: Template) => template.clubId === club.id,
              ).length
              return {
                id: club.id,
                name: club.name,
                slug: club.slug,
                theme: club.theme,
                status: club.status,
                templatesCount,
              }
            })
            if (!draft.selectedClubId && clubsToUse.length > 0) {
              draft.selectedClubId = clubsToUse[0].id
            }
            draft.isLoading = false
          }, false, 'loadClubs:success')
        } catch (error) {
          console.error('Failed to load clubs, using mock data:', error)
          // Fallback to mock data on error
          set((draft) => {
            draft.clubs = mockClubs
            draft.summaries = mockClubs.map((club: Club) => ({
              id: club.id,
              name: club.name,
              slug: club.slug,
              theme: club.theme,
              status: club.status,
              templatesCount: draft.templates.filter(
                (template: Template) => template.clubId === club.id,
              ).length,
            }))
            if (!draft.selectedClubId && mockClubs.length > 0) {
              draft.selectedClubId = mockClubs[0].id
            }
            draft.isLoading = false
          }, false, 'loadClubs:error')
        }
      },
      loadTemplates: async (clubId?: string) => {
        set((draft) => {
          draft.isLoading = true
        }, false, 'loadTemplates:start')
        
        try {
          const templates = await api.getTemplates(clubId)
          
          // Use mock data as fallback if API returns empty array and no clubId specified
          const templatesToUse = templates.length > 0 || clubId ? templates : mockTemplates
          
          set((draft) => {
            if (clubId) {
              // Replace templates for specific club
              draft.templates = draft.templates.filter(
                (template: Template) => template.clubId !== clubId,
              )
              draft.templates.push(...templatesToUse)
            } else {
              // Replace all templates
              draft.templates = templatesToUse
            }
            
            // Update summaries with correct counts
            draft.summaries.forEach((summary) => {
              summary.templatesCount = draft.templates.filter(
                (template: Template) => template.clubId === summary.id,
              ).length
            })
            
            draft.isLoading = false
          }, false, 'loadTemplates:success')
        } catch (error) {
          console.error('Failed to load templates, using existing data:', error)
          // On error, keep existing templates and just update counts
          set((draft) => {
            // Update summaries with correct counts from existing templates
            draft.summaries.forEach((summary) => {
              summary.templatesCount = draft.templates.filter(
                (template: Template) => template.clubId === summary.id,
              ).length
            })
            draft.isLoading = false
          }, false, 'loadTemplates:error')
        }
      },
    })),
  ),
)

export const useSelectedClub = () => {
  const selectedClubId = useClubStore((store) => store.selectedClubId)
  const clubs = useClubStore((store) => store.clubs)
  return clubs.find((club) => club.id === selectedClubId) ?? null
}

export const useClubTemplates = (clubId?: string | null) => {
  return useClubStore(
    useShallow((store) => {
      if (!clubId) return store.templates
      return store.templates.filter((template) => template.clubId === clubId)
    }),
  )
}
