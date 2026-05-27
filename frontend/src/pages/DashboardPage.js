import React, { useState } from 'react';
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
  Checkbox,
  IconButton,
  TextField,
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
import { deleteHistory } from '../api/client';
import DeleteIcon from '@mui/icons-material/Delete';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { datasets, indices, history, refresh } = useDashboardData();
  const [selected, setSelected] = useState([]);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearReason, setClearReason] = useState('');
  const [clearLoading, setClearLoading] = useState(false);

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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
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
                        <TableCell />
                        <TableCell>{t('dashboard.type')}</TableCell>
                        <TableCell>{t('dashboard.metric')}</TableCell>
                        <TableCell>{t('dashboard.dataset')}</TableCell>
                        <TableCell align="right">Top-K</TableCell>
                        <TableCell align="right">{t('search.distance')} / ms</TableCell>
                        <TableCell align="center">{t('dashboard.actions')}</TableCell>
                      </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary' }}>
                          {t('dashboard.noRecentSearches')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((item) => {
                        const index = indices.find((entry) => entry.id === item.index_id);
                        const dataset = datasets.find((entry) => entry.id === index?.dataset_id);
                        return (
                          <TableRow key={item.id}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                size="small"
                                checked={selected.includes(item.id)}
                                onChange={() => {
                                  setSelected((prev) => {
                                    if (prev.includes(item.id)) return prev.filter((i) => i !== item.id);
                                    return [...prev, item.id];
                                  });
                                }}
                              />
                            </TableCell>
                            <TableCell>{item.type}</TableCell>
                            <TableCell>{index?.metric?.toUpperCase() || '-'}</TableCell>
                            <TableCell>{dataset?.name || '-'}</TableCell>
                            <TableCell align="right">{item.k}</TableCell>
                            <TableCell align="right">{item.query_time_ms}</TableCell>
                            <TableCell align="center">
                              <IconButton size="small" color="error" onClick={async () => {
                                if (!window.confirm('Delete this history entry?')) return;
                                try {
                                  await deleteHistory({ ids: [item.id] });
                                  refresh();
                                  setSelected((prev) => prev.filter((i) => i !== item.id));
                                } catch (_) {}
                              }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  disabled={selected.length === 0}
                  onClick={async () => {
                    if (!window.confirm(`Delete ${selected.length} selected history entries?`)) return;
                    try {
                      await deleteHistory({ ids: selected });
                      refresh();
                      setSelected([]);
                    } catch (_) {}
                  }}
                >
                  Delete Selected
                </Button>
                <Button variant="text" onClick={() => setClearDialogOpen(true)}>
                  Clear All
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Dialog open={clearDialogOpen} onClose={() => !clearLoading && setClearDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('dashboard.clearHistoryTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {t('dashboard.clearHistoryDescription')}
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label={t('dashboard.clearHistoryReason')}
            placeholder={t('dashboard.clearHistoryReasonPlaceholder')}
            value={clearReason}
            onChange={(e) => setClearReason(e.target.value)}
            helperText={t('dashboard.clearHistoryReasonHelp')}
            disabled={clearLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialogOpen(false)} disabled={clearLoading}>
            {t('dashboard.cancel')}
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={clearLoading || !clearReason.trim()}
            onClick={async () => {
              setClearLoading(true);
              try {
                await deleteHistory({ all: true, reason: clearReason.trim() });
                refresh();
                setSelected([]);
                setClearReason('');
                setClearDialogOpen(false);
              } catch (_) {}
              setClearLoading(false);
            }}
          >
            {t('dashboard.confirmClearHistory')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
