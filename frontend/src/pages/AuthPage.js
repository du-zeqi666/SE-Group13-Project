import React from 'react';
import { Box, Container, Paper, Typography, Button } from '@mui/material';
import Login from '../components/Login';
import Register from '../components/Register';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import { useI18n } from '../App';

export default function AuthPage({ mode }) {
  const { t, toggleLanguage } = useI18n();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100',
      }}
    >
      <Container maxWidth="xs">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <Button size="small" onClick={toggleLanguage}>
              {t('auth.switchLanguage')}
            </Button>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ScatterPlotIcon color="primary" sx={{ mr: 1, fontSize: 32 }} />
            <Typography variant="h5" color="primary" fontWeight="bold">
              ANN Search
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('auth.subtitle')}
          </Typography>
          {mode === 'login' ? <Login /> : <Register />}
        </Paper>
      </Container>
    </Box>
  );
}
