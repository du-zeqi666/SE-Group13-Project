import React, { useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import DeleteIcon from '@mui/icons-material/Delete';
import { buildJointIndex, deleteJointIndex } from '../api/client';
import { useI18n } from '../App';
import GlassCard from './GlassCard';
import GlowButton from './GlowButton';

export default function JointIndexManagement({ datasets, jointIndices, onRefresh }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: '',
    dataset_ids: [],
    metric: 'cosine',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleBuild = async () => {
    setError('');
    setSuccess('');
    if (!form.name.trim()) {
      setError(t('jointIndex.nameRequired'));
      return;
    }
    if (form.dataset_ids.length < 2) {
      setError(t('jointIndex.minDatasets'));
      return;
    }
    setLoading(true);
    try {
      await buildJointIndex(form);
      setSuccess(t('jointIndex.buildSuccess'));
      setForm({ name: '', dataset_ids: [], metric: 'cosine' });
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || t('jointIndex.buildFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteJointIndex(id);
      onRefresh();
    } catch (_) {}
  };

  const metricLabel = { cosine: 'Cosine', l2: 'L2 (Euclidean)', ip: 'Inner Product' };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <GlassCard>
        <Typography variant="h6" gutterBottom>
          {t('jointIndex.buildTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {t('jointIndex.typeNote')}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label={t('jointIndex.name')}
            placeholder={t('jointIndex.namePlaceholder')}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
            size="small"
          />

          <FormControl fullWidth size="small">
            <InputLabel>{t('jointIndex.selectDatasets')}</InputLabel>
            <Select
              multiple
              value={form.dataset_ids}
              label={t('jointIndex.selectDatasets')}
              onChange={(e) => setForm({ ...form, dataset_ids: e.target.value })}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((id) => {
                    const ds = datasets.find((d) => d.id === id);
                    return <Chip key={id} label={ds?.name || id} size="small" />;
                  })}
                </Box>
              )}
            >
              {datasets.length === 0 ? (
                <MenuItem disabled>{t('jointIndex.noDatasets')}</MenuItem>
              ) : (
                datasets.map((ds) => (
                  <MenuItem key={ds.id} value={ds.id}>
                    {ds.name} ({ds.cell_count?.toLocaleString()} cells, {ds.feature_count} features)
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>{t('jointIndex.metric')}</InputLabel>
            <Select
              value={form.metric}
              label={t('jointIndex.metric')}
              onChange={(e) => setForm({ ...form, metric: e.target.value })}
            >
              <MenuItem value="cosine">Cosine</MenuItem>
              <MenuItem value="l2">L2 (Euclidean)</MenuItem>
              <MenuItem value="ip">Inner Product</MenuItem>
            </Select>
          </FormControl>

          <GlowButton
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <BuildIcon />}
            onClick={handleBuild}
            disabled={loading}
            fullWidth
          >
            {loading ? t('jointIndex.building') : t('jointIndex.build')}
          </GlowButton>
        </Box>
      </GlassCard>

      <GlassCard>
        <Typography variant="h6" gutterBottom>
          {t('jointIndex.available')}
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('jointIndex.name')}</TableCell>
                <TableCell>{t('jointIndex.type')}</TableCell>
                <TableCell>{t('jointIndex.metric')}</TableCell>
                <TableCell align="right">{t('jointIndex.datasets')}</TableCell>
                <TableCell align="right">{t('jointIndex.cells')}</TableCell>
                <TableCell align="right">{t('jointIndex.buildSeconds')}</TableCell>
                <TableCell align="center">{t('jointIndex.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jointIndices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary' }}>
                    {t('jointIndex.noJointIndices')}
                  </TableCell>
                </TableRow>
              ) : (
                jointIndices.map((idx) => (
                  <TableRow key={idx.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">{idx.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label="ChromaDB HNSW" size="small" color="secondary" variant="outlined" />
                    </TableCell>
                    <TableCell>{metricLabel[idx.metric] || idx.metric}</TableCell>
                    <TableCell align="right">{idx.dataset_count}</TableCell>
                    <TableCell align="right">{idx.n_cells?.toLocaleString()}</TableCell>
                    <TableCell align="right">{idx.build_time}</TableCell>
                    <TableCell align="center">
                      <Tooltip title={t('jointIndex.delete')}>
                        <IconButton size="small" color="error" onClick={() => handleDelete(idx.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassCard>
    </Box>
  );
}
