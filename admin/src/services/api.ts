import type { Club, Template } from '../types/index.ts'

const API_BASE = '/route/admin/api'

async function fetchWithAuth<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      // Redirect to login if unauthorized
      window.location.href = '/route/admin/login'
      throw new Error('Unauthorized')
    }
    throw new Error(`API error: ${response.statusText}`)
  }

  return response.json()
}

export const api = {
  async getClubs(): Promise<Club[]> {
    const data = await fetchWithAuth<{ clubs: Club[] }>(`${API_BASE}/clubs`)
    return data.clubs
  },

  async getTemplates(clubId?: string): Promise<Template[]> {
    const url = clubId ? `${API_BASE}/templates?clubId=${encodeURIComponent(clubId)}` : `${API_BASE}/templates`
    const data = await fetchWithAuth<{ templates: Template[] }>(url)
    return data.templates
  },

  async getTemplate(templateId: string): Promise<Template> {
    const data = await fetchWithAuth<{ template: Template }>(`${API_BASE}/templates/${templateId}`)
    return data.template
  },
}

