import { Box, Slider, Stack, Typography } from '@mui/material'
import { useEditorStore } from '../../store/useEditorStore'

export const OverlayInspector = () => {
  const template = useEditorStore((store) => store.state.template)
  const pageId = useEditorStore((store) => store.state.pageId)
  const updateElement = useEditorStore((store) => store.updateElement)

  const page = template.pages.find((p) => p.id === pageId) || template.pages[0]
  if (!page) return null

  // Find overlay layer
  const overlayLayer = page.layers?.find((layer) => layer.name === 'Overlay')
  const overlayElement = overlayLayer?.elements?.find((el) => el.name === 'Overlay')

  if (!overlayElement || overlayElement.kind !== 'shape') return null

  const handleOpacityChange = (_event: Event, value: number | number[]) => {
    const opacity = typeof value === 'number' ? value : value[0]
    updateElement(overlayElement.id, {
      ...overlayElement,
      opacity: opacity / 100,
    })
  }

  return (
    <Box px={3} py={2}>
      <Stack spacing={2}>
        <Typography variant="subtitle2" fontWeight={600}>
          Оверлей
        </Typography>

        <Box>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Прозрачность: {Math.round(overlayElement.opacity * 100)}%
          </Typography>
          <Slider
            value={overlayElement.opacity * 100}
            onChange={handleOpacityChange}
            min={0}
            max={100}
            step={1}
            marks={[
              { value: 0, label: '0%' },
              { value: 50, label: '50%' },
              { value: 100, label: '100%' },
            ]}
          />
        </Box>

        <Typography variant="caption" color="text.secondary">
          Оверлей затемняет фон для лучшей читаемости текста
        </Typography>
      </Stack>
    </Box>
  )
}

