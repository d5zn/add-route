import { useState, useRef, ChangeEvent } from 'react'
import { Box, Button, Stack, Typography, CircularProgress } from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import { useEditorStore } from '../../store/useEditorStore'
import type { ImageElement } from '../../types'

export const ImageInspector = () => {
  const template = useEditorStore((store) => store.state.template)
  const pageId = useEditorStore((store) => store.state.pageId)
  const selectedElementIds = useEditorStore((store) => store.state.selectedElementIds)
  const updateElement = useEditorStore((store) => store.updateElement)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedId = selectedElementIds[0]

  const page = template.pages.find((candidate) => candidate.id === pageId) ?? template.pages[0]
  const allLayers = page?.layers ?? []
  
  // Find selected image element across all layers
  let selectedImage: ImageElement | undefined
  for (const layer of allLayers) {
    const element = layer.elements.find(
      (element) => element.id === selectedId && element.kind === 'image',
    )
    if (element) {
      selectedImage = element as ImageElement
      break
    }
  }

  if (!selectedImage) {
    return (
      <Box px={3} py={4} color="text.secondary">
        <Typography variant="body2">Выберите изображение, чтобы изменить параметры</Typography>
      </Box>
    )
  }

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите файл изображения')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Размер файла не должен превышать 10MB')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('elementId', selectedImage.id)

      const response = await fetch('/route/admin/api/upload-asset', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(error.error || 'Ошибка загрузки файла')
      }

      const data = await response.json()
      const assetId = data.assetId || data.filename || file.name

      // Update element with new asset ID
      updateElement(selectedImage.id, (element) => {
        if (element.kind !== 'image') return
        element.assetId = assetId
      })
    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : 'Ошибка загрузки файла')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Box px={3} py={2}>
      <Stack spacing={2}>
        <Typography variant="subtitle2" fontWeight={600}>
          Изображение
        </Typography>

        <Box>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Текущий файл
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
            {selectedImage.assetId || 'Не задано'}
          </Typography>
        </Box>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        <Button
          variant="outlined"
          startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
          onClick={handleUploadClick}
          disabled={uploading}
          fullWidth
        >
          {uploading ? 'Загрузка...' : 'Загрузить изображение'}
        </Button>

        <Typography variant="caption" color="text.secondary">
          Поддерживаемые форматы: PNG, JPG, SVG. Максимальный размер: 10MB
        </Typography>
      </Stack>
    </Box>
  )
}

