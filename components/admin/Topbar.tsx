'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSelectedClub } from '@/store/useClubStore'

export function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const club = useSelectedClub()
  const isEditorRoute = pathname?.includes('/templates/')

  return (
    <nav className="border-b border-gray-800 bg-black">
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-6 flex-1">
          <Link href="/admin/clubs" className="text-xl font-semibold tracking-wider text-white hover:text-gray-300 transition-colors">
            add Route Admin
          </Link>
          
          {isEditorRoute && (
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-900 rounded transition-colors"
              title="Назад"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
          
          {club && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Клуб</div>
              <div className="text-sm font-semibold text-white">{club.name}</div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2 border border-white hover:bg-white hover:text-black transition-colors text-sm font-semibold uppercase tracking-wider"
            disabled
          >
            Опубликовать
          </button>
        </div>
      </div>
    </nav>
  )
}

