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
            // Only update if clubs actually changed
            const existingClubIds = new Set(draft.clubs.map((c) => c.id))
            const newClubIds = new Set(clubsToUse.map((c) => c.id))
            const clubsChanged = 
              existingClubIds.size !== newClubIds.size ||
              ![...existingClubIds].every((id) => newClubIds.has(id)) ||
              ![...newClubIds].every((id) => existingClubIds.has(id)) ||
              draft.clubs.some((existing, idx) => {
                const updated = clubsToUse[idx]
                return !updated || 
                  existing.name !== updated.name ||
                  existing.slug !== updated.slug ||
                  JSON.stringify(existing.theme) !== JSON.stringify(updated.theme) ||
                  existing.status !== updated.status
              })
            
            if (clubsChanged) {
              draft.clubs = clubsToUse
              // Create new summaries array only if clubs changed
              const newSummaries = clubsToUse.map((club: Club) => {
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
              // Only update if summaries actually changed
              const summariesChanged = 
                draft.summaries.length !== newSummaries.length ||
                draft.summaries.some((existing, idx) => {
                  const updated = newSummaries[idx]
                  return !updated ||
                    existing.id !== updated.id ||
                    existing.name !== updated.name ||
                    existing.templatesCount !== updated.templatesCount
                })
              if (summariesChanged) {
                draft.summaries = newSummaries
              }
              if (!draft.selectedClubId && clubsToUse.length > 0) {
                draft.selectedClubId = clubsToUse[0].id
              }
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
          
          set((draft) => {
            let templatesChanged = false
            
            if (clubId) {
              // Replace templates for specific club only if API returned templates
              if (templates.length > 0) {
                // Check if templates actually changed
                const existingTemplates = draft.templates.filter(
                  (template: Template) => template.clubId === clubId,
                )
                const existingIds = new Set(existingTemplates.map((t) => t.id))
                const newIds = new Set(templates.map((t) => t.id))
                templatesChanged = 
                  existingIds.size !== newIds.size ||
                  ![...existingIds].every((id) => newIds.has(id)) ||
                  ![...newIds].every((id) => existingIds.has(id))
                
                if (templatesChanged) {
                  // Remove old templates for this club
                  draft.templates = draft.templates.filter(
                    (template: Template) => template.clubId !== clubId,
                  )
                  // Add new templates from API
                  draft.templates.push(...templates)
                }
              }
              // If API returned empty array, keep existing templates
            } else {
              // Replace all templates only if API returned templates
              if (templates.length > 0) {
                const existingIds = new Set(draft.templates.map((t) => t.id))
                const newIds = new Set(templates.map((t) => t.id))
                templatesChanged = 
                  existingIds.size !== newIds.size ||
                  ![...existingIds].every((id) => newIds.has(id)) ||
                  ![...newIds].every((id) => existingIds.has(id))
                
                if (templatesChanged) {
                  draft.templates = templates
                }
              }
              // If API returned empty array, keep existing templates
            }
            
            // Only update summaries if templates changed
            if (templatesChanged) {
              // Update summaries with new counts
              draft.summaries.forEach((summary) => {
                const newCount = draft.templates.filter(
                  (template: Template) => template.clubId === summary.id,
                ).length
                // Only update if count actually changed
                if (summary.templatesCount !== newCount) {
                  summary.templatesCount = newCount
                }
              })
            }
            
            draft.isLoading = false
          }, false, 'loadTemplates:success')
        } catch (error) {
          console.error('Failed to load templates, using existing or mock data:', error)
          
          set((draft) => {
            if (clubId) {
              // Check if we already have templates for this club
              const existingTemplates = draft.templates.filter(
                (template: Template) => template.clubId === clubId,
              )
              
              // Only add mock templates if we don't have any existing ones
              if (existingTemplates.length === 0) {
                const mockTemplatesForClub = mockTemplates.filter((t: Template) => t.clubId === clubId)
                if (mockTemplatesForClub.length > 0) {
                  draft.templates.push(...mockTemplatesForClub)
                }
              }
              // Otherwise, keep existing templates
            } else {
              // If no clubId specified and we have no templates, use mock data
              if (draft.templates.length === 0) {
                draft.templates = [...mockTemplates]
              }
              // Otherwise, keep existing templates
            }
            
            // Update summaries with correct counts (only if changed)
            draft.summaries.forEach((summary) => {
              const newCount = draft.templates.filter(
                (template: Template) => template.clubId === summary.id,
              ).length
              if (summary.templatesCount !== newCount) {
                summary.templatesCount = newCount
              }
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
