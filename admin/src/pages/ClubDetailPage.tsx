import { useEffect, useMemo, useRef } from 'react'
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
import { useClubStore } from '../store/useClubStore'
import { api } from '../services/api'

export const ClubDetailPage = () => {
  const { clubId } = useParams()
  const navigate = useNavigate()
  const hasLoadedTemplatesRef = useRef<string | null>(null)

  // Используем стабильные селекторы - подписываемся только на нужные части
  const createTemplate = useClubStore((store) => store.createTemplate)
  const selectedClubId = useClubStore((store) => store.selectedClubId)
  
  // Подписываемся на clubs, но мемоизируем результат поиска
  const clubs = useClubStore((store) => store.clubs)
  const club = useMemo(() => {
    if (!clubId) return null
    return clubs.find((item) => item.id === clubId) ?? null
  }, [clubs, clubId]) // Зависим от clubs и clubId

  // Подписываемся на templates, но мемоизируем фильтрацию
  const allTemplates = useClubStore((store) => store.templates)
  const templates = useMemo(() => {
    if (!clubId) return allTemplates
    return allTemplates.filter((t) => t.clubId === clubId)
  }, [allTemplates, clubId]) // Зависим от allTemplates и clubId

  // Мемоизируем theme
  const theme = useMemo(() => {
    if (!club) {
      return {
        primaryColor: '#222222',
        secondaryColor: '#222222',
        accentColor: '#222222',
        backgroundColor: '#000000',
      }
    }
    return {
      primaryColor: club.theme?.primaryColor ?? '#222222',
      secondaryColor: club.theme?.secondaryColor ?? '#222222',
      accentColor: club.theme?.accentColor ?? '#222222',
      backgroundColor: club.theme?.backgroundColor ?? '#000000',
    }
  }, [club])

  useEffect(() => {
    if (!clubId) return
    
    // Выбираем клуб только если изменился
    if (selectedClubId !== clubId) {
      useClubStore.getState().selectClub(clubId)
    }
    
    // Загружаем шаблоны для клуба только один раз
    if (hasLoadedTemplatesRef.current === clubId) return
    
    const store = useClubStore.getState()
    const existingTemplates = store.templates.filter((t) => t.clubId === clubId)
    if (existingTemplates.length === 0) {
      hasLoadedTemplatesRef.current = clubId
      api.getTemplates(clubId)
        .then((loadedTemplates) => {
          if (loadedTemplates.length > 0) {
            const currentTemplates = useClubStore.getState().templates
            const otherTemplates = currentTemplates.filter((t) => t.clubId !== clubId)
            useClubStore.getState().setTemplates([...otherTemplates, ...loadedTemplates])
          }
        })
        .catch(() => {
          // Игнорируем ошибки загрузки
          hasLoadedTemplatesRef.current = null // Разрешаем повторную попытку
        })
    } else {
      hasLoadedTemplatesRef.current = clubId
    }
  }, [clubId, selectedClubId]) // Стабильные зависимости

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
    if (!club) return
    const template = createTemplate({
      clubId: club.id,
      name: `${club.name} Новый дизайн`,
      background: { color: theme.backgroundColor },
    })
    navigate(`/clubs/${club.id}/templates/${template.id}`)
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
