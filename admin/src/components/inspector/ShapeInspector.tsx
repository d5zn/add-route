import { Box, Stack, Typography } from '@mui/material'
import { useEditorStore } from '../../store/useEditorStore'
import type { ShapeElement } from '../../types'

export const ShapeInspector = () => {
  const template = useEditorStore((store) => store.state.template)
  const pageId = useEditorStore((store) => store.state.pageId)
  const selectedElementIds = useEditorStore((store) => store.state.selectedElementIds)

  const selectedId = selectedElementIds[0]

  const page = template.pages.find((candidate) => candidate.id === pageId) ?? template.pages[0]
  const allLayers = page?.layers ?? []
  
  // Find selected shape element across all layers
  let selectedShape: ShapeElement | undefined
  for (const layer of allLayers) {
    const element = layer.elements.find(
      (element) => element.id === selectedId && element.kind === 'shape',
    )
    if (element) {
      selectedShape = element as ShapeElement
      break
    }
  }

  if (!selectedShape) {
    return (
      <Box px={3} py={4} color="text.secondary">
        <Typography variant="body2">Выберите фигуру, чтобы изменить параметры</Typography>
      </Box>
    )
  }

  return (
    <Box px={3} py={2}>
      <Stack spacing={2}>
        <Typography variant="subtitle2" fontWeight={600}>
          Фигура
        </Typography>

        <Box>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Тип: {selectedShape.shape}
          </Typography>
        </Box>

        {selectedShape.stroke && (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Обводка
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Цвет: {selectedShape.stroke.color || 'Градиент'}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Толщина: {selectedShape.stroke.width}px
            </Typography>
          </Box>
        )}

        {selectedShape.fill && (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Заливка
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Цвет: {selectedShape.fill.color || 'Градиент'}
            </Typography>
          </Box>
        )}

        <Typography variant="caption" color="text.secondary">
          Детальные настройки фигур будут добавлены позже
        </Typography>
      </Stack>
    </Box>
  )
}

