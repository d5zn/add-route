import { nanoid } from 'nanoid'
import type {
  Template,
  Page,
  Layer,
  FillStyle,
  TextElement,
  ImageElement,
  ShapeElement,
  GroupElement,
  MapElement,
} from '../types/index.ts'

// Создает элемент метрики (лейбл + цифра как группа)
const createMetricElement = (
  name: string,
  label: string,
  position: { x: number; y: number },
): GroupElement => {
  const labelId = nanoid()
  const valueId = nanoid()

  const labelElement: TextElement = {
    id: labelId,
    name: `${name} Label`,
    kind: 'text',
    visible: true,
    locked: false,
    position: { x: position.x, y: position.y },
    rotation: 0,
    scale: { x: 1, y: 1 },
    opacity: 1,
    zIndex: 0,
    box: { width: 200, height: 40 },
    content: label,
    style: {
      fontFamily: 'Inter',
      fontWeight: 400,
      fontStyle: 'normal',
      fontSize: 14,
      lineHeight: 1.4,
      letterSpacing: 0.5,
      fill: '#FFFFFF',
      textAlign: 'left',
      textTransform: 'uppercase',
    },
    autoResize: 'width',
  }

  const valueElement: TextElement = {
    id: valueId,
    name: `${name} Value`,
    kind: 'text',
    visible: true,
    locked: false,
    position: { x: position.x, y: position.y + 40 },
    rotation: 0,
    scale: { x: 1, y: 1 },
    opacity: 1,
    zIndex: 1,
    box: { width: 200, height: 60 },
    content: '0',
    style: {
      fontFamily: 'Inter',
      fontWeight: 700,
      fontStyle: 'normal',
      fontSize: 32,
      lineHeight: 1.2,
      letterSpacing: 0,
      fill: '#FFFFFF',
      textAlign: 'left',
    },
    autoResize: 'width',
  }

  return {
    id: nanoid(),
    name,
    kind: 'group',
    visible: true,
    locked: false,
    position: { x: position.x, y: position.y },
    rotation: 0,
    scale: { x: 1, y: 1 },
    opacity: 1,
    zIndex: 0,
    children: [labelElement, valueElement],
  }
}

// Создает элемент карты с линией
const createMapElement = (): MapElement => {
  return {
    id: nanoid(),
    name: 'Map',
    kind: 'map',
    visible: true,
    locked: false,
    position: { x: 0, y: 0 },
    rotation: 0,
    scale: { x: 1, y: 1 },
    opacity: 1,
    zIndex: 0,
    box: { width: 1080, height: 1920 },
    mapStyle: {
      provider: 'mapbox',
      styleId: 'dark',
      zoom: 13,
      center: [0, 0],
      pathStyle: {
        fill: 'solid',
        color: '#FFFFFF',
        width: 4,
      },
      overlays: [
        {
          id: nanoid(),
          type: 'path',
          color: '#FFFFFF',
          coordinates: [],
        },
      ],
    },
  }
}

// Создает элемент логотипа
const createLogoElement = (): ImageElement => {
  return {
    id: nanoid(),
    name: 'Logo',
    kind: 'image',
    visible: true,
    locked: false,
    position: { x: 50, y: 50 },
    rotation: 0,
    scale: { x: 1, y: 1 },
    opacity: 1,
    zIndex: 100,
    box: { width: 200, height: 200 },
    assetId: '',
    preserveAspectRatio: true,
  }
}

// Создает оверлей слой
const createOverlayElement = (): ShapeElement => {
  return {
    id: nanoid(),
    name: 'Overlay',
    kind: 'shape',
    visible: true,
    locked: false,
    position: { x: 0, y: 0 },
    rotation: 0,
    scale: { x: 1, y: 1 },
    opacity: 0.3,
    zIndex: 50,
    box: { width: 1080, height: 1920 },
    shape: 'rectangle',
    fill: {
      color: '#000000',
    },
    stroke: null,
    blendMode: 'normal',
  }
}

const createDefaultPage = (overrides?: Partial<Page>): Page => {
  // Создаем дефолтные слои
  const logoLayer: Layer = {
    id: nanoid(),
    name: 'Логотип',
    elements: [createLogoElement()],
    visible: true,
    locked: false,
  }

  const metricsLayer: Layer = {
    id: nanoid(),
    name: 'Метрики',
    elements: [
      // Название и дата
      createMetricElement('Title', 'TITLE', { x: 50, y: 200 }),
      // Дистанция
      createMetricElement('Distance', 'DISTANCE', { x: 50, y: 400 }),
      // Подъем
      createMetricElement('Elevation', 'ELEVATION', { x: 50, y: 600 }),
      // Время
      createMetricElement('Time', 'TIME', { x: 50, y: 800 }),
      // Скорость
      createMetricElement('Speed', 'SPEED', { x: 50, y: 1000 }),
    ],
    visible: true,
    locked: false,
  }

  const mapLayer: Layer = {
    id: nanoid(),
    name: 'Карта',
    elements: [createMapElement()],
    visible: true,
    locked: false,
  }

  const overlayLayer: Layer = {
    id: nanoid(),
    name: 'Оверлей',
    elements: [createOverlayElement()],
    visible: true,
    locked: false,
  }

  const textLayer: Layer = {
    id: nanoid(),
    name: 'Текст',
    elements: [],
    visible: true,
    locked: false,
  }

  // Порядок слоев снизу вверх: Фон (на уровне страницы) -> Карта -> Оверлей -> Метрики -> Логотип -> Текст
  return {
    id: overrides?.id ?? nanoid(),
    name: overrides?.name ?? 'Page 1',
    size: overrides?.size ?? { width: 1080, height: 1920 },
    // Фон настраивается на уровне страницы, пользователь может перезалить в приложении
    background: overrides?.background ?? ({ color: '#ffffff' } as FillStyle),
    bleed: overrides?.bleed,
    layers: overrides?.layers ?? [
      mapLayer,      // Карта (самый нижний слой)
      overlayLayer,  // Оверлей (можно создавать дополнительные)
      metricsLayer,  // Метрики
      logoLayer,     // Логотип
      textLayer,     // Текст (самый верхний, можно добавлять слои)
    ],
  }
}

type TemplateOptions = {
  name?: string
  clubId?: string
  description?: string
  status?: Template['status']
  background?: FillStyle | null
}

export const createTemplateDraft = (options: TemplateOptions = {}): Template => {
  const now = new Date().toISOString()
  const page = createDefaultPage({
    background: options.background ?? { color: '#ffffff' },
    name: 'Основная',
  })

  return {
    id: nanoid(),
    clubId: options.clubId,
    name: options.name ?? 'Новый шаблон',
    description: options.description ?? '',
    tags: [],
    createdAt: now,
    updatedAt: now,
    version: 1,
    status: options.status ?? 'draft',
    pages: [page],
  }
}
