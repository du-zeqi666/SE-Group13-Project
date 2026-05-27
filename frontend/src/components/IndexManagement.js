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
  Tooltip,
  Typography,
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import DeleteIcon from '@mui/icons-material/Delete';
import { buildIndex, deleteIndex } from '../api/client';
import { useI18n } from '../App';
import GlassCard from './GlassCard';
import GlowButton from './GlowButton';

const indexTypeLabel = {
  faiss_flat: 'FAISS Flat',
  faiss_ivf: 'FAISS IVF',
  annoy: 'Annoy',
};

export default function IndexManagement({ datasets, indices, onRefresh }) {
  const { t } = useI18n();
  const [buildForm, setBuildForm] = useState({
    dataset_id: '',
    index_type: 'faiss_flat',
    metric: 'l2',
    n_trees: 10,
  });
  const [buildLoading, setBuildLoading] = useState(false);
  const [buildError, setBuildError] = useState('');
  const [buildSuccess, setBuildSuccess] = useState('');

  const handleBuild = async () => {
    setBuildError('');
    setBuildSuccess('');
    if (!buildForm.dataset_id) {
      setBuildError(t('dashboard.selectDataset'));
      return;
    }
    setBuildLoading(true);
    try {
      await buildIndex(buildForm);
      setBuildSuccess(t('dashboard.buildSuccess'));
      onRefresh();
    } catch (err) {
      setBuildError(err.response?.data?.error || t('dashboard.buildFailed'));
    } finally {
      setBuildLoading(false);
    }
  };

  const handleDeleteIndex = async (id) => {
    try {
      await deleteIndex(id);
      onRefresh();
    } catch (_) {}
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <GlassCard>
        <Typography variant="h6" gutterBottom>
          {t('dashboard.buildIndex')}
        </Typography>
        {buildError && <Alert severity="error" sx={{ mb: 2 }}>{buildError}</Alert>}
        {buildSuccess && <Alert severity="success" sx={{ mb: 2 }}>{buildSuccess}</Alert>}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>{t('dashboard.dataset')}</InputLabel>
            <Select
              value={buildForm.dataset_id}
              label={t('dashboard.dataset')}
              onChange={(e) => setBuildForm({ ...buildForm, dataset_id: e.target.value })}
            >
              {datasets.map((dataset) => (
                <MenuItem key={dataset.id} value={dataset.id}>
                  {dataset.name} ({dataset.cell_count?.toLocaleString()} × {dataset.feature_count})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>{t('dashboard.indexType')}</InputLabel>
            <Select
              value={buildForm.index_type}
              label={t('dashboard.indexType')}
              onChange={(e) => setBuildForm({ ...buildForm, index_type: e.target.value })}
            >
              <MenuItem value="faiss_flat">FAISS Flat</MenuItem>
              <MenuItem value="faiss_ivf">FAISS IVF</MenuItem>
              <MenuItem value="annoy">Annoy</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>{t('dashboard.metric')}</InputLabel>
            <Select
              value={buildForm.metric}
              label={t('dashboard.metric')}
              onChange={(e) => setBuildForm({ ...buildForm, metric: e.target.value })}
            >
              <MenuItem value="l2">L2 (Euclidean)</MenuItem>
              <MenuItem value="cosine">Cosine</MenuItem>
              <MenuItem value="ip">Inner Product</MenuItem>
            </Select>
          </FormControl>

          <GlowButton
            startIcon={buildLoading ? <CircularProgress size={18} color="inherit" /> : <BuildIcon />}
            onClick={handleBuild}
            disabled={buildLoading}
            fullWidth
          >
            {buildLoading ? t('dashboard.building') : t('dashboard.build')}
          </GlowButton>
        </Box>
      </GlassCard>

      <GlassCard>
        <Typography variant="h6" gutterBottom>
          {t('dashboard.availableIndices')}
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('dashboard.type')}</TableCell>
                <TableCell>{t('dashboard.metric')}</TableCell>
                <TableCell align="right">{t('dashboard.cells')}</TableCell>
                <TableCell align="right">{t('dashboard.features')}</TableCell>
                <TableCell align="right">{t('dashboard.buildSeconds')}</TableCell>
                <TableCell align="center">{t('dashboard.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {indices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>
                    {t('dashboard.noIndices')}
                  </TableCell>
                </TableRow>
              ) : (
                indices.map((index) => (
                  <TableRow key={index.id}>
                    <TableCell>
                      <Chip
                        label={indexTypeLabel[index.index_type] || index.index_type}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{index.metric?.toUpperCase()}</TableCell>
                    <TableCell align="right">{index.n_cells?.toLocaleString()}</TableCell>
                    <TableCell align="right">{index.n_features}</TableCell>
                    <TableCell align="right">{index.build_time}</TableCell>
                    <TableCell align="center">
                      <Tooltip title={t('dashboard.delete')}>
                        <IconButton size="small" color="error" onClick={() => handleDeleteIndex(index.id)}>
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