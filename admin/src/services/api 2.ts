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

  // Check if response is JSON
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text()
    console.error('API returned non-JSON response:', text.substring(0, 200))
    throw new Error('API returned non-JSON response. Check server configuration.')
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

  async saveTemplate(template: Template): Promise<void> {
    await fetchWithAuth(`${API_BASE}/templates/${template.id}`, {
      method: 'POST',
      body: JSON.stringify(template),
    })
  },

  async deleteTemplate(templateId: string): Promise<void> {
    await fetchWithAuth(`${API_BASE}/templates/${templateId}`, {
      method: 'DELETE',
    })
  },
}

