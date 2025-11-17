import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import App from './App.tsx'
import { theme } from './theme.ts'
import './index.css'
import { ClubOverviewPage } from './pages/ClubOverviewPage.tsx'
import { ClubDetailPage } from './pages/ClubDetailPage.tsx'
import { TemplateEditorPage } from './pages/TemplateEditorPage.tsx'
import { ErrorPage } from './pages/ErrorPage.tsx'

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
      errorElement: <ErrorPage />,
    },
  ],
  {
    basename,
    future: {
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
      v7_relativeSplatPath: true,
    },
  },
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider
        router={router}
        future={{
          v7_startTransition: true,
        }}
      />
    </ThemeProvider>
  </StrictMode>,
)
