import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { nanoid } from 'nanoid'
import type { Club, Template } from '../types/index.ts'
import { mockClubs, mockTemplates } from '../data/mockClubs.ts'
import { createTemplateDraft } from '../utils/templateFactory.ts'

export type ClubStoreState = {
  clubs: Club[]
  templates: Template[]
  selectedClubId: string | null
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
  createClub(payload: CreateClubPayload): Club
  createTemplate(payload: { clubId: string; name?: string; background?: Template['pages'][number]['background'] }): Template
  upsertTemplate(template: Template): void
  duplicateTemplate(templateId: string): Template | null
  archiveTemplate(templateId: string): void
}

type ClubStore = ClubStoreState & ClubStoreActions

export const useClubStore = create<ClubStore>()(
  devtools(
    immer((set, get) => ({
      clubs: mockClubs,
      templates: mockTemplates,
      selectedClubId: mockClubs[0]?.id ?? null,
      selectClub: (clubId) => {
        set((draft) => {
          draft.selectedClubId = clubId
        }, false, 'selectClub')
      },
      setClubs: (clubs) => {
        set((draft) => {
          // Обновляем только если данные действительно изменились
          const currentIds = new Set(draft.clubs.map(c => c.id))
          const newIds = new Set(clubs.map(c => c.id))
          const changed = 
            currentIds.size !== newIds.size ||
            ![...currentIds].every(id => newIds.has(id)) ||
            ![...newIds].every(id => currentIds.has(id))
          
          if (changed) {
            draft.clubs = clubs
          }
        }, false, 'setClubs')
      },
      setTemplates: (templates) => {
        set((draft) => {
          // Обновляем только если данные действительно изменились
          const currentIds = new Set(draft.templates.map(t => t.id))
          const newIds = new Set(templates.map(t => t.id))
          const changed = 
            currentIds.size !== newIds.size ||
            ![...currentIds].every(id => newIds.has(id)) ||
            ![...newIds].every(id => currentIds.has(id))
          
          if (changed) {
            draft.templates = templates
          }
        }, false, 'setTemplates')
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
    })),
  ),
)

export const useSelectedClub = () => {
  const selectedClubId = useClubStore((store) => store.selectedClubId)
  const clubs = useClubStore((store) => store.clubs)
  return clubs.find((club) => club.id === selectedClubId) ?? null
}

export const useClubTemplates = (clubId?: string | null) => {
  return useClubStore((store) => 
    clubId ? store.templates.filter((t) => t.clubId === clubId) : store.templates
  )
}
