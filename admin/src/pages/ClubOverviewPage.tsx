import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useClubStore } from '../store/useClubStore'
import type { ClubTheme } from '../types/index.ts'

const DEFAULT_THEME: ClubTheme = {
  primaryColor: '#2563EB',
  secondaryColor: '#F97316',
  accentColor: '#22D3EE',
  backgroundColor: '#0F172A',
  fontFamily: 'Inter',
}

const fonts = ['Inter', 'Roboto', 'Montserrat', 'Playfair Display', 'Unbounded']

export const ClubOverviewPage = () => {
  const summaries = useClubStore((store) => store.summaries)
  const selectClub = useClubStore((store) => store.selectClub)
  const createClub = useClubStore((store) => store.createClub)
  const navigate = useNavigate()

  const [isDialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [theme, setTheme] = useState<ClubTheme>({ ...DEFAULT_THEME })

  const isCreateDisabled = useMemo(() => !name.trim() || !slug.trim(), [name, slug])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isCreateDisabled) return

    const club = createClub({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      theme,
    })

    setDialogOpen(false)
    setName('')
    setSlug('')
    setDescription('')
    setTheme({ ...DEFAULT_THEME })

    selectClub(club.id)
    navigate(`/clubs/${club.id}`)
  }

  return (
    <Box px={6} py={5} display="flex" flexDirection="column" gap={4} height="100%" overflow="auto">
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Клубы
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Создавайте и управляйте визуальными пакетами для каждого клуба
          </Typography>
        </Box>
        <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={() => setDialogOpen(true)}>
          Новый клуб
        </Button>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        }}
      >
        {summaries.map((club) => (
          <Card
            key={club.id}
            sx={{
              borderRadius: 3,
              height: '100%',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 18px 60px rgba(15, 23, 42, 0.45)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 24px 80px rgba(59, 130, 246, 0.25)',
              },
            }}
          >
            <CardActionArea
              component={RouterLink}
              to={`/clubs/${club.id}`}
              onClick={() => selectClub(club.id)}
              sx={{ height: '100%' }}
            >
              <CardContent>
                <Box
                  sx={{
                    height: 120,
                    borderRadius: 2,
                    mb: 3,
                    background: `linear-gradient(135deg, ${club.theme.primaryColor}, ${club.theme.secondaryColor})`,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  }}
                />
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {club.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {club.slug}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1} mt={2}>
                  <Typography variant="body2" fontWeight={600}>
                    {club.templatesCount} дизайнов
                  </Typography>
                  <ArrowForwardRoundedIcon fontSize="small" color="primary" />
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>

      <Dialog open={isDialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Создать новый клуб</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Stack spacing={3}>
              <TextField
                label="Название клуба"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  if (!slug) {
                    setSlug(
                      event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, ''),
                    )
                  }
                }}
                required
                autoFocus
              />
              <TextField
                label="Slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                helperText="Используется в URL"
                required
              />
              <TextField
                label="Описание"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                multiline
                minRows={3}
              />

              <Typography variant="subtitle1" fontWeight={600}>
                Цвета
              </Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Primary"
                  type="color"
                  value={theme.primaryColor}
                  onChange={(event) => setTheme((prev) => ({ ...prev, primaryColor: event.target.value }))}
                  sx={{ width: 120 }}
                />
                <TextField
                  label="Secondary"
                  type="color"
                  value={theme.secondaryColor}
                  onChange={(event) => setTheme((prev) => ({ ...prev, secondaryColor: event.target.value }))}
                  sx={{ width: 120 }}
                />
                <TextField
                  label="Accent"
                  type="color"
                  value={theme.accentColor}
                  onChange={(event) => setTheme((prev) => ({ ...prev, accentColor: event.target.value }))}
                  sx={{ width: 120 }}
                />
              </Stack>
              <TextField
                label="Фон"
                type="color"
                value={theme.backgroundColor}
                onChange={(event) => setTheme((prev) => ({ ...prev, backgroundColor: event.target.value }))}
                sx={{ width: 120 }}
              />
              <TextField
                label="Шрифт"
                select
                value={theme.fontFamily}
                onChange={(event) => setTheme((prev) => ({ ...prev, fontFamily: event.target.value }))}
                SelectProps={{ native: true }}
              >
                {fonts.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button type="submit" variant="contained" disabled={isCreateDisabled}>
              Создать
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
