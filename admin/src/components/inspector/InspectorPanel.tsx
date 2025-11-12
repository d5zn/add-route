import { Box, Divider, Stack, Typography } from '@mui/material'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import { TextInspector } from './TextInspector'
import { BackgroundInspector } from './BackgroundInspector'
import { OverlayInspector } from './OverlayInspector'

export const InspectorPanel = () => (
  <Box
    sx={{
      width: 320,
      borderLeft: '1px solid',
      borderColor: 'divider',
      backgroundColor: 'background.paper',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Box px={3} py={2} borderBottom="1px solid" borderColor="divider">
      <Stack direction="row" spacing={1} alignItems="center">
        <TuneRoundedIcon color="primary" />
        <Typography variant="subtitle1" fontWeight={600}>
          Свойства
        </Typography>
      </Stack>
    </Box>
    <Box flex={1} overflow="auto">
      <BackgroundInspector />
      <Divider />
      <OverlayInspector />
      <Divider />
      <TextInspector />
    </Box>
  </Box>
)
