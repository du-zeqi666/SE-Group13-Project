import React, { useState } from 'react';
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
  Grid,
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
  Stack,
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import HistoryIcon from '@mui/icons-material/History';
import InsightsIcon from '@mui/icons-material/Insights';
import DatasetIcon from '@mui/icons-material/Dataset';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth, useI18n } from '../App';
import useDashboardData from '../hooks/useDashboardData';
import { Link as RouterLink } from 'react-router-dom';
import { deleteHistory } from '../api/client';
import DeleteIcon from '@mui/icons-material/Delete';
import StatCard from '../components/StatCard';
import GlassCard from '../components/GlassCard';
import GlowButton from '../components/GlowButton';

const SectionLabel = ({ children }) => (
  <Typography
    variant="caption"
    sx={{
      fontWeight: 600,
      color: 'text.secondary',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      mb: 1.5,
      display: 'block',
    }}
  >
    {children}
  </Typography>
);

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
      icon: <DatasetIcon sx={{ fontSize: 28 }} />,
      to: '/dashboard/data',
      button: t('dashboard.openDataManagement'),
    },
    {
      title: t('dashboard.overviewCardIndexTitle'),
      description: t('dashboard.overviewCardIndexDescription'),
      icon: <InsightsIcon sx={{ fontSize: 28 }} />,
      to: '/dashboard/index',
      button: t('dashboard.openIndexManagement'),
    },
  ];

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto' }}>
      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
          {t('dashboard.welcome', { username: user?.username || '' })}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('dashboard.overviewSubtitle')}
        </Typography>
      </Box>

      {/* Stats row */}
      <Box sx={{ mb: 4 }}>
        <SectionLabel>{t('dashboard.sectionOverview')}</SectionLabel>
        <Grid container spacing={1.5}>
          <Grid item xs={4}>
            <StatCard
              icon={<StorageIcon />}
              value={datasets.length}
              label={t('dashboard.datasets')}
              color="primary"
            />
          </Grid>
          <Grid item xs={4}>
            <StatCard
              icon={<AccountTreeIcon />}
              value={indices.length}
              label={t('dashboard.indices')}
              color="emerald"
            />
          </Grid>
          <Grid item xs={4}>
            <StatCard
              icon={<HistoryIcon />}
              value={history.length}
              label={t('dashboard.recentSearches')}
              color="blue"
            />
          </Grid>
        </Grid>
      </Box>

      {/* Quick actions */}
      <Box sx={{ mb: 4 }}>
        <SectionLabel>{t('dashboard.sectionQuickActions')}</SectionLabel>
        <Grid container spacing={1.5}>
          {quickActions.map((item) => (
            <Grid item xs={6} key={item.to}>
              <GlassCard sx={{ height: '100%', p: 2 }}>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ color: 'primary.main', lineHeight: 0 }}>{item.icon}</Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {item.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                  <Box>
                    <Button
                      component={RouterLink}
                      to={item.to}
                      size="small"
                      endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                      sx={{ textTransform: 'none', fontWeight: 500, px: 0 }}
                    >
                      {item.button}
                    </Button>
                  </Box>
                </Stack>
              </GlassCard>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* History */}
      <Box>
        <SectionLabel>{t('dashboard.sectionRecentActivity')}</SectionLabel>
        <GlassCard sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>{t('dashboard.type')}</TableCell>
                  <TableCell>{t('dashboard.metric')}</TableCell>
                  <TableCell>{t('dashboard.dataset')}</TableCell>
                  <TableCell align="right">Top-K</TableCell>
                  <TableCell align="right">{t('search.distance')} / ms</TableCell>
                  <TableCell align="center" sx={{ width: 60 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      <HistoryIcon sx={{ fontSize: 32, mb: 1, color: 'text.disabled', display: 'block', mx: 'auto' }} />
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
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {history.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon sx={{ fontSize: 14 }} />}
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
              <Box sx={{ flex: 1 }} />
              <Button size="small" onClick={() => setClearDialogOpen(true)}>
                Clear All
              </Button>
            </Box>
          )}
        </GlassCard>
      </Box>

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
