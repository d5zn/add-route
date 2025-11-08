import type { ChangeEvent } from 'react'
import {
  Box,
  Divider,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { HexAlphaColorPicker } from 'react-colorful'
import { useEditorStore, useEditorActions } from '../../store/useEditorStore'
import type { TextElement } from '../../types'

const FONT_WEIGHTS = [300, 400, 500, 600, 700, 800, 900] as const
const FONT_ALIGNMENTS: Array<TextElement['style']['textAlign']> = ['left', 'center', 'right', 'justify']

const fontFamilies = ['Inter', 'Roboto', 'Montserrat', 'Playfair Display', 'Unbounded']

export const TextInspector = () => {
  const template = useEditorStore((store) => store.state.template)
  const pageId = useEditorStore((store) => store.state.pageId)
  const selectedElementIds = useEditorStore((store) => store.state.selectedElementIds)
  const { updateElement } = useEditorActions()

  const selectedId = selectedElementIds[0]

  const page = template.pages.find((candidate) => candidate.id === pageId) ?? template.pages[0]
  const layer = page?.layers[0]

  const selectedText = layer?.elements.find(
    (element) => element.id === selectedId && element.kind === 'text',
  ) as TextElement | undefined

  if (!selectedText) {
    return (
      <Box px={3} py={4} color="text.secondary">
        <Typography variant="body2">Выберите текстовый элемент, чтобы изменить параметры</Typography>
      </Box>
    )
  }

  const handleStyleChange = <K extends keyof TextElement['style']>(
    key: K,
    value: TextElement['style'][K],
  ) => {
    updateElement(selectedText.id, (element) => {
      if (element.kind !== 'text') return
      element.style = { ...element.style, [key]: value }
    })
  }

  const handleNumericChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    const numeric = Number(value) || 0
    switch (name) {
      case 'fontSize':
        handleStyleChange('fontSize', numeric)
        break
      case 'lineHeight':
        handleStyleChange('lineHeight', numeric)
        break
      case 'letterSpacing':
        handleStyleChange('letterSpacing', numeric)
        break
      default:
        break
    }
  }

  return (
    <Stack spacing={3} px={3} py={3}>
      <Box>
        <Typography variant="subtitle1" fontWeight={600}>
          Типографика
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Настройка шрифтов и цветов
        </Typography>
      </Box>

      <Stack spacing={2}>
        <TextField
          label="Шрифт"
          select
          size="small"
          value={selectedText.style.fontFamily}
          onChange={(event) => handleStyleChange('fontFamily', event.target.value)}
        >
          {fontFamilies.map((family) => (
            <MenuItem key={family} value={family}>
              {family}
            </MenuItem>
          ))}
        </TextField>

        <Stack direction="row" spacing={2}>
          <TextField
            label="Размер"
            name="fontSize"
            type="number"
            size="small"
            value={selectedText.style.fontSize}
            onChange={handleNumericChange}
            inputProps={{ min: 8, max: 300 }}
          />
          <TextField
            label="Интерлиньяж"
            name="lineHeight"
            type="number"
            size="small"
            value={selectedText.style.lineHeight}
            onChange={handleNumericChange}
            inputProps={{ min: 8, max: 400 }}
          />
        </Stack>

        <Stack direction="row" spacing={2}>
          <TextField
            label="М/букв"
            name="letterSpacing"
            type="number"
            size="small"
            value={selectedText.style.letterSpacing}
            onChange={handleNumericChange}
          />
          <TextField
            label="Насыщенность"
            select
            size="small"
            value={selectedText.style.fontWeight}
            onChange={(event) => handleStyleChange('fontWeight', Number(event.target.value))}
          >
            {FONT_WEIGHTS.map((weight) => (
              <MenuItem key={weight} value={weight}>
                {weight}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Stack>

      <Divider flexItem />

      <Box>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Выравнивание
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={selectedText.style.textAlign}
          onChange={(_, value: TextElement['style']['textAlign'] | null) => {
            if (value) {
              handleStyleChange('textAlign', value)
            }
          }}
        >
          {FONT_ALIGNMENTS.map((alignment) => (
            <ToggleButton key={alignment} value={alignment} sx={{ textTransform: 'capitalize' }}>
              {alignment}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Divider flexItem />

      <Box>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Цвет текста
        </Typography>
        <Box
          sx={{
            backgroundColor: '#F1F5F9',
            borderRadius: 2,
            p: 2,
          }}
        >
          <HexAlphaColorPicker
            color={selectedText.style.fill}
            onChange={(color) => handleStyleChange('fill', color)}
          />
        </Box>
      </Box>
    </Stack>
  )
}
