import { Box, Button, Stack, Typography } from '@mui/material'
import { HexColorPicker } from 'react-colorful'
import { useEditorStore } from '../../store/useEditorStore'

export const BackgroundInspector = () => {
  const template = useEditorStore((store) => store.state.template)
  const pageId = useEditorStore((store) => store.state.pageId)
  const updatePage = useEditorStore((store) => store.updatePage)

  const page = template.pages.find((p) => p.id === pageId) || template.pages[0]
  if (!page) return null

  const background = page.background || { color: '#000000' }

  const handleColorChange = (color: string) => {
    updatePage(pageId, {
      ...page,
      background: { color },
    })
  }

  const handleGradientToggle = () => {
    if (background.gradient) {
      // Switch to solid color
      updatePage(pageId, {
        ...page,
        background: { color: background.gradient.stops[1]?.color || '#FFFFFF' },
      })
    } else {
      // Switch to gradient (French flag colors)
      updatePage(pageId, {
        ...page,
        background: {
          gradient: {
            type: 'linear',
            stops: [
              { offset: 0, color: '#0055A4' },
              { offset: 0.5, color: '#FFFFFF' },
              { offset: 1, color: '#EF4135' },
            ],
            angle: 135,
          },
        },
      })
    }
  }

  return (
    <Box px={3} py={2}>
      <Stack spacing={2}>
        <Typography variant="subtitle2" fontWeight={600}>
          Фон страницы
        </Typography>

        <Button variant="outlined" onClick={handleGradientToggle} fullWidth>
          {background.gradient ? 'Сплошной цвет' : 'Градиент'}
        </Button>

        {background.gradient ? (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Градиент (французский флаг)
            </Typography>
            {background.gradient.stops.map((stop, index) => (
              <Box key={index}>
                <Typography variant="caption" mb={1} display="block">{`Цвет ${index + 1} (${Math.round(stop.offset * 100)}%)`}</Typography>
                <HexColorPicker
                  color={stop.color}
                  onChange={(color) => {
                    const newStops = [...background.gradient!.stops]
                    newStops[index] = { ...stop, color }
                    updatePage(pageId, {
                      ...page,
                      background: {
                        gradient: {
                          ...background.gradient!,
                          stops: newStops,
                        },
                      },
                    })
                  }}
                />
              </Box>
            ))}
          </Stack>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Цвет фона
            </Typography>
            <HexColorPicker color={background.color || '#000000'} onChange={handleColorChange} />
          </Box>
        )}
      </Stack>
    </Box>
  )
}

