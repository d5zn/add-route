import { nanoid } from 'nanoid'
import type { Template, Page, Layer, FillStyle } from '../types'

const createDefaultLayer = (name = 'Layer 1'): Layer => ({
  id: nanoid(),
  name,
  elements: [],
  visible: true,
  locked: false,
})

const createDefaultPage = (overrides?: Partial<Page>): Page => ({
  id: overrides?.id ?? nanoid(),
  name: overrides?.name ?? 'Page 1',
  size: overrides?.size ?? { width: 1080, height: 1920 },
  background: overrides?.background ?? ({ color: '#ffffff' } as FillStyle),
  bleed: overrides?.bleed,
  layers: overrides?.layers ?? [createDefaultLayer()],
})

type TemplateOptions = {
  name?: string
  clubId?: string
  description?: string
  status?: Template['status']
  background?: FillStyle | null
}

export const createTemplateDraft = (options: TemplateOptions = {}): Template => {
  const now = new Date().toISOString()
  const page = createDefaultPage({
    background: options.background ?? { color: '#ffffff' },
    name: 'Основная',
  })

  return {
    id: nanoid(),
    clubId: options.clubId,
    name: options.name ?? 'Новый шаблон',
    description: options.description ?? '',
    tags: [],
    createdAt: now,
    updatedAt: now,
    version: 1,
    status: options.status ?? 'draft',
    pages: [page],
  }
}
