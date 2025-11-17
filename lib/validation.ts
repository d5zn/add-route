import { z } from 'zod'
import type { Template, Page, EditorElement } from '@/types'

// Base types
export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
})

export const SizeSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
})

export const BoundingBoxSchema = PointSchema.merge(SizeSchema)

// TextStyle
export const TextStyleSchema = z.object({
  fontFamily: z.string().default('Inter'),
  fontWeight: z.union([
    z.number(),
    z.enum(['normal', 'bold', 'lighter', 'bolder']),
  ]).default('normal'),
  fontStyle: z.enum(['normal', 'italic', 'oblique']).default('normal'),
  fontSize: z.number().positive().default(16),
  lineHeight: z.number().positive().default(1.4),
  letterSpacing: z.number().default(0),
  fill: z.string().default('#000000'),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).default('left'),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  stroke: z.object({
    color: z.string(),
    width: z.number().positive(),
  }).optional(),
  shadow: z.object({
    color: z.string(),
    offset: PointSchema,
    blur: z.number().nonnegative(),
  }).optional(),
})

// StrokeStyle
export const GradientStopSchema = z.object({
  offset: z.number().min(0).max(1),
  color: z.string(),
})

export const StrokeStyleSchema = z.object({
  color: z.string().optional(),
  gradient: z.object({
    type: z.enum(['linear', 'radial', 'conic']),
    stops: z.array(GradientStopSchema),
    angle: z.number().optional(),
  }).optional(),
  width: z.number().positive().default(1),
  dash: z.array(z.number().positive()).optional(),
  texture: z.string().optional(),
  cap: z.enum(['butt', 'round', 'square']).optional(),
  join: z.enum(['bevel', 'round', 'miter']).optional(),
})

// FillStyle
export const FillStyleSchema = z.object({
  color: z.string().optional(),
  gradient: z.object({
    type: z.enum(['linear', 'radial', 'conic']),
    stops: z.array(GradientStopSchema),
    angle: z.number().optional(),
  }).optional(),
  pattern: z.object({
    imageId: z.string(),
    repeat: z.enum(['repeat', 'repeat-x', 'repeat-y', 'no-repeat']),
    scale: z.number().positive(),
    rotation: z.number(),
  }).optional(),
})

// MapStyle
export const MapStyleSchema = z.object({
  provider: z.enum(['mapbox', 'leaflet']).default('mapbox'),
  styleId: z.string().default('dark'),
  zoom: z.number().min(0).max(22).default(13),
  center: z.tuple([z.number(), z.number()]),
  bearing: z.number().optional(),
  pitch: z.number().optional(),
  pathStyle: z.object({
    fill: z.enum(['solid', 'gradient', 'hard-transition']),
    color: z.string().optional(),
    gradient: z.object({
      stops: z.array(GradientStopSchema),
    }).optional(),
    hardTransition: z.object({
      colors: z.array(z.string()),
      segmentLength: z.number().positive(),
    }).optional(),
    texture: z.string().optional(),
    width: z.number().positive().default(4),
  }).optional(),
  overlays: z.array(z.object({
    id: z.string(),
    type: z.enum(['marker', 'path', 'polygon']),
    color: z.string(),
    coordinates: z.array(z.tuple([z.number(), z.number()])),
  })).optional(),
})

// PathDefinition
export const PathDefinitionSchema = z.object({
  id: z.string(),
  type: z.enum(['circle', 'ellipse', 'arc', 'custom']),
  data: z.string(),
  closed: z.boolean().default(false),
})

// BaseElement
export const BaseElementSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(['text', 'image', 'shape', 'pathText', 'map', 'group', 'decorative']),
  visible: z.boolean().default(true),
  locked: z.boolean().default(false),
  position: PointSchema,
  rotation: z.number().default(0),
  scale: z.object({
    x: z.number().positive().default(1),
    y: z.number().positive().default(1),
  }).default({ x: 1, y: 1 }),
  opacity: z.number().min(0).max(1).default(1),
  zIndex: z.number().default(0),
})

// TextElement
export const TextElementSchema = BaseElementSchema.extend({
  kind: z.literal('text'),
  box: SizeSchema,
  content: z.string().default(''),
  style: TextStyleSchema,
  autoResize: z.enum(['width', 'height', 'none']).default('none'),
})

// PathTextElement
export const PathTextElementSchema = BaseElementSchema.extend({
  kind: z.literal('pathText'),
  content: z.string().default(''),
  path: PathDefinitionSchema,
  style: TextStyleSchema,
  alignment: z.enum(['start', 'center', 'end']).default('start'),
  letterSpacing: z.number().default(0),
  baselineOffset: z.number().default(0),
})

// ImageElement
export const ImageElementSchema = BaseElementSchema.extend({
  kind: z.literal('image'),
  box: SizeSchema,
  assetId: z.string(),
  preserveAspectRatio: z.boolean().default(true),
  filters: z.object({
    blur: z.number().nonnegative().optional(),
    brightness: z.number().optional(),
    contrast: z.number().optional(),
    grayscale: z.number().min(0).max(1).optional(),
    hue: z.number().optional(),
    saturation: z.number().optional(),
  }).optional(),
})

// ShapeElement
export const ShapeElementSchema = BaseElementSchema.extend({
  kind: z.literal('shape'),
  box: SizeSchema,
  shape: z.enum(['rectangle', 'ellipse', 'polygon', 'line', 'custom']),
  points: z.array(PointSchema).optional(),
  cornerRadius: z.union([
    z.number(),
    z.tuple([z.number(), z.number(), z.number(), z.number()]),
  ]).optional(),
  stroke: StrokeStyleSchema.nullable().default(null),
  fill: FillStyleSchema.nullable().default(null),
  blendMode: z.enum([
    'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
    'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion',
  ]).optional(),
})

// MapElement
export const MapElementSchema = BaseElementSchema.extend({
  kind: z.literal('map'),
  box: SizeSchema,
  mapStyle: MapStyleSchema,
})

// GroupElement (recursive)
const EditorElementSchema: z.ZodType<EditorElement> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    TextElementSchema,
    PathTextElementSchema,
    ImageElementSchema,
    ShapeElementSchema,
    MapElementSchema,
    BaseElementSchema.extend({
      kind: z.enum(['group', 'decorative']),
      children: z.array(EditorElementSchema),
    }),
  ])
)

export { EditorElementSchema }

// Layer
export const LayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  elements: z.array(EditorElementSchema),
  visible: z.boolean().default(true),
  locked: z.boolean().default(false),
})

// Page
export const PageSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: SizeSchema,
  background: FillStyleSchema.nullable().default(null),
  bleed: z.number().nonnegative().optional(),
  layers: z.array(LayerSchema),
})

// Template
export const TemplateSchema = z.object({
  id: z.string(),
  clubId: z.string().optional().nullable(),
  name: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  pages: z.array(PageSchema).min(1),
  createdAt: z.string().datetime().or(z.string()), // Accept ISO string or any string
  updatedAt: z.string().datetime().or(z.string()),
  version: z.number().int().positive().default(1),
  status: z.enum(['draft', 'published', 'archived', 'deleted']).default('draft'),
})

// Club Theme
export const ClubThemeSchema = z.object({
  primaryColor: z.string().default('#2563EB'),
  secondaryColor: z.string().default('#F97316'),
  accentColor: z.string().default('#22D3EE'),
  backgroundColor: z.string().default('#0F172A'),
  fontFamily: z.string().default('Inter'),
  texture: z.string().optional(),
})

// Validation functions
export function validateTemplate(data: unknown): Template {
  const parsed = TemplateSchema.parse(data)
  // Convert null to undefined for clubId to match TypeScript type
  return {
    ...parsed,
    clubId: parsed.clubId ?? undefined,
  }
}

export function validateTemplateSafe(data: unknown): { success: boolean; data?: Template; error?: z.ZodError } {
  const result = TemplateSchema.safeParse(data)
  if (result.success) {
    return { 
      success: true, 
      data: {
        ...result.data,
        clubId: result.data.clubId ?? undefined,
      }
    }
  }
  return { success: false, error: result.error }
}

export function validatePage(data: unknown) {
  return PageSchema.parse(data)
}

export function validateElement(data: unknown): EditorElement {
  return EditorElementSchema.parse(data)
}

// Apply defaults to partial template (for backward compatibility)
export function applyTemplateDefaults(partial: Partial<Template>): Template {
  const now = new Date().toISOString()
  
  return {
    id: partial.id || '',
    clubId: partial.clubId ?? undefined,
    name: partial.name || 'Untitled Template',
    description: partial.description,
    tags: partial.tags || [],
    pages: partial.pages || [],
    createdAt: partial.createdAt || now,
    updatedAt: partial.updatedAt || now,
    version: partial.version || 1,
    status: partial.status || 'draft',
  }
}

// Validate and apply defaults
export function validateAndNormalizeTemplate(data: unknown): Template {
  try {
    // Try strict validation first
    return validateTemplate(data)
  } catch (error) {
    // If validation fails, try to apply defaults
    if (error instanceof z.ZodError) {
      console.warn('Template validation failed, applying defaults:', error.issues)
      const partial = data as Partial<Template>
      const normalized = applyTemplateDefaults(partial)
      
      // Try to validate pages individually
      if (normalized.pages.length > 0) {
        normalized.pages = normalized.pages.map((page, index) => {
          try {
            return validatePage(page)
          } catch (pageError) {
            console.warn(`Page ${index} validation failed, using as-is`)
            return page as any
          }
        })
      }
      
      return normalized
    }
    throw error
  }
}

