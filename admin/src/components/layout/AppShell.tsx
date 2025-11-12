import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'
import { Topbar } from './Topbar'

export const AppShell = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#000000',
        color: '#FFFFFF',
      }}
    >
      <Topbar />
      <Box component="main" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <Outlet />
      </Box>
    </Box>
  )
}

