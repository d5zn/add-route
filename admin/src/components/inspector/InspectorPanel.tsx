import { Box, Divider, Stack, Typography } from '@mui/material'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import { TextInspector } from './TextInspector'
import { BackgroundInspector } from './BackgroundInspector'
import { OverlayInspector } from './OverlayInspector'
import { ImageInspector } from './ImageInspector'
import { ShapeInspector } from './ShapeInspector'
import { useEditorStore } from '../../store/useEditorStore'

export const InspectorPanel = () => {
  const template = useEditorStore((store) => store.state.template)
  const pageId = useEditorStore((store) => store.state.pageId)
  const selectedElementIds = useEditorStore((store) => store.state.selectedElementIds)

  const selectedId = selectedElementIds[0]

  const page = template.pages.find((candidate) => candidate.id === pageId) ?? template.pages[0]
  const allLayers = page?.layers ?? []
  
  // Find selected element across all layers
  let selectedElement: import('../../types').EditorElement | undefined
  for (const layer of allLayers) {
    const element = layer.elements.find((element) => element.id === selectedId)
    if (element) {
      selectedElement = element
      break
    }
  }

  // Determine which inspector to show based on selected element
  const showBackgroundInspector = !selectedElement // Show when no element selected
  const showOverlayInspector = !selectedElement // Show when no element selected
  const showImageInspector = selectedElement?.kind === 'image'
  const showTextInspector = selectedElement?.kind === 'text'
  const showShapeInspector = selectedElement?.kind === 'shape'

  return (
    <Box
      sx={{
        width: 320,
        borderLeft: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box px={3} py={2} borderBottom="1px solid" borderColor="divider">
        <Stack direction="row" spacing={1} alignItems="center">
          <TuneRoundedIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={600}>
            Свойства
          </Typography>
        </Stack>
      </Box>
      <Box flex={1} overflow="auto">
        {showBackgroundInspector && (
          <>
            <BackgroundInspector />
            <Divider />
          </>
        )}
        {showOverlayInspector && (
          <>
            <OverlayInspector />
            <Divider />
          </>
        )}
        {showImageInspector && (
          <>
            <ImageInspector />
            <Divider />
          </>
        )}
        {showTextInspector && (
          <>
            <TextInspector />
            <Divider />
          </>
        )}
        {showShapeInspector && (
          <>
            <ShapeInspector />
            <Divider />
          </>
        )}
        {!selectedElement && (
          <Box px={3} py={4} color="text.secondary">
            <Typography variant="body2">Выберите элемент для редактирования</Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
