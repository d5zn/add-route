import type { Club, Template } from '@/types'

const API_BASE = '/api/admin'

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
      window.location.href = '/admin/login'
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
    return fetchWithAuth<Club[]>(`${API_BASE}/clubs`)
  },

  async getTemplates(clubId?: string): Promise<Template[]> {
    const url = clubId ? `/api/templates?clubId=${encodeURIComponent(clubId)}` : `${API_BASE}/templates`
    return fetchWithAuth<Template[]>(url)
  },

  async getClub(clubId: string): Promise<Club> {
    return fetchWithAuth<Club>(`${API_BASE}/clubs/${clubId}`)
  },

  async createClub(club: Omit<Club, 'createdAt' | 'updatedAt'>): Promise<Club> {
    return fetchWithAuth<Club>(`${API_BASE}/clubs`, {
      method: 'POST',
      body: JSON.stringify(club),
    })
  },

  async updateClub(clubId: string, club: Partial<Club>): Promise<Club> {
    return fetchWithAuth<Club>(`${API_BASE}/clubs/${clubId}`, {
      method: 'PUT',
      body: JSON.stringify(club),
    })
  },

  async deleteClub(clubId: string): Promise<void> {
    await fetchWithAuth(`${API_BASE}/clubs/${clubId}`, {
      method: 'DELETE',
    })
  },


  async getTemplate(templateId: string): Promise<Template> {
    return fetchWithAuth<Template>(`${API_BASE}/templates/${templateId}`)
  },

  async createTemplate(template: Omit<Template, 'createdAt' | 'updatedAt' | 'version'>): Promise<Template> {
    return fetchWithAuth<Template>(`${API_BASE}/templates`, {
      method: 'POST',
      body: JSON.stringify(template),
    })
  },

  async saveTemplate(template: Template): Promise<Template> {
    return fetchWithAuth<Template>(`${API_BASE}/templates/${template.id}`, {
      method: 'PUT',
      body: JSON.stringify(template),
    })
  },

  async deleteTemplate(templateId: string): Promise<void> {
    await fetchWithAuth(`${API_BASE}/templates/${templateId}`, {
      method: 'DELETE',
    })
  },
}

