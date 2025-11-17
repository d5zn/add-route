export type ClubTheme = {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  fontFamily: string
  texture?: string
}

export type Club = {
  id: string
  name: string
  slug: string
  description?: string
  logoAssetId?: string
  theme: ClubTheme
  createdAt: string
  updatedAt: string
  status: 'active' | 'archived'
}

export type ClubSummary = Pick<Club, 'id' | 'name' | 'slug' | 'theme' | 'status'> & {
  templatesCount: number
}
