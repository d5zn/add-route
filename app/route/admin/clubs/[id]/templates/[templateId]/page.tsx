'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useClubStore } from '@/store/useClubStore'
import { api } from '@/lib/api'

export default function TemplateEditorPage() {
  const params = useParams()
  const router = useRouter()
  const clubId = params.id as string
  const templateId = params.templateId as string
  
  const { templates, selectedClubId, selectClub, upsertTemplate } = useClubStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedFromApiRef = useRef(false)

  const template = templates.find(
    (item) => item.id === templateId && item.clubId === clubId
  )

  useEffect(() => {
    if (clubId && clubId !== selectedClubId) {
      selectClub(clubId)
    }
  }, [clubId, selectedClubId, selectClub])

  useEffect(() => {
    if (!templateId || hasLoadedFromApiRef.current) return
    
    hasLoadedFromApiRef.current = true
    setLoading(true)
    
    api.getTemplate(templateId)
      .then((apiTemplate) => {
        upsertTemplate(apiTemplate)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load template:', err)
        setError('Не удалось загрузить шаблон')
        setLoading(false)
        hasLoadedFromApiRef.current = false
      })
  }, [templateId, upsertTemplate])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Загружаем шаблон</p>
        </div>
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">
          {error || 'Шаблон не найден'}
        </h2>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-800 hover:border-white transition-colors"
        >
          Назад
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Sidebar - Element List */}
      <div className="w-64 border-r border-gray-800 bg-black p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-gray-400">
          Элементы
        </h3>
        <div className="space-y-2">
          {template.pages[0]?.layers.map((layer) => (
            <div key={layer.id} className="p-2 border border-gray-800 hover:border-gray-600 transition-colors">
              <p className="text-sm font-medium">{layer.name}</p>
              <p className="text-xs text-gray-500">{layer.elements.length} элементов</p>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-light mb-4">{template.name}</h2>
          <p className="text-gray-400 mb-6">
            Canvas Editor (Konva integration coming soon)
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>✓ Template loaded: {template.id}</p>
            <p>✓ Pages: {template.pages.length}</p>
            <p>✓ Status: {template.status}</p>
            <p>✓ Version: {template.version}</p>
          </div>
        </div>
      </div>

      {/* Inspector Panel */}
      <div className="w-80 border-l border-gray-800 bg-black p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-gray-400">
          Свойства
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-2">Название</label>
            <input
              type="text"
              value={template.name}
              readOnly
              className="w-full px-3 py-2 bg-black border border-gray-800 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-2">Статус</label>
            <div className="px-3 py-2 bg-black border border-gray-800 text-sm">
              {template.status === 'published' ? 'Опубликован' : 'Черновик'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

