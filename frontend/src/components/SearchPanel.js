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

export default function SearchPanel({ indices, onResults }) {
  const [indexId, setIndexId] = useState('');
  const [mode, setMode] = useState('vector');
  const [vectorText, setVectorText] = useState('');
  const [cellId, setCellId] = useState('');
  const [k, setK] = useState(10);
  const [metric, setMetric] = useState('l2');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setError('');
    if (!indexId) {
      setError('Please select an index.');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (mode === 'vector') {
        if (!vectorText.trim()) {
          setError('Please enter a query vector.');
          setLoading(false);
          return;
        }
        const queryVector = vectorText
          .split(',')
          .map((s) => parseFloat(s.trim()))
          .filter((v) => !isNaN(v));
        if (queryVector.length === 0) {
          setError('Invalid vector format. Enter comma-separated numbers.');
          setLoading(false);
          return;
        }
        res = await searchByVector({ index_id: indexId, query_vector: queryVector, k, metric });
      } else {
        if (!cellId.trim()) {
          setError('Please enter a cell ID.');
          setLoading(false);
          return;
        }
        res = await searchById({ index_id: indexId, cell_id: cellId.trim(), k });
      }
      onResults(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const selectedIndex = indices.find((i) => i.id === indexId);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">Search</Typography>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      <FormControl fullWidth size="small">
        <InputLabel>Index</InputLabel>
        <Select value={indexId} label="Index" onChange={(e) => setIndexId(e.target.value)}>
          {indices.length === 0 && (
            <MenuItem disabled value="">
              No indices available
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
          Features: {selectedIndex.n_features} | Built: {new Date(selectedIndex.created_at).toLocaleString()}
        </Typography>
      )}

      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(_, v) => v && setMode(v)}
        size="small"
        fullWidth
      >
        <ToggleButton value="vector">By Vector</ToggleButton>
        <ToggleButton value="cell_id">By Cell ID</ToggleButton>
      </ToggleButtonGroup>

      {mode === 'vector' ? (
        <TextField
          label="Query Vector (comma-separated floats)"
          multiline
          rows={3}
          fullWidth
          size="small"
          value={vectorText}
          onChange={(e) => setVectorText(e.target.value)}
          placeholder="0.1, 0.5, -0.3, ..."
        />
      ) : (
        <TextField
          label="Cell ID or Name"
          fullWidth
          size="small"
          value={cellId}
          onChange={(e) => setCellId(e.target.value)}
          placeholder="e.g. cell_42 or 42"
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
        <InputLabel>Distance Metric</InputLabel>
        <Select value={metric} label="Distance Metric" onChange={(e) => setMetric(e.target.value)}>
          <MenuItem value="l2">L2 (Euclidean)</MenuItem>
          <MenuItem value="cosine">Cosine</MenuItem>
          <MenuItem value="ip">Inner Product</MenuItem>
        </Select>
      </FormControl>

      <Button
        variant="contained"
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
        onClick={handleSearch}
        disabled={loading}
        fullWidth
      >
        {loading ? 'Searching…' : 'Search'}
      </Button>
    </Box>
  );
}
