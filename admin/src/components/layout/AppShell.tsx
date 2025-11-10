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
        background: 'radial-gradient(circle at 0% 0%, rgba(37, 99, 235, 0.18), transparent 55%), radial-gradient(circle at 100% 0%, rgba(230, 68, 0, 0.18), transparent 55%), linear-gradient(180deg, #040711 0%, #0f172a 30%, #0b1120 100%)',
        color: '#F8FAFC',
      }}
    >
      <Topbar />
      <Box component="main" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>
        <Outlet />
      </Box>
    </Box>
  )
}

