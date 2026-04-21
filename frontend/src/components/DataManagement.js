import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  LinearProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import TuneIcon from '@mui/icons-material/Tune';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { uploadDataset, deleteDataset, preprocessDataset, generateDemo } from '../api/client';

export default function DataManagement({ datasets, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preprocessDialog, setPreprocessDialog] = useState({ open: false, datasetId: null });
  const [preprocessMethod, setPreprocessMethod] = useState('normalize');
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      setError('');
      setSuccess('');
      setUploading(true);
      setUploadProgress(0);
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await uploadDataset(formData, (evt) => {
          if (evt.total) setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        });
        setSuccess(
          `Uploaded "${file.name}": ${res.data.cell_count} cells × ${res.data.feature_count} features`
        );
        onRefresh();
      } catch (err) {
        setError(err.response?.data?.error || 'Upload failed');
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [onRefresh]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleInputChange = (e) => handleFile(e.target.files[0]);

  const handleDelete = async (id) => {
    try {
      await deleteDataset(id);
      setSuccess('Dataset deleted.');
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  };

  const handlePreprocess = async () => {
    try {
      await preprocessDataset(preprocessDialog.datasetId, preprocessMethod);
      setSuccess(`Dataset preprocessed (${preprocessMethod}).`);
      setPreprocessDialog({ open: false, datasetId: null });
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Preprocessing failed');
    }
  };

  const handleGenerateDemo = async () => {
    setError('');
    setSuccess('');
    try {
      const res = await generateDemo();
      setSuccess(
        `Demo dataset generated: ${res.data.cell_count} cells × ${res.data.feature_count} features`
      );
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate demo data');
    }
  };

  const statusColor = (status) => {
    if (status === 'ready') return 'success';
    if (status?.startsWith('preprocessed')) return 'info';
    return 'default';
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Upload area */}
      <Box
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        sx={{
          border: `2px dashed ${dragging ? '#1976d2' : '#aaa'}`,
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          mb: 2,
          bgcolor: dragging ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
        onClick={() => document.getElementById('file-input').click()}
      >
        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body1" color="text.secondary">
          Drag & drop a file here, or click to select
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Accepted formats: CSV, TSV, H5, H5AD
        </Typography>
        <input
          id="file-input"
          type="file"
          accept=".csv,.tsv,.h5,.h5ad"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />
      </Box>

      {uploading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="caption">{uploadProgress}%</Typography>
        </Box>
      )}

      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<AutoFixHighIcon />}
          onClick={handleGenerateDemo}
          size="small"
        >
          Generate Demo Data (1000 cells × 50 features)
        </Button>
      </Box>

      {/* Dataset table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">Cells</TableCell>
              <TableCell align="right">Features</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {datasets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>
                  No datasets yet. Upload a file or generate demo data.
                </TableCell>
              </TableRow>
            ) : (
              datasets.map((ds) => (
                <TableRow key={ds.id}>
                  <TableCell>{ds.name}</TableCell>
                  <TableCell align="right">{ds.cell_count?.toLocaleString()}</TableCell>
                  <TableCell align="right">{ds.feature_count?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip label={ds.status} color={statusColor(ds.status)} size="small" />
                  </TableCell>
                  <TableCell>{new Date(ds.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Preprocess">
                      <IconButton
                        size="small"
                        onClick={() =>
                          setPreprocessDialog({ open: true, datasetId: ds.id })
                        }
                      >
                        <TuneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(ds.id)}
                      >
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

      {/* Preprocess dialog */}
      <Dialog
        open={preprocessDialog.open}
        onClose={() => setPreprocessDialog({ open: false, datasetId: null })}
      >
        <DialogTitle>Preprocess Dataset</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Method</InputLabel>
            <Select
              value={preprocessMethod}
              label="Method"
              onChange={(e) => setPreprocessMethod(e.target.value)}
            >
              <MenuItem value="normalize">L2 Normalize (per cell)</MenuItem>
              <MenuItem value="standardize">Standardize (zero mean, unit variance)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreprocessDialog({ open: false, datasetId: null })}>
            Cancel
          </Button>
          <Button onClick={handlePreprocess} variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
