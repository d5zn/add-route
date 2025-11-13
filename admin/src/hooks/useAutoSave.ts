import { useEffect, useRef } from 'react'
import { useClubStore } from '../store/useClubStore'
import { useTemplate } from '../store/useEditorStore'
import { api } from '../services/api'

export const useAutoSave = (intervalMs: number = 30000) => {
  const template = useTemplate()
  const upsertTemplate = useClubStore((store) => store.upsertTemplate)
  const lastSavedRef = useRef<string | null>(null)
  const isSavingRef = useRef(false)

  useEffect(() => {
    if (!template || !template.id) return

    const templateSnapshot = JSON.stringify(template)
    
    // Если шаблон не изменился с момента последнего сохранения, пропускаем
    if (lastSavedRef.current === templateSnapshot || isSavingRef.current) {
      return
    }

    const intervalId = setInterval(async () => {
      const currentSnapshot = JSON.stringify(template)
      
      // Проверяем еще раз перед сохранением
      if (lastSavedRef.current === currentSnapshot || isSavingRef.current) {
        return
      }

      isSavingRef.current = true
      
      try {
        const updatedTemplate = {
          ...template,
          updatedAt: new Date().toISOString(),
        }
        
        // Сначала обновляем локальный store
        upsertTemplate(updatedTemplate)
        
        // Затем сохраняем на сервер
        await api.saveTemplate(updatedTemplate)
        
        lastSavedRef.current = currentSnapshot
        console.log('Auto-saved template:', template.id)
      } catch (error) {
        console.error('Auto-save failed:', error)
      } finally {
        isSavingRef.current = false
      }
    }, intervalMs)

    return () => {
      clearInterval(intervalId)
    }
  }, [template, upsertTemplate, intervalMs])
}

