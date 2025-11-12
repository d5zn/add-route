import { useEffect, useRef } from 'react'
import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { useParams } from 'react-router-dom'
import { useClubStore } from '../store/useClubStore'
import { useEditorStore, useTemplate as useEditorTemplate } from '../store/useEditorStore'
import { api } from '../services/api.ts'
import { ElementListPanel } from '../components/sidebar/ElementListPanel'
import { NativeCanvasEditor } from '../components/canvas/NativeCanvasEditor'
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
  const upsertTemplate = useClubStore((store) => store.upsertTemplate)
  const lastTemplateIdRef = useRef<string | null>(null)
  const isSettingRef = useRef(false)
  const hasLoadedFromApiRef = useRef(false)

  useEffect(() => {
    if (clubId && clubId !== selectedClubId) {
      selectClub(clubId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, selectedClubId])

  // Загружаем шаблон из API при первой загрузке
  useEffect(() => {
    if (!templateId || hasLoadedFromApiRef.current) return
    
    hasLoadedFromApiRef.current = true
    api.getTemplate(templateId)
      .then((apiTemplate) => {
        // Обновляем шаблон в store, если он был загружен из API
        upsertTemplate(apiTemplate)
      })
      .catch((error) => {
        console.warn('Failed to load template from API, using store template:', error)
        hasLoadedFromApiRef.current = false
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId])

  useEffect(() => {
    // Используем только templateId из URL для отслеживания изменений
    if (!templateId) {
      lastTemplateIdRef.current = null
      isSettingRef.current = false
      hasLoadedFromApiRef.current = false
      return
    }
    
    // Предотвращаем повторную установку того же шаблона
    if (lastTemplateIdRef.current === templateId) {
      return
    }
    
    // Если уже устанавливаем шаблон, не запускаем снова
    if (isSettingRef.current) {
      return
    }
    
    // Если шаблон еще не загружен, ждем
    if (!template) {
      return
    }
    
    // Если шаблон уже установлен в редакторе, не устанавливаем снова
    // Проверяем editorTemplateId внутри эффекта, но не добавляем в зависимости
    const currentEditorTemplateId = editorTemplate?.id
    if (currentEditorTemplateId && currentEditorTemplateId === templateId) {
      lastTemplateIdRef.current = templateId
      isSettingRef.current = false
      return
    }
    
    if (import.meta.env.DEV) {
      console.count('TemplateEditorPage setTemplate effect')
    }
    
    isSettingRef.current = true
    const cloned = JSON.parse(JSON.stringify(template)) as typeof template
    setTemplate(cloned)
    lastTemplateIdRef.current = templateId
    
    // Сбрасываем флаг после небольшой задержки, чтобы избежать повторных вызовов
    const timeoutId = setTimeout(() => {
      isSettingRef.current = false
    }, 100)
    
    return () => {
      clearTimeout(timeoutId)
    }
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
    <Box 
      display="flex" 
      flex={1} 
      minHeight={0}
      sx={{
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        alignSelf: 'stretch',
      }}
    >
      <ElementListPanel />
      <Box
        sx={{
          flex: '1 1 0%',
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          position: 'relative',
        }}
      >
        <NativeCanvasEditor />
      </Box>
      <InspectorPanel />
    </Box>
  )
}
