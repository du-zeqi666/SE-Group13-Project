import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  TextField,
  Typography,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { listJointIndices, ragSearch } from '../api/client';
import { useI18n } from '../App';
import GlowButton from './GlowButton';

export default function AISearchPanel({ onResults }) {
  const { t } = useI18n();
  const [jointIndices, setJointIndices] = useState([]);
  const [jointIndexId, setJointIndexId] = useState('');
  const [query, setQuery] = useState('');
  const [k, setK] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listJointIndices()
      .then((res) => setJointIndices(res.data))
      .catch(() => {});
  }, []);

  const handleSearch = async () => {
    setError('');
    if (!jointIndexId) {
      setError(t('rag.jointIndexRequired'));
      return;
    }
    if (!query.trim()) {
      setError(t('rag.queryRequired'));
      return;
    }
    setLoading(true);
    try {
      const res = await ragSearch({ query: query.trim(), joint_index_id: jointIndexId, k });
      onResults(res.data);
    } catch (err) {
      setError(err.response?.data?.error || t('rag.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">{t('rag.title')}</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <FormControl fullWidth size="small">
        <InputLabel>{t('rag.selectIndex')}</InputLabel>
        <Select
          value={jointIndexId}
          label={t('rag.selectIndex')}
          onChange={(e) => setJointIndexId(e.target.value)}
        >
          {jointIndices.length === 0 ? (
            <MenuItem disabled>{t('rag.noJointIndices')}</MenuItem>
          ) : (
            jointIndices.map((idx) => (
              <MenuItem key={idx.id} value={idx.id}>
                {idx.name} ({idx.n_cells?.toLocaleString()} cells)
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      <TextField
        label={t('rag.queryLabel')}
        placeholder={t('rag.queryPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        multiline
        rows={4}
        fullWidth
        size="small"
      />

      <Box>
        <Typography variant="body2" gutterBottom>
          {t('search.kValue')}: {k}
        </Typography>
        <Slider
          value={k}
          onChange={(_, v) => setK(v)}
          min={1}
          max={50}
          step={1}
          valueLabelDisplay="auto"
          size="small"
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label={t('rag.localModel')}
          size="small"
          variant="outlined"
          color="info"
        />
      </Box>

      <GlowButton
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
        onClick={handleSearch}
        disabled={loading}
        fullWidth
      >
        {loading ? t('rag.searching') : t('rag.search')}
      </GlowButton>
    </Box>
  );
}
