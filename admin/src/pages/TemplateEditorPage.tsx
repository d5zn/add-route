import { useEffect, useRef } from 'react'
import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { useParams } from 'react-router-dom'
import { useClubStore } from '../store/useClubStore'
import { useEditorStore, useTemplate as useEditorTemplate } from '../store/useEditorStore'
import { ElementListPanel } from '../components/sidebar/ElementListPanel'
import { EditorCanvas } from '../components/canvas/EditorCanvas'
import { InspectorPanel } from '../components/inspector/InspectorPanel'

export const TemplateEditorPage = () => {
  const { clubId, templateId } = useParams()
  const selectClub = useClubStore((store) => store.selectClub)
  const selectedClubId = useClubStore((store) => store.selectedClubId)
  const template = useClubStore((store) =>
    store.templates.find((item) => item.id === templateId && item.clubId === clubId),
  )
  const editorTemplate = useEditorTemplate()
  const setTemplate = useEditorStore((store) => store.setTemplate)
  const lastTemplateIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (clubId && clubId !== selectedClubId) {
      selectClub(clubId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, selectedClubId])

  useEffect(() => {
    if (!template || !templateId) {
      lastTemplateIdRef.current = null
      return
    }
    
    // Предотвращаем повторную установку того же шаблона
    if (lastTemplateIdRef.current === templateId) {
      return
    }
    
    const editorTemplateId = editorTemplate?.id
    if (editorTemplateId && editorTemplateId === templateId) {
      lastTemplateIdRef.current = templateId
      return
    }
    
    if (import.meta.env.DEV) {
      console.count('TemplateEditorPage setTemplate effect')
    }
    
    const cloned = JSON.parse(JSON.stringify(template)) as typeof template
    setTemplate(cloned)
    lastTemplateIdRef.current = templateId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, template?.id])

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
