import { useEffect, useRef } from 'react'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { useClubStore, useClubTemplates } from '../store/useClubStore'

export const ClubDetailPage = () => {
  const { clubId } = useParams()
  const navigate = useNavigate()

  const club = useClubStore((store) => store.clubs.find((item) => item.id === clubId))
  const selectClub = useClubStore((store) => store.selectClub)
  const selectedClubId = useClubStore((store) => store.selectedClubId)
  const createTemplate = useClubStore((store) => store.createTemplate)
  const loadTemplates = useClubStore((store) => store.loadTemplates)
  const templates = useClubTemplates(clubId)
  const hasLoadedTemplatesRef = useRef<string | null>(null)
  const hasSelectedClubRef = useRef<string | null>(null)

  useEffect(() => {
    if (clubId && hasLoadedTemplatesRef.current !== clubId) {
      hasLoadedTemplatesRef.current = clubId
      loadTemplates(clubId).catch(console.error)
    }
  }, [clubId, loadTemplates])

  useEffect(() => {
    if (clubId && clubId !== selectedClubId && hasSelectedClubRef.current !== clubId) {
      hasSelectedClubRef.current = clubId
      selectClub(clubId)
    }
  }, [clubId, selectedClubId, selectClub])

  if (!club) {
    return (
      <Box px={6} py={5}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Клуб не найден
        </Typography>
        <Button component={RouterLink} to="/clubs" variant="contained">
          Вернуться к списку
        </Button>
      </Box>
    )
  }

  const handleCreateTemplate = () => {
    const template = createTemplate({
      clubId: club.id,
      name: `${club.name} Новый дизайн`,
      background: { color: club.theme?.backgroundColor ?? '#000000' },
    })
    navigate(`/clubs/${club.id}/templates/${template.id}`)
  }

  const theme = {
    primaryColor: club.theme?.primaryColor ?? '#222222',
    secondaryColor: club.theme?.secondaryColor ?? '#222222',
    accentColor: club.theme?.accentColor ?? '#222222',
    backgroundColor: club.theme?.backgroundColor ?? '#000000',
  }

  return (
    <Box px={6} py={5} display="flex" flexDirection="column" gap={4} height="100%" overflow="auto">
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight={300} gutterBottom>
            {club.name}
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip label={club.slug} size="small" />
            <Chip label={club.status === 'active' ? 'Активен' : 'Архив'} color="success" size="small" />
          </Stack>
        </Box>
        <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={handleCreateTemplate}>
          Новый дизайн
        </Button>
      </Stack>

      <Box
        sx={{
          borderRadius: 0,
          p: 4,
          background: theme.backgroundColor,
          border: '1px solid #222222',
          color: '#fff',
        }}
      >
        <Typography variant="subtitle1" fontWeight={300} gutterBottom>
          Настройки клуба
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480 }}>
          {club.description || 'Добавьте описание, чтобы команда понимала tone of voice и специфику клуба.'}
        </Typography>
      </Box>

      <Box>
        <Typography variant="h5" fontWeight={300} gutterBottom>
          Дизайны
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          }}
        >
          {templates.map((template) => {
            const cardBorderColor = '#222222'

            return (
            <Card
              key={template.id}
              sx={{
                borderRadius: 0,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: '#000000',
                border: '1px solid #222222',
                transition: 'border-color 0.2s ease',
                '&:hover': {
                  borderColor: '#444444',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Версия {template.version ?? 1}
                </Typography>
                <Typography variant="h6" fontWeight={300} gutterBottom>
                  {template.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {template.status === 'published' ? 'Опубликован' : 'Черновик'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Обновлен {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString('ru-RU') : '—'}
                </Typography>
              </CardContent>
              <CardActions sx={{ px: 3, pb: 3, pt: 0 }}>
                <Button
                  component={RouterLink}
                  to={`/clubs/${club.id}/templates/${template.id}`}
                  variant="outlined"
                  startIcon={<LaunchRoundedIcon />}
                  fullWidth
                  sx={{ borderColor: cardBorderColor, color: '#FFFFFF', '&:hover': { borderColor: '#444444' } }}
                >
                  Открыть
                </Button>
              </CardActions>
            </Card>
          )})}
        </Box>
      </Box>
    </Box>
  )
}
