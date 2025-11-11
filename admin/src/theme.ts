import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3B82F6',
    },
    secondary: {
      main: '#F97316',
    },
    background: {
      default: '#0f172a',
      paper: 'rgba(15, 23, 42, 0.85)',
    },
    text: {
      primary: '#F8FAFC',
      secondary: 'rgba(248, 250, 252, 0.7)',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'].join(','),
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
})
