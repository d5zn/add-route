import { useEffect, useRef } from 'react'
import { useClubStore } from '../store/useClubStore'
import { useTemplate, useEditorStore } from '../store/useEditorStore'
import { api } from '../services/api'

export const useAutoSave = (intervalMs: number = 30000) => {
  const template = useTemplate()
  const lastSavedRef = useRef<string | null>(null)
  const isSavingRef = useRef(false)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!template || !template.id) {
      // Очищаем интервал если шаблона нет
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Очищаем предыдущий интервал
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    const intervalId = setInterval(async () => {
      // Получаем актуальный шаблон из store
      const currentTemplate = useEditorStore.getState().state.template
      if (!currentTemplate || !currentTemplate.id) return

      const currentSnapshot = JSON.stringify(currentTemplate)
      
      // Проверяем еще раз перед сохранением
      if (lastSavedRef.current === currentSnapshot || isSavingRef.current) {
        return
      }

      isSavingRef.current = true
      
      try {
        const updatedTemplate = {
          ...currentTemplate,
          updatedAt: new Date().toISOString(),
        }
        
        // Сначала обновляем локальный store
        useClubStore.getState().upsertTemplate(updatedTemplate)
        
        // Затем сохраняем на сервер
        await api.saveTemplate(updatedTemplate)
        
        lastSavedRef.current = currentSnapshot
        console.log('Auto-saved template:', currentTemplate.id)
      } catch (error) {
        console.error('Auto-save failed:', error)
      } finally {
        isSavingRef.current = false
      }
    }, intervalMs)

    intervalRef.current = intervalId

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [template?.id, intervalMs]) // Зависим только от ID шаблона, а не от всего объекта
}

