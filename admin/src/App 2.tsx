import { useEffect } from 'react'
import { AppShell } from './components/layout/AppShell'
import { useClubStore } from './store/useClubStore'
import { api } from './services/api'
import { mockClubs, mockTemplates } from './data/mockClubs'
import './App.css'

// Флаг для предотвращения повторной загрузки
let isInitialized = false

const App = () => {
  useEffect(() => {
    // Загружаем данные только один раз при старте приложения
    if (isInitialized) return
    isInitialized = true

    const loadData = async () => {
      try {
        // Загружаем клубы
        const clubs = await api.getClubs()
        if (clubs.length > 0) {
          useClubStore.getState().setClubs(clubs)
        } else {
          useClubStore.getState().setClubs(mockClubs)
        }

        // Загружаем шаблоны
        const templates = await api.getTemplates()
        if (templates.length > 0) {
          useClubStore.getState().setTemplates(templates)
        } else {
          useClubStore.getState().setTemplates(mockTemplates)
        }
      } catch (error) {
        console.error('Failed to load data:', error)
        // Fallback to mock data
        useClubStore.getState().setClubs(mockClubs)
        useClubStore.getState().setTemplates(mockTemplates)
      }
    }

    loadData()
  }, []) // Пустой массив зависимостей - выполняется только один раз
  
  return <AppShell />
}

export default App
