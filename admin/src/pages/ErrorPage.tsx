import { Box, Typography, Button } from '@mui/material'
import { useRouteError, isRouteErrorResponse } from 'react-router-dom'

export const ErrorPage = () => {
  const error = useRouteError()

  let title = 'Что-то пошло не так'
  let message = 'Попробуйте обновить страницу.'

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`
    message = error.data || message
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000000',
        color: '#FFFFFF',
        px: 4,
      }}
    >
      <Box sx={{ maxWidth: 400, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={300} gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {message}
        </Typography>
        <Button variant="outlined" color="inherit" onClick={() => window.location.assign('/route/admin/')}>
          На главную
        </Button>
      </Box>
    </Box>
  )
}

