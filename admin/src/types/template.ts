export type ElementKind =
  | 'text'
  | 'image'
  | 'shape'
  | 'pathText'
  | 'map'
  | 'group'
  | 'decorative'

export type Point = {
  x: number
  y: number
}

export type Size = {
  width: number
  height: number
}

export type BoundingBox = Point & Size

export type TextStyle = {
  fontFamily: string
  fontWeight: number | 'normal' | 'bold' | 'lighter' | 'bolder'
  fontStyle: 'normal' | 'italic' | 'oblique'
  fontSize: number
  lineHeight: number
  letterSpacing: number
  fill: string
  textAlign: 'left' | 'center' | 'right' | 'justify'
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  stroke?: {
    color: string
    width: number
  }
  shadow?: {
    color: string
    offset: Point
    blur: number
  }
}

export type StrokeStyle = {
  color: string
  width: number
  dash?: number[]
  texture?: string
  cap?: CanvasLineCap
  join?: CanvasLineJoin
}

export type FillStyle = {
  color?: string
  gradient?: {
    type: 'linear' | 'radial' | 'conic'
    stops: Array<{ offset: number; color: string }>
    angle?: number
  }
  pattern?: {
    imageId: string
    repeat: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat'
    scale: number
    rotation: number
  }
}

export type MapStyle = {
  provider: 'mapbox' | 'leaflet'
  styleId: string
  zoom: number
  center: [number, number]
  bearing?: number
  pitch?: number
  overlays?: Array<{
    id: string
    type: 'marker' | 'path' | 'polygon'
    color: string
    coordinates: Array<[number, number]>
  }>
}

export type PathDefinition = {
  id: string
  type: 'circle' | 'ellipse' | 'arc' | 'custom'
  data: string
  closed: boolean
}

export type BaseElement = {
  id: string
  name: string
  kind: ElementKind
  visible: boolean
  locked: boolean
  position: Point
  rotation: number
  scale: { x: number; y: number }
  opacity: number
  zIndex: number
}

export type TextElement = BaseElement & {
  kind: 'text'
  box: Size
  content: string
  style: TextStyle
  autoResize: 'width' | 'height' | 'none'
}

export type PathTextElement = BaseElement & {
  kind: 'pathText'
  content: string
  path: PathDefinition
  style: TextStyle
  alignment: 'start' | 'center' | 'end'
  letterSpacing: number
  baselineOffset: number
}

export type ImageElement = BaseElement & {
  kind: 'image'
  box: Size
  assetId: string
  preserveAspectRatio: boolean
  filters?: {
    blur?: number
    brightness?: number
    contrast?: number
    grayscale?: number
    hue?: number
    saturation?: number
  }
}

export type ShapeElement = BaseElement & {
  kind: 'shape'
  box: Size
  shape: 'rectangle' | 'ellipse' | 'polygon' | 'line' | 'custom'
  points?: Point[]
  cornerRadius?: number | [number, number, number, number]
  stroke: StrokeStyle | null
  fill: FillStyle | null
}

export type MapElement = BaseElement & {
  kind: 'map'
  box: Size
  mapStyle: MapStyle
}

export type GroupElement = BaseElement & {
  kind: 'group' | 'decorative'
  children: EditorElement[]
}

export type EditorElement =
  | TextElement
  | PathTextElement
  | ImageElement
  | ShapeElement
  | MapElement
  | GroupElement

export type Layer = {
  id: string
  name: string
  elements: EditorElement[]
  visible: boolean
  locked: boolean
}

export type Page = {
  id: string
  name: string
  size: Size
  background: FillStyle | null
  bleed?: number
  layers: Layer[]
}

export type TemplateMeta = {
  id: string
  name: string
  description?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  version: number
  status: 'draft' | 'published' | 'archived'
}

export type Template = TemplateMeta & {
  clubId?: string
  pages: Page[]
}

export type EditorState = {
  template: Template
  pageId: string
  selectedElementIds: string[]
  hoveredElementId: string | null
  clipboard: EditorElement[] | null
  ui: {
    snapToGrid: boolean
    showGuides: boolean
    showRulers: boolean
    zoom: number
    pan: Point
  }
}
