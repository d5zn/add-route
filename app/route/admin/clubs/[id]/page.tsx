'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useClubStore } from '@/store/useClubStore'
import { api } from '@/lib/api'

export default function ClubDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clubId = params.id as string

  const { clubs, templates, selectClub, loadTemplates, deleteTemplate } = useClubStore()
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null)

  const club = useMemo(() => {
    return clubs.find((item) => item.id === clubId) ?? null
  }, [clubs, clubId])

  const clubTemplates = useMemo(() => {
    return templates.filter((t) => t.clubId === clubId)
  }, [templates, clubId])

  const theme = useMemo(() => {
    if (!club) {
      return {
        primaryColor: '#222222',
        backgroundColor: '#000000',
      }
    }
    return {
      primaryColor: club.theme?.primaryColor ?? '#222222',
      backgroundColor: club.theme?.backgroundColor ?? '#000000',
    }
  }, [club])

  useEffect(() => {
    if (!clubId) return

    selectClub(clubId)
    loadTemplates(clubId)
  }, [clubId, selectClub, loadTemplates])

  const handleCreateTemplate = async () => {
    if (!club) return

    try {
      const template = useClubStore.getState().createTemplate({
        clubId: club.id,
        name: `${club.name} Новый дизайн`,
        background: { color: theme.backgroundColor },
      })

      const created = await api.createTemplate(template)
      useClubStore.getState().upsertTemplate(created)
      router.push(`/route/admin/clubs/${club.id}/templates/${created.id}`)
    } catch (error) {
      console.error('Failed to create template:', error)
      alert('Ошибка при создании шаблона')
    }
  }

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    const confirmed = window.confirm(
      `Вы уверены, что хотите удалить шаблон "${templateName}"? Это действие нельзя отменить.`
    )
    if (!confirmed) return

    setDeletingTemplateId(templateId)
    try {
      await api.deleteTemplate(templateId)
      deleteTemplate(templateId)
    } catch (error) {
      console.error('Failed to delete template:', error)
      alert('Ошибка при удалении шаблона')
    } finally {
      setDeletingTemplateId(null)
    }
  }

  if (!club) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Клуб не найден</h2>
        <Link href="/route/admin/clubs" className="px-4 py-2 bg-white text-black hover:bg-gray-200 transition-colors inline-block">
          Вернуться к списку
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-light mb-2">{club.name}</h1>
          <div className="flex gap-2 items-center">
            <span className="px-2 py-1 text-xs border border-gray-800">{club.slug}</span>
            <span className={`px-2 py-1 text-xs ${club.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'}`}>
              {club.status === 'active' ? 'Активен' : 'Архив'}
            </span>
          </div>
        </div>
        <button
          onClick={handleCreateTemplate}
          className="px-4 py-2 bg-white text-black hover:bg-gray-200 transition-colors font-semibold uppercase tracking-wider flex items-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Новый дизайн
        </button>
      </div>

      <div
        className="p-6 border border-gray-800"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        <h3 className="text-lg font-light mb-2">Настройки клуба</h3>
        <p className="text-sm text-gray-400 max-w-md">
          {club.description || 'Добавьте описание, чтобы команда понимала tone of voice и специфику клуба.'}
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-light mb-4">Дизайны</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubTemplates.map((template) => (
            <div
              key={template.id}
              className="border border-gray-800 hover:border-gray-600 transition-colors bg-black flex flex-col"
            >
              <div className="p-6 flex-1 relative">
                <button
                  onClick={() => handleDeleteTemplate(template.id, template.name)}
                  disabled={deletingTemplateId === template.id}
                  className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  title="Удалить шаблон"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" />
                  </svg>
                </button>
                <p className="text-xs text-gray-500 mb-2">Версия {template.version ?? 1}</p>
                <h3 className="text-lg font-light mb-2">{template.name}</h3>
                <p className="text-sm text-gray-400 mb-2">
                  {template.status === 'published' ? 'Опубликован' : 'Черновик'}
                </p>
                <p className="text-xs text-gray-500">
                  Обновлен {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString('ru-RU') : '—'}
                </p>
              </div>
              <div className="p-6 pt-0">
                <Link
                  href={`/route/admin/clubs/${club.id}/templates/${template.id}`}
                  className="block w-full px-4 py-2 border border-gray-800 hover:border-gray-600 transition-colors text-center disabled:opacity-50"
                >
                  {deletingTemplateId === template.id ? 'Удаление...' : 'Открыть'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

