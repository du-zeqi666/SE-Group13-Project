import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import HistoryIcon from '@mui/icons-material/History';
import InsightsIcon from '@mui/icons-material/Insights';
import DatasetIcon from '@mui/icons-material/Dataset';
import Navbar from '../components/Navbar';
import { useAuth, useI18n } from '../App';
import useDashboardData from '../hooks/useDashboardData';
import { Link as RouterLink } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { datasets, indices, history } = useDashboardData();

  const quickActions = [
    {
      title: t('dashboard.overviewCardDataTitle'),
      description: t('dashboard.overviewCardDataDescription'),
      icon: <DatasetIcon color="primary" sx={{ fontSize: 32 }} />,
      to: '/dashboard/data',
      button: t('dashboard.openDataManagement'),
    },
    {
      title: t('dashboard.overviewCardIndexTitle'),
      description: t('dashboard.overviewCardIndexDescription'),
      icon: <InsightsIcon color="secondary" sx={{ fontSize: 32 }} />,
      to: '/dashboard/index',
      button: t('dashboard.openIndexManagement'),
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Navbar />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          {t('dashboard.welcome', { username: user?.username || '' })}
        </Typography>

        {/* Stats cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <StorageIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{datasets.length}</Typography>
                  <Typography color="text.secondary">{t('dashboard.datasets')}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccountTreeIcon color="secondary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{indices.length}</Typography>
                  <Typography color="text.secondary">{t('dashboard.indices')}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <HistoryIcon color="action" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{history.length}</Typography>
                  <Typography color="text.secondary">{t('dashboard.recentSearches')}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {quickActions.map((item) => (
            <Grid item xs={12} md={6} key={item.to}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  {item.icon}
                  <Typography variant="h6">{item.title}</Typography>
                </Box>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  {item.description}
                </Typography>
                <Button variant="contained" component={RouterLink} to={item.to}>
                  {item.button}
                </Button>
              </Paper>
            </Grid>
          ))}

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('dashboard.recentSearches')}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('dashboard.type')}</TableCell>
                      <TableCell>{t('dashboard.metric')}</TableCell>
                      <TableCell>{t('dashboard.dataset')}</TableCell>
                      <TableCell align="right">Top-K</TableCell>
                      <TableCell align="right">{t('search.distance')} / ms</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary' }}>
                          {t('dashboard.noRecentSearches')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((item) => {
                        const index = indices.find((entry) => entry.id === item.index_id);
                        const dataset = datasets.find((entry) => entry.id === index?.dataset_id);
                        return (
                          <TableRow key={item.id}>
                            <TableCell>{item.type}</TableCell>
                            <TableCell>{index?.metric?.toUpperCase() || '-'}</TableCell>
                            <TableCell>{dataset?.name || '-'}</TableCell>
                            <TableCell align="right">{item.k}</TableCell>
                            <TableCell align="right">{item.query_time_ms}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
