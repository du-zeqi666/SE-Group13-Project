import React, { useEffect, useState } from 'react';
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
import { searchByVector, searchById, getIndex } from '../api/client';
import { useI18n } from '../App';

export default function SearchPanel({ indices, onResults }) {
  const { t, language } = useI18n();
  const [indexId, setIndexId] = useState('');
  const [mode, setMode] = useState('vector');
  const [vectorText, setVectorText] = useState('');
  const [cellId, setCellId] = useState('');
  const [k, setK] = useState(10);
  const [metric, setMetric] = useState('l2');
  const [indexDetails, setIndexDetails] = useState(null);
  const [loadingIndexDetails, setLoadingIndexDetails] = useState(false);
  const [filters, setFilters] = useState({
    cell_type: '',
    disease: '',
    AgeGroup: '',
    donor_id: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedIndex = indices.find((i) => i.id === indexId);
  const filterOptions = indexDetails?.filter_options || {};

  const renderFilterValue = (value) => {
    if (value) {
      return value;
    }
    return <span style={{ opacity: 0.65 }}>{t('search.allOption')}</span>;
  };

  const activeFilters = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value.trim())
  );

  useEffect(() => {
    if (selectedIndex?.metric) {
      setMetric(selectedIndex.metric);
    }
  }, [selectedIndex?.metric]);

  useEffect(() => {
    let cancelled = false;

    const loadIndexDetails = async () => {
      if (!indexId) {
        setIndexDetails(null);
        return;
      }

      setLoadingIndexDetails(true);
      try {
        const res = await getIndex(indexId);
        if (!cancelled) {
          setIndexDetails(res.data);
          setFilters({
            cell_type: '',
            disease: '',
            AgeGroup: '',
            donor_id: '',
          });
        }
      } catch (_) {
        if (!cancelled) {
          setIndexDetails(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingIndexDetails(false);
        }
      }
    };

    loadIndexDetails();

    return () => {
      cancelled = true;
    };
  }, [indexId]);

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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {t('search.featuresBuilt', {
              features: selectedIndex.n_features,
              date: new Date(selectedIndex.created_at).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US'),
            })}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('search.vectorDimension', { dimension: indexDetails?.vector_dimension || selectedIndex.n_features })}
          </Typography>
        </Box>
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
        <Select
          value={metric}
          label={t('search.distanceMetric')}
          onChange={(e) => setMetric(e.target.value)}
          disabled={Boolean(selectedIndex)}
        >
          <MenuItem value="l2">L2 (Euclidean)</MenuItem>
          <MenuItem value="cosine">Cosine</MenuItem>
          <MenuItem value="ip">Inner Product</MenuItem>
        </Select>
      </FormControl>
      {selectedIndex && (
        <Typography variant="caption" color="text.secondary">
          {t('search.metricLocked', { metric: selectedIndex.metric?.toUpperCase() })}
        </Typography>
      )}

      {loadingIndexDetails && (
        <Typography variant="caption" color="text.secondary">
          {t('search.loadingFilterOptions')}
        </Typography>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
        <Typography variant="subtitle2" sx={{ gridColumn: '1 / -1' }}>
          {t('search.conditionFilters')}
        </Typography>
        {[
          { key: 'cell_type', label: t('search.cellType') },
          { key: 'disease', label: t('search.disease') },
          { key: 'AgeGroup', label: t('search.ageGroup') },
          { key: 'donor_id', label: t('search.donorId') },
        ].map(({ key, label }) => {
          const labelId = `filter-${key}-label`;
          const selectId = `filter-${key}`;
          return (
            <FormControl key={key} size="small" fullWidth variant="outlined">
              <InputLabel id={labelId} shrink>
                {label}
              </InputLabel>
              <Select
                id={selectId}
                labelId={labelId}
                value={filters[key]}
                label={label}
                onChange={(e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }))}
                displayEmpty
                renderValue={(selected) => renderFilterValue(selected)}
              >
                <MenuItem value="">{t('search.allOption')}</MenuItem>
                {(filterOptions[key] || []).length === 0 ? (
                  <MenuItem value="" disabled>
                    {t('search.noFilterOptions')}
                  </MenuItem>
                ) : (
                  filterOptions[key].map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          );
        })}
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
