import { AppShell } from './components/layout/AppShell'
import { useInitializeData } from './hooks/useInitializeData'
import './App.css'

const App = () => {
  // Инициализируем данные один раз при монтировании приложения
  useInitializeData()
  
  return <AppShell />
}

export default App
