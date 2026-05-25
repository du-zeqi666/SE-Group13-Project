import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import Navbar from '../components/Navbar';
import { useI18n } from '../App';
import useDashboardData from '../hooks/useDashboardData';
import IndexManagement from '../components/IndexManagement';

export default function DashboardIndexPage() {
  const { t } = useI18n();
  const { datasets, indices, refresh } = useDashboardData();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          {t('dashboard.indexManagementPageTitle')}
        </Typography>
        <IndexManagement datasets={datasets} indices={indices} onRefresh={refresh} />
      </Container>
    </Box>
  );
}