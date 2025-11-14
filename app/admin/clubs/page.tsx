'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useClubStore } from '@/store/useClubStore'
import { api } from '@/lib/api'
import type { ClubTheme } from '@/types'

const DEFAULT_THEME: ClubTheme = {
  primaryColor: '#2563EB',
  secondaryColor: '#F97316',
  accentColor: '#22D3EE',
  backgroundColor: '#0F172A',
  fontFamily: 'Inter',
}

const fonts = ['Inter', 'Roboto', 'Montserrat', 'Playfair Display', 'Unbounded']

export default function ClubsPage() {
  const router = useRouter()
  const { clubs, templates, loadClubs, loadTemplates, createClub } = useClubStore()
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [theme, setTheme] = useState<ClubTheme>({ ...DEFAULT_THEME })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadClubs()
    loadTemplates()
  }, [loadClubs, loadTemplates])

  const summaries = useMemo(() => {
    return clubs.map((club) => ({
      id: club.id,
      name: club.name,
      slug: club.slug,
      theme: club.theme,
      status: club.status,
      templatesCount: templates.filter((t) => t.clubId === club.id).length,
    }))
  }, [clubs, templates])

  const isCreateDisabled = !name.trim() || !slug.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isCreateDisabled || loading) return

    setLoading(true)
    try {
      const club = await createClub({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        theme,
      })

      setDialogOpen(false)
      setName('')
      setSlug('')
      setDescription('')
      setTheme({ ...DEFAULT_THEME })
      
      router.push(`/admin/clubs/${club.id}`)
    } catch (error) {
      console.error('Failed to create club:', error)
      alert('Ошибка при создании клуба')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-light mb-2">Клубы</h1>
          <p className="text-gray-400">
            Создавайте и управляйте визуальными пакетами для каждого клуба
          </p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="px-4 py-2 bg-white text-black hover:bg-gray-200 transition-colors font-semibold uppercase tracking-wider flex items-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Новый клуб
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {summaries.map((club) => {
          const primaryColor = club.theme?.primaryColor ?? '#222222'
          return (
            <Link
              key={club.id}
              href={`/admin/clubs/${club.id}`}
              className="block border border-gray-800 hover:border-gray-600 transition-colors bg-black p-6"
            >
              <div
                className="h-32 mb-4"
                style={{ backgroundColor: primaryColor }}
              />
              <h3 className="text-lg font-light mb-2">{club.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{club.slug}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{club.templatesCount} дизайнов</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )
        })}
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-gray-800 p-8 max-w-md w-full">
            <h2 className="text-2xl font-light mb-6">Создать новый клуб</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Название клуба</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (!slug) {
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-+|-+$/g, '')
                      )
                    }
                  }}
                  required
                  autoFocus
                  className="w-full px-4 py-2 bg-black border border-gray-800 focus:border-white focus:outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-black border border-gray-800 focus:border-white focus:outline-none text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Используется в URL</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Описание</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-black border border-gray-800 focus:border-white focus:outline-none text-white resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Цвета</label>
                <div className="flex gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Primary</label>
                    <input
                      type="color"
                      value={theme.primaryColor}
                      onChange={(e) => setTheme((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-24 h-10 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Secondary</label>
                    <input
                      type="color"
                      value={theme.secondaryColor}
                      onChange={(e) => setTheme((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-24 h-10 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Accent</label>
                    <input
                      type="color"
                      value={theme.accentColor}
                      onChange={(e) => setTheme((prev) => ({ ...prev, accentColor: e.target.value }))}
                      className="w-24 h-10 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Фон</label>
                <input
                  type="color"
                  value={theme.backgroundColor}
                  onChange={(e) => setTheme((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                  className="w-24 h-10 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Шрифт</label>
                <select
                  value={theme.fontFamily}
                  onChange={(e) => setTheme((prev) => ({ ...prev, fontFamily: e.target.value }))}
                  className="w-full px-4 py-2 bg-black border border-gray-800 focus:border-white focus:outline-none text-white"
                >
                  {fonts.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="px-4 py-2 border border-gray-800 hover:border-white transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isCreateDisabled || loading}
                  className="px-4 py-2 bg-white text-black hover:bg-gray-200 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

