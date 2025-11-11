import { useEffect } from 'react'
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
import Grid from '@mui/material/Grid'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { useClubStore, useClubTemplates } from '../store/useClubStore'

export const ClubDetailPage = () => {
  const { clubId } = useParams()
  const navigate = useNavigate()

  const club = useClubStore((store) => store.clubs.find((item) => item.id === clubId))
  const selectClub = useClubStore((store) => store.selectClub)
  const createTemplate = useClubStore((store) => store.createTemplate)
  const templates = useClubTemplates(clubId)

  useEffect(() => {
    if (clubId) {
      selectClub(clubId)
    }
  }, [clubId, selectClub])

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
      background: { color: club.theme.backgroundColor },
    })
    navigate(`/clubs/${club.id}/templates/${template.id}`)
  }

  const theme = club.theme ?? {
    primaryColor: '#2563EB',
    secondaryColor: '#F97316',
    accentColor: '#22D3EE',
    backgroundColor: '#0F172A',
    fontFamily: 'Inter',
  }

  return (
    <Box px={6} py={5} display="flex" flexDirection="column" gap={4} height="100%" overflow="auto">
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
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
          borderRadius: 3,
          p: 4,
          background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
          color: '#fff',
        }}
      >
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Настройки клуба
        </Typography>
        <Typography variant="body2" sx={{ maxWidth: 480 }}>
          {club.description || 'Добавьте описание, чтобы команда понимала tone of voice и специфику клуба.'}
        </Typography>
      </Box>

      <Box>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Дизайны
        </Typography>
        <Grid container spacing={3}>
          {templates.map((template) => (
            <Grid key={template.id} item xs={12} md={6} lg={4}>
              <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Версия {template.version ?? 1}
                  </Typography>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
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
                    variant="contained"
                    startIcon={<LaunchRoundedIcon />}
                    fullWidth
                  >
                    Открыть
                  </Button>
                  <Button variant="text" startIcon={<EditRoundedIcon />} disabled>
                    Редактировать описание
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  )
}
