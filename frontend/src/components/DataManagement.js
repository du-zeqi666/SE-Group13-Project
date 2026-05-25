import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
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
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import RefreshIcon from '@mui/icons-material/Refresh';
import { uploadDataset, deleteDataset, preprocessDataset, generateDemo, importLocalDataset, listLocalDatasetFiles } from '../api/client';
import { useI18n } from '../App';

export default function DataManagement({ datasets, onRefresh }) {
  const { t, language } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preprocessDialog, setPreprocessDialog] = useState({ open: false, datasetId: null });
  const [preprocessMethod, setPreprocessMethod] = useState('normalize');
  const [dragging, setDragging] = useState(false);
  const [localImport, setLocalImport] = useState({ path: 'liver.h5ad', name: '' });
  const [localFiles, setLocalFiles] = useState([]);

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
        setSuccess(t('data.uploadSuccess', {
          name: file.name,
          cells: res.data.cell_count,
          features: res.data.feature_count,
        }));
        onRefresh();
      } catch (err) {
        setError(err.response?.data?.error || t('data.uploadFailed'));
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
      setSuccess(t('data.datasetDeleted'));
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || t('data.deleteFailed'));
    }
  };

  const handlePreprocess = async () => {
    try {
      await preprocessDataset(preprocessDialog.datasetId, preprocessMethod);
      setSuccess(t('data.preprocessSuccess', { method: preprocessMethod }));
      setPreprocessDialog({ open: false, datasetId: null });
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || t('data.preprocessFailed'));
    }
  };

  const handleGenerateDemo = async () => {
    setError('');
    setSuccess('');
    try {
      const res = await generateDemo();
      setSuccess(t('data.demoSuccess', {
        cells: res.data.cell_count,
        features: res.data.feature_count,
      }));
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || t('data.demoFailed'));
    }
  };

  const loadLocalFiles = useCallback(async () => {
    try {
      const res = await listLocalDatasetFiles();
      const files = res.data.files || [];
      setLocalFiles(files);
      setLocalImport((current) => {
        if (current.path && files.includes(current.path)) {
          return current;
        }
        return { ...current, path: files[0] || '' };
      });
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadLocalFiles();
  }, [loadLocalFiles]);

  const handleImportLocal = async () => {
    setError('');
    setSuccess('');
    if (!localImport.path.trim()) {
      setError(t('data.localImportPathRequired'));
      return;
    }

    try {
      const res = await importLocalDataset({
        path: localImport.path.trim(),
        name: localImport.name.trim() || undefined,
      });
      setSuccess(t('data.localImportSuccess', {
        path: res.data.path,
        cells: res.data.cell_count,
        features: res.data.feature_count,
      }));
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || t('data.localImportFailed'));
    }
  };

  const localizeStatus = (status) => {
    if (status === 'ready') return t('data.statusReady');
    if (status?.startsWith('preprocessed')) {
      return `${t('data.statusPreprocessed')} (${status.replace('preprocessed ', '')})`;
    }
    return status;
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
          border: (theme) => `2px dashed ${dragging ? theme.palette.primary.main : theme.palette.divider}`,
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
          {t('data.uploadPrompt')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('data.uploadFormats')}
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
          <Typography variant="caption">{t('data.uploadProgress', { value: uploadProgress })}</Typography>
        </Box>
      )}

      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<AutoFixHighIcon />}
          onClick={handleGenerateDemo}
          size="small"
        >
          {t('data.demoButton')}
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2">
            {t('data.localImportTitle')}
          </Typography>
          <Button size="small" startIcon={<RefreshIcon />} onClick={loadLocalFiles}>
            {t('data.refreshLocalFiles')}
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('data.localImportDescription')}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 2fr auto' }, gap: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>{t('data.localImportPath')}</InputLabel>
            <Select
              value={localImport.path}
              label={t('data.localImportPath')}
              onChange={(e) => setLocalImport((current) => ({ ...current, path: e.target.value }))}
            >
              {localFiles.length === 0 ? (
                <MenuItem disabled value="">
                  {t('data.noLocalFiles')}
                </MenuItem>
              ) : (
                localFiles.map((filePath) => (
                  <MenuItem key={filePath} value={filePath}>
                    {filePath}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
          <TextField
            label={t('data.localImportName')}
            value={localImport.name}
            onChange={(e) => setLocalImport((current) => ({ ...current, name: e.target.value }))}
            size="small"
            placeholder={t('data.localImportNamePlaceholder')}
          />
          <Button variant="contained" startIcon={<FolderOpenIcon />} onClick={handleImportLocal} disabled={!localImport.path}>
            {t('data.localImportButton')}
          </Button>
        </Box>
      </Paper>

      {/* Dataset table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('data.name')}</TableCell>
              <TableCell align="right">{t('dashboard.cells')}</TableCell>
              <TableCell align="right">{t('dashboard.features')}</TableCell>
              <TableCell>{t('data.status')}</TableCell>
              <TableCell>{t('data.created')}</TableCell>
              <TableCell align="center">{t('dashboard.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {datasets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>
                  {t('data.noDatasets')}
                </TableCell>
              </TableRow>
            ) : (
              datasets.map((ds) => (
                <TableRow key={ds.id}>
                  <TableCell>{ds.name}</TableCell>
                  <TableCell align="right">{ds.cell_count?.toLocaleString()}</TableCell>
                  <TableCell align="right">{ds.feature_count?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip label={localizeStatus(ds.status)} color={statusColor(ds.status)} size="small" />
                  </TableCell>
                  <TableCell>{new Date(ds.created_at).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}</TableCell>
                  <TableCell align="center">
                    <Tooltip title={t('data.preprocess')}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          setPreprocessDialog({ open: true, datasetId: ds.id })
                        }
                      >
                        <TuneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('dashboard.delete')}>
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
        <DialogTitle>{t('data.preprocessTitle')}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>{t('data.method')}</InputLabel>
            <Select
              value={preprocessMethod}
              label={t('data.method')}
              onChange={(e) => setPreprocessMethod(e.target.value)}
            >
              <MenuItem value="normalize">{t('data.normalize')}</MenuItem>
              <MenuItem value="standardize">{t('data.standardize')}</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreprocessDialog({ open: false, datasetId: null })}>
            {t('data.cancel')}
          </Button>
          <Button onClick={handlePreprocess} variant="contained">
            {t('data.apply')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
