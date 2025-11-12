import { AppBar, Box, Button, IconButton, Stack, Toolbar, Typography } from '@mui/material'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import UndoRoundedIcon from '@mui/icons-material/UndoRounded'
import RedoRoundedIcon from '@mui/icons-material/RedoRounded'
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded'
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { useSelectedClub } from '../../store/useClubStore'
import { useTemplate } from '../../store/useEditorStore'

export const Topbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const club = useSelectedClub()
  const template = useTemplate()
  const isEditorRoute = /\/templates\//.test(location.pathname)

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        borderBottom: '1px solid #222222',
        background: '#000000',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', gap: 4 }}>
        <Stack direction="row" spacing={3} alignItems="center">
          <Box component={RouterLink} to="/clubs" sx={{ textDecoration: 'none' }}>
            <Typography
              component="span"
              sx={{
                fontFamily: '"SF Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                fontStyle: 'italic',
                fontWeight: 850,
                fontSize: 26,
                letterSpacing: '0.24em',
                color: '#FFFFFF',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              Route Admin
            </Typography>
          </Box>
          {isEditorRoute && (
            <IconButton size="small" edge="start" onClick={() => navigate(-1)}>
              <ArrowBackIosNewRoundedIcon fontSize="small" />
            </IconButton>
          )}
          {club && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Клуб
              </Typography>
              <Typography variant="subtitle1" fontWeight={600}>
                {club.name}
              </Typography>
            </Box>
          )}
          {isEditorRoute && template && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Шаблон
              </Typography>
              <Typography variant="subtitle1" fontWeight={600}>
                {template.name}
              </Typography>
            </Box>
          )}
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton color="primary" size="small" disabled>
            <UndoRoundedIcon />
          </IconButton>
          <IconButton color="primary" size="small" disabled>
            <RedoRoundedIcon />
          </IconButton>
          <Box ml={2} display="flex" gap={1}>
            <Button variant="outlined" startIcon={<SaveRoundedIcon />} disabled>
              Сохранить
            </Button>
            {isEditorRoute && template ? (
              <Button
                variant="contained"
                startIcon={<RocketLaunchRoundedIcon />}
                component={RouterLink}
                to={`/clubs/${template.clubId ?? club?.id ?? ''}/templates/${template.id}`}
              >
                Опубликовать
              </Button>
            ) : (
              <Button variant="contained" startIcon={<RocketLaunchRoundedIcon />} disabled>
                Опубликовать
              </Button>
            )}
          </Box>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
