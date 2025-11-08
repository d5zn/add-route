import { useEffect } from 'react'
import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { useParams } from 'react-router-dom'
import { useClubStore } from '../store/useClubStore'
import { useEditorActions } from '../store/useEditorStore'
import { ElementListPanel } from '../components/sidebar/ElementListPanel'
import { EditorCanvas } from '../components/canvas/EditorCanvas'
import { InspectorPanel } from '../components/inspector/InspectorPanel'

export const TemplateEditorPage = () => {
  const { clubId, templateId } = useParams()
  const selectClub = useClubStore((store) => store.selectClub)
  const template = useClubStore((store) =>
    store.templates.find((item) => item.id === templateId && item.clubId === clubId),
  )
  const { setTemplate } = useEditorActions()

  useEffect(() => {
    if (clubId) {
      selectClub(clubId)
    }
  }, [clubId, selectClub])

  useEffect(() => {
    if (template) {
      const cloned = JSON.parse(JSON.stringify(template)) as typeof template
      setTemplate(cloned)
    }
  }, [template, setTemplate])

  if (!template) {
    return (
      <Box flex={1} display="flex" alignItems="center" justifyContent="center">
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography variant="body1">Загружаем шаблон</Typography>
        </Stack>
      </Box>
    )
  }

  return (
    <Box display="flex" flex={1} minHeight={0}>
      <ElementListPanel />
      <EditorCanvas />
      <InspectorPanel />
    </Box>
  )
}
