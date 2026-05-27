import React from 'react';
import { Box, Typography } from '@mui/material';
import DataManagement from '../components/DataManagement';
import GlassCard from '../components/GlassCard';
import { useI18n } from '../App';
import useDashboardData from '../hooks/useDashboardData';

export default function DashboardDataPage() {
  const { t } = useI18n();
  const { datasets, refresh } = useDashboardData();

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        {t('dashboard.dataManagementPageTitle')}
      </Typography>
      <Box
        sx={{
          width: 60,
          height: 3,
          borderRadius: '3px',
          background: (t2) => t2.palette.custom?.gradientBar || 'linear-gradient(135deg, #0d9488, #2563eb)',
          mb: 3,
        }}
      />
      <GlassCard>
        <Typography variant="h6" gutterBottom>
          {t('dashboard.dataManagement')}
        </Typography>
        <DataManagement datasets={datasets} onRefresh={refresh} />
      </GlassCard>
    </Box>
  );
}
