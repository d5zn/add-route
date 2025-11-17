/**
 * Template Configuration Utilities
 * 
 * This module provides type-safe template configuration handling
 * with runtime validation using Zod schemas.
 */

import { validateTemplate, validateAndNormalizeTemplate, applyTemplateDefaults } from './validation'
import type { Template } from '@/types'

/**
 * Default template configuration
 */
export const DEFAULT_TEMPLATE_CONFIG: Partial<Template> = {
  name: 'New Template',
  description: '',
  tags: [],
  pages: [],
  version: 1,
  status: 'draft',
}

/**
 * Validate template configuration
 * Throws if invalid
 */
export function validateTemplateConfig(template: unknown): Template {
  return validateTemplate(template)
}

/**
 * Validate template configuration safely
 * Returns result object instead of throwing
 */
export function validateTemplateConfigSafe(template: unknown) {
  return validateAndNormalizeTemplate(template)
}

/**
 * Apply default values to a partial template
 * Useful for backward compatibility with old templates
 */
export function normalizeTemplate(template: Partial<Template>): Template {
  return applyTemplateDefaults(template)
}

/**
 * Check if template has required fields
 */
export function isTemplateValid(template: Partial<Template>): boolean {
  return !!(
    template.id &&
    template.name &&
    template.pages &&
    template.pages.length > 0
  )
}

/**
 * Get template default page size
 */
export function getDefaultPageSize(aspectRatio: '9:16' | '4:5' = '9:16') {
  if (aspectRatio === '4:5') {
    return { width: 1080, height: 1350 }
  }
  return { width: 1080, height: 1920 }
}

/**
 * Create a minimal valid template
 */
export function createMinimalTemplate(overrides: Partial<Template>): Template {
  const now = new Date().toISOString()
  const aspectRatio = (overrides as any)?.aspectRatio || '9:16'
  const size = getDefaultPageSize(aspectRatio)
  
  return {
    id: overrides.id || '',
    clubId: overrides.clubId ?? undefined,
    name: overrides.name || 'New Template',
    description: overrides.description,
    tags: overrides.tags || [],
    pages: overrides.pages || [{
      id: `page-${Date.now()}`,
      name: 'Page 1',
      size,
      background: { color: '#FFFFFF' },
      layers: [],
    }],
    createdAt: overrides.createdAt || now,
    updatedAt: overrides.updatedAt || now,
    version: overrides.version || 1,
    status: overrides.status || 'draft',
  }
}

