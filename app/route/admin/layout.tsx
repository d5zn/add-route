import { ReactNode } from 'react'
import { Topbar } from '@/components/admin/Topbar'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Topbar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
