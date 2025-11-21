'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const redirect = searchParams.get('redirect') || '/route/admin'
        router.push(redirect)
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Invalid credentials. Try again.')
      }
    } catch (err) {
      setError('Network error. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md p-12 border border-gray-800">
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-widest uppercase italic mb-2">
            Route Admin
          </h1>
          <p className="text-sm text-gray-400">
            Sign in to manage templates and club assets
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-xs uppercase tracking-wider mb-2 text-gray-400">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-black border border-gray-800 focus:border-white focus:outline-none transition-colors text-white disabled:opacity-50"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs uppercase tracking-wider mb-2 text-gray-400">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-black border border-gray-800 focus:border-white focus:outline-none transition-colors text-white disabled:opacity-50"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 border border-white hover:bg-white hover:text-black transition-colors uppercase tracking-wider font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Continue'}
          </button>

          {error && (
            <p className="text-xs text-center text-red-500">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
