import { AppBar, Box, Button, IconButton, Stack, Toolbar, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import UndoRoundedIcon from '@mui/icons-material/UndoRounded'
import RedoRoundedIcon from '@mui/icons-material/RedoRounded'
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded'
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { useSelectedClub } from '../../store/useClubStore'
import { useTemplate, useEditorUi, useEditorActions } from '../../store/useEditorStore'

export const Topbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const club = useSelectedClub()
  const template = useTemplate()
  const ui = useEditorUi()
  const { updateUi } = useEditorActions()
  const isEditorRoute = /\/templates\//.test(location.pathname)

  const handleAspectRatioChange = (_event: React.MouseEvent<HTMLElement>, newRatio: string | null) => {
    if (newRatio) {
      updateUi((ui) => {
        ui.aspectRatio = newRatio as '9:16' | '4:5'
      })
    }
  }

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
        <Stack direction="row" spacing={3} alignItems="center" flex={1}>
          <Box component={RouterLink} to="/clubs" sx={{ textDecoration: 'none' }}>
            <Typography
              component="span"
              sx={{
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: 20,
                letterSpacing: '0.02em',
                color: '#FFFFFF',
                textTransform: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              add Route Admin
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
          
          {/* Aspect Ratio Toggle - Center */}
          {isEditorRoute && (
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <ToggleButtonGroup
                value={ui.aspectRatio || '9:16'}
                exclusive
                onChange={handleAspectRatioChange}
                aria-label="aspect ratio"
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    borderColor: '#444444',
                    color: '#CCCCCC',
                    '&.Mui-selected': {
                      backgroundColor: '#FFFFFF',
                      color: '#000000',
                      '&:hover': {
                        backgroundColor: '#FFFFFF',
                      },
                    },
                    '&:hover': {
                      backgroundColor: '#222222',
                    },
                  },
                }}
              >
                <ToggleButton value="9:16" aria-label="9:16">
                  9:16
                </ToggleButton>
                <ToggleButton value="4:5" aria-label="4:5">
                  4:5
                </ToggleButton>
              </ToggleButtonGroup>
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
