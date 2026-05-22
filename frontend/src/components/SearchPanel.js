import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Alert,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { searchByVector, searchById } from '../api/client';
import { useI18n } from '../App';

export default function SearchPanel({ indices, onResults }) {
  const { t, language } = useI18n();
  const [indexId, setIndexId] = useState('');
  const [mode, setMode] = useState('vector');
  const [vectorText, setVectorText] = useState('');
  const [cellId, setCellId] = useState('');
  const [k, setK] = useState(10);
  const [metric, setMetric] = useState('l2');
  const [filters, setFilters] = useState({
    cell_type: '',
    disease: '',
    AgeGroup: '',
    donor_id: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const activeFilters = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value.trim())
  );

  const handleSearch = async () => {
    setError('');
    if (!indexId) {
      setError(t('search.selectIndex'));
      return;
    }

    setLoading(true);
    try {
      let res;
      if (mode === 'vector') {
        if (!vectorText.trim()) {
          setError(t('search.enterVector'));
          setLoading(false);
          return;
        }
        const queryVector = vectorText
          .split(',')
          .map((s) => parseFloat(s.trim()))
          .filter((v) => !isNaN(v));
        if (queryVector.length === 0) {
          setError(t('search.invalidVector'));
          setLoading(false);
          return;
        }
        res = await searchByVector({ index_id: indexId, query_vector: queryVector, k, metric, filters: activeFilters });
      } else {
        if (!cellId.trim()) {
          setError(t('search.enterCellId'));
          setLoading(false);
          return;
        }
        res = await searchById({ index_id: indexId, cell_id: cellId.trim(), k, filters: activeFilters });
      }
      onResults(res.data);
    } catch (err) {
      setError(err.response?.data?.error || t('search.failed'));
    } finally {
      setLoading(false);
    }
  };

  const selectedIndex = indices.find((i) => i.id === indexId);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">{t('search.title')}</Typography>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      <FormControl fullWidth size="small">
        <InputLabel>{t('search.index')}</InputLabel>
        <Select value={indexId} label={t('search.index')} onChange={(e) => setIndexId(e.target.value)}>
          {indices.length === 0 && (
            <MenuItem disabled value="">
              {t('search.noIndices')}
            </MenuItem>
          )}
          {indices.map((idx) => (
            <MenuItem key={idx.id} value={idx.id}>
              {idx.index_type} | {idx.metric} | {idx.n_cells?.toLocaleString()} cells
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedIndex && (
        <Typography variant="caption" color="text.secondary">
          {t('search.featuresBuilt', {
            features: selectedIndex.n_features,
            date: new Date(selectedIndex.created_at).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US'),
          })}
        </Typography>
      )}

      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(_, v) => v && setMode(v)}
        size="small"
        fullWidth
      >
        <ToggleButton value="vector">{t('search.byVector')}</ToggleButton>
        <ToggleButton value="cell_id">{t('search.byCellId')}</ToggleButton>
      </ToggleButtonGroup>

      {mode === 'vector' ? (
        <TextField
          label={t('search.queryVector')}
          multiline
          rows={3}
          fullWidth
          size="small"
          value={vectorText}
          onChange={(e) => setVectorText(e.target.value)}
          placeholder={t('search.vectorPlaceholder')}
        />
      ) : (
        <TextField
          label={t('search.cellId')}
          fullWidth
          size="small"
          value={cellId}
          onChange={(e) => setCellId(e.target.value)}
          placeholder={t('search.cellIdPlaceholder')}
        />
      )}

      <Box>
        <Typography gutterBottom variant="body2">
          k = {k}
        </Typography>
        <Slider
          value={k}
          onChange={(_, v) => setK(v)}
          min={1}
          max={100}
          step={1}
          marks={[
            { value: 1, label: '1' },
            { value: 50, label: '50' },
            { value: 100, label: '100' },
          ]}
          size="small"
        />
      </Box>

      <FormControl fullWidth size="small">
        <InputLabel>{t('search.distanceMetric')}</InputLabel>
        <Select value={metric} label={t('search.distanceMetric')} onChange={(e) => setMetric(e.target.value)}>
          <MenuItem value="l2">L2 (Euclidean)</MenuItem>
          <MenuItem value="cosine">Cosine</MenuItem>
          <MenuItem value="ip">Inner Product</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
        <Typography variant="subtitle2" sx={{ gridColumn: '1 / -1' }}>
          {t('search.conditionFilters')}
        </Typography>
        <TextField
          label={t('search.cellType')}
          size="small"
          value={filters.cell_type}
          onChange={(e) => setFilters((prev) => ({ ...prev, cell_type: e.target.value }))}
        />
        <TextField
          label={t('search.disease')}
          size="small"
          value={filters.disease}
          onChange={(e) => setFilters((prev) => ({ ...prev, disease: e.target.value }))}
        />
        <TextField
          label={t('search.ageGroup')}
          size="small"
          value={filters.AgeGroup}
          onChange={(e) => setFilters((prev) => ({ ...prev, AgeGroup: e.target.value }))}
        />
        <TextField
          label={t('search.donorId')}
          size="small"
          value={filters.donor_id}
          onChange={(e) => setFilters((prev) => ({ ...prev, donor_id: e.target.value }))}
        />
      </Box>

      <Button
        variant="contained"
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
        onClick={handleSearch}
        disabled={loading}
        fullWidth
      >
        {loading ? t('search.searching') : t('search.search')}
      </Button>
    </Box>
  );
}
