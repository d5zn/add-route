import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'
import { Topbar } from './components/layout/Topbar'
import './App.css'

function App() {
  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <Topbar />
      <Box flex={1} minHeight={0} bgcolor="background.default">
        <Outlet />
      </Box>
    </Box>
  )
}

export default App
