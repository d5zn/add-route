import type { Club, Template } from '../types/index.ts'
import { createTemplateDraft } from '../utils/templateFactory.ts'

export const mockClubs: Club[] = [
  {
    id: 'hedonism',
    name: 'HEDONISM',
    slug: 'hedonism',
    description: 'Комьюнити любителей бега и хорошего настроения',
    theme: {
      primaryColor: '#FF5A5F',
      secondaryColor: '#00A699',
      accentColor: '#FC642D',
      backgroundColor: '#FFFFFF',
      fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    status: 'active',
  },
  {
    id: 'not-in-paris',
    name: 'NOT IN PARIS',
    slug: 'not-in-paris',
    description: 'Клуб бегунов NOT IN PARIS',
    theme: {
      primaryColor: '#1E40AF',
      secondaryColor: '#10B981',
      accentColor: '#F59E0B',
      backgroundColor: '#FFFFFF',
      fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    },
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z',
    status: 'active',
  },
]

export const mockTemplates: Template[] = [
  createTemplateDraft({ clubId: mockClubs[0].id, name: 'Анонс забега' }),
  createTemplateDraft({ clubId: mockClubs[0].id, name: 'Результаты' }),
  createTemplateDraft({ clubId: mockClubs[1].id, name: 'Новичкам' }),
]


