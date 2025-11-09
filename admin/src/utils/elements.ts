import { nanoid } from 'nanoid'
import type { TextElement } from '../types/index.ts'

type TextElementOverrides = Partial<Omit<TextElement, 'kind' | 'id' | 'style' | 'box'>> & {
  style?: Partial<TextElement['style']>
  box?: Partial<TextElement['box']>
}

export const createDefaultTextElement = (
  overrides: TextElementOverrides = {},
): TextElement => ({
  id: nanoid(),
  name: overrides.name ?? 'Текст',
  kind: 'text',
  visible: overrides.visible ?? true,
  locked: overrides.locked ?? false,
  position: overrides.position ?? { x: 100, y: 100 },
  rotation: overrides.rotation ?? 0,
  scale: overrides.scale ?? { x: 1, y: 1 },
  opacity: overrides.opacity ?? 1,
  zIndex: overrides.zIndex ?? 1,
  box: {
    width: overrides.box?.width ?? 300,
    height: overrides.box?.height ?? 160,
  },
  autoResize: overrides.autoResize ?? 'none',
  content: overrides.content ?? 'Новый текст',
  style: {
    fontFamily: overrides.style?.fontFamily ?? 'Inter',
    fontWeight: overrides.style?.fontWeight ?? 600,
    fontStyle: overrides.style?.fontStyle ?? 'normal',
    fontSize: overrides.style?.fontSize ?? 48,
    lineHeight: overrides.style?.lineHeight ?? 56,
    letterSpacing: overrides.style?.letterSpacing ?? 0,
    fill: overrides.style?.fill ?? '#0F172A',
    textAlign: overrides.style?.textAlign ?? 'center',
    textTransform: overrides.style?.textTransform ?? 'none',
    stroke: overrides.style?.stroke,
    shadow: overrides.style?.shadow,
  },
})
