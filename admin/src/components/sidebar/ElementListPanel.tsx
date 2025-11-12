import { Fragment } from 'react'
import {
  Box,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import FormatSizeRoundedIcon from '@mui/icons-material/FormatSizeRounded'
import ControlPointRoundedIcon from '@mui/icons-material/ControlPointRounded'
import { useEditorStore } from '../../store/useEditorStore'
import { createDefaultTextElement } from '../../utils/elements'

export const ElementListPanel = () => {
  const template = useEditorStore((store) => store.state.template)
  const pageId = useEditorStore((store) => store.state.pageId)
  const selectedElementIds = useEditorStore((store) => store.state.selectedElementIds)
  const addElement = useEditorStore((store) => store.addElement)
  const selectElements = useEditorStore((store) => store.selectElements)

  const page = template.pages.find((candidate) => candidate.id === pageId) ?? template.pages[0]
  const layers = page?.layers ?? []

  return (
    <Box
      sx={{
        width: 280,
        borderRight: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box px={3} py={2} borderBottom="1px solid" borderColor="divider">
        <Stack direction="row" alignItems="center" spacing={1}>
          <FormatSizeRoundedIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={600}>
            Элементы
          </Typography>
        </Stack>
      </Box>

      <Box px={2} py={2}>
        <Button
          startIcon={<ControlPointRoundedIcon />}
          variant="contained"
          fullWidth
          onClick={() => {
            if (!layers.length) return
            addElement(layers[0].id, createDefaultTextElement())
          }}
        >
          Добавить текст
        </Button>
      </Box>

      <Divider />

      <List dense disablePadding sx={{ flex: 1, overflowY: 'auto' }}>
        {layers.map((layer) => (
          <Fragment key={layer.id}>
            <Box px={2} py={1}>
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                {layer.name}
              </Typography>
            </Box>
            {layer.elements.map((element) => {
              const selected = selectedElementIds.includes(element.id)
              return (
                <ListItemButton
                  key={element.id}
                  selected={selected}
                  onClick={() => selectElements([element.id])}
                  sx={{ borderRadius: 1, mx: 1, mb: 0.5 }}
                >
                  <ListItemText
                    primary={element.name}
                    secondary={element.kind === 'text' ? 'Текст' : element.kind}
                    primaryTypographyProps={{ fontWeight: selected ? 600 : 500 }}
                  />
                </ListItemButton>
              )
            })}
          </Fragment>
        ))}
      </List>
    </Box>
  )
}
