import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import App from './App.tsx'
import { theme } from './theme.ts'
import './index.css'
import { ClubOverviewPage } from './pages/ClubOverviewPage.tsx'
import { ClubDetailPage } from './pages/ClubDetailPage.tsx'
import { TemplateEditorPage } from './pages/TemplateEditorPage.tsx'

const queryClient = new QueryClient()

const basename = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <Navigate to="clubs" replace /> },
        { path: 'clubs', element: <ClubOverviewPage /> },
        { path: 'clubs/:clubId', element: <ClubDetailPage /> },
        { path: 'clubs/:clubId/templates/:templateId', element: <TemplateEditorPage /> },
      ],
    },
  ],
  { basename },
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
