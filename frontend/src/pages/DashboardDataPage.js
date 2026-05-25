import React from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import Navbar from '../components/Navbar';
import DataManagement from '../components/DataManagement';
import { useI18n } from '../App';
import useDashboardData from '../hooks/useDashboardData';

export default function DashboardDataPage() {
  const { t } = useI18n();
  const { datasets, refresh } = useDashboardData();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Navbar />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          {t('dashboard.dataManagementPageTitle')}
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('dashboard.dataManagement')}
          </Typography>
          <DataManagement datasets={datasets} onRefresh={refresh} />
        </Paper>
      </Container>
    </Box>
  );
}