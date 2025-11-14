import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { nanoid } from 'nanoid'
import type { Club, Template } from '@/types'
import { api } from '@/lib/api'
import { createTemplateDraft } from '@/utils/templateFactory'

export type ClubStoreState = {
  clubs: Club[]
  templates: Template[]
  selectedClubId: string | null
  loading: boolean
  error: string | null
}

type CreateClubPayload = {
  name: string
  slug: string
  description?: string
  theme: Club['theme']
}

type ClubStoreActions = {
  selectClub(clubId: string): void
  setClubs(clubs: Club[]): void
  setTemplates(templates: Template[]): void
  createClub(payload: CreateClubPayload): Promise<Club>
  createTemplate(payload: { clubId: string; name?: string; background?: any }): Template
  upsertTemplate(template: Template): void
  duplicateTemplate(templateId: string): Template | null
  archiveTemplate(templateId: string): void
  deleteTemplate(templateId: string): void
  loadClubs(): Promise<void>
  loadTemplates(clubId?: string): Promise<void>
}

type ClubStore = ClubStoreState & ClubStoreActions

export const useClubStore = create<ClubStore>()(
  devtools(
    immer((set, get) => ({
      clubs: [],
      templates: [],
      selectedClubId: null,
      loading: false,
      error: null,
      
      selectClub: (clubId) => {
        set((draft) => {
          draft.selectedClubId = clubId
        }, false, 'selectClub')
      },
      
      setClubs: (clubs) => {
        set((draft) => {
          draft.clubs = clubs
        }, false, 'setClubs')
      },
      
      setTemplates: (templates) => {
        set((draft) => {
          draft.templates = templates
        }, false, 'setTemplates')
      },
      
      createClub: async (payload) => {
        set((draft) => {
          draft.loading = true
          draft.error = null
        })
        
        try {
          const club = await api.createClub({
            id: nanoid(),
            name: payload.name,
            slug: payload.slug,
            description: payload.description,
            theme: payload.theme,
            status: 'active',
          })
          
          set((draft) => {
            draft.clubs.push(club)
            draft.selectedClubId = club.id
            draft.loading = false
          })
          
          return club
        } catch (error: any) {
          set((draft) => {
            draft.loading = false
            draft.error = error.message || 'Failed to create club'
          })
          throw error
        }
      },
      
      createTemplate: ({ clubId, name, background }) => {
        const template = createTemplateDraft({
          clubId,
          name,
          background: background ?? { color: '#ffffff' },
        })
        set((draft) => {
          draft.templates.push(template)
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
      
      deleteTemplate: (templateId) => {
        set((draft) => {
          draft.templates = draft.templates.filter((item) => item.id !== templateId)
        }, false, 'deleteTemplate')
      },
      
      loadClubs: async () => {
        set((draft) => {
          draft.loading = true
          draft.error = null
        })
        
        try {
          const clubs = await api.getClubs()
          set((draft) => {
            draft.clubs = clubs
            draft.loading = false
          })
        } catch (error: any) {
          set((draft) => {
            draft.loading = false
            draft.error = error.message || 'Failed to load clubs'
          })
        }
      },
      
      loadTemplates: async (clubId?: string) => {
        set((draft) => {
          draft.loading = true
          draft.error = null
        })
        
        try {
          const templates = await api.getTemplates(clubId)
          set((draft) => {
            draft.templates = templates
            draft.loading = false
          })
        } catch (error: any) {
          set((draft) => {
            draft.loading = false
            draft.error = error.message || 'Failed to load templates'
          })
        }
      },
    })),
  ),
)

export const useSelectedClub = () => {
  return useClubStore((store) => {
    const selectedClubId = store.selectedClubId
    if (!selectedClubId) return null
    return store.clubs.find((club) => club.id === selectedClubId) ?? null
  })
}

export const useClubTemplates = (clubId?: string | null) => {
  return useClubStore((store) => 
    clubId ? store.templates.filter((t) => t.clubId === clubId) : store.templates
  )
}

