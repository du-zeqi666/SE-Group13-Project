import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { useI18n } from '../App';
import useDashboardData from '../hooks/useDashboardData';
import IndexManagement from '../components/IndexManagement';
import JointIndexManagement from '../components/JointIndexManagement';

export default function DashboardIndexPage() {
  const { t } = useI18n();
  const { datasets, indices, jointIndices, refresh } = useDashboardData();

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        {t('dashboard.indexManagementPageTitle')}
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
      <IndexManagement datasets={datasets} indices={indices} onRefresh={refresh} />
      <Divider sx={{ my: 4 }} />
      <Typography variant="h5" gutterBottom>
        {t('jointIndex.title')}
      </Typography>
      <JointIndexManagement datasets={datasets} jointIndices={jointIndices} onRefresh={refresh} />
    </Box>
  );
}
