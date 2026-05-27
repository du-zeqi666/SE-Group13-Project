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
  Collapse,
  Skeleton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import TuneIcon from '@mui/icons-material/Tune';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import RefreshIcon from '@mui/icons-material/Refresh';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { uploadDataset, deleteDataset, preprocessDataset, generateDemo, importLocalDataset, listLocalDatasetFiles, getDatasetScatter } from '../api/client';
import CellScatterPlot from './CellScatterPlot';
import { useI18n } from '../App';
import GlassCard from './GlassCard';
import GlowButton from './GlowButton';

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
  const [scatterState, setScatterState] = useState({});

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

  const loadScatter = async (dataset, forceReload = false) => {
    const current = scatterState[dataset.id];
    if (!forceReload && current?.data) {
      setScatterState((currentState) => ({
        ...currentState,
        [dataset.id]: {
          ...currentState[dataset.id],
          open: true,
          error: '',
        },
      }));
      return;
    }

    setScatterState((currentState) => ({
      ...currentState,
      [dataset.id]: {
        ...currentState[dataset.id],
        open: true,
        loading: true,
        error: '',
      },
    }));

    try {
      // default to UMAP for visualization (server-side precompute + cache)
      const res = await getDatasetScatter(dataset.id, { method: 'umap' });
      setScatterState((currentState) => ({
        ...currentState,
        [dataset.id]: {
          open: true,
          loading: false,
          error: '',
          data: res.data,
          colorBy: null,
        },
      }));
    } catch (err) {
      setScatterState((currentState) => ({
        ...currentState,
        [dataset.id]: {
          open: true,
          loading: false,
          error: err.response?.data?.detail
            ? `${err.response?.data?.error || t('data.scatterFailed')}: ${err.response.data.detail}`
            : (err.response?.data?.error || t('data.scatterFailed')),
          data: null,
          colorBy: null,
        },
      }));
    }
  };

  const toggleScatter = (dataset) => {
    const current = scatterState[dataset.id];
    if (current?.open) {
      setScatterState((currentState) => ({
        ...currentState,
        [dataset.id]: {
          ...currentState[dataset.id],
          open: false,
          error: '',
        },
      }));
      return;
    }

    loadScatter(dataset, false);
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
    if (status?.startsWith('ready')) {
      if (status.includes('local import')) return t('data.statusReadyLocalImport');
      return t('data.statusReady');
    }
    if (status?.startsWith('preprocessed')) {
      return `${t('data.statusPreprocessed')} (${status.replace('preprocessed ', '')})`;
    }
    return status;
  };

  const statusColor = (status) => {
    if (status?.startsWith('ready')) return 'success';
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

      <GlassCard noHover noAccent sx={{ p: 2, mb: 2 }}>
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
          <GlowButton startIcon={<FolderOpenIcon />} onClick={handleImportLocal} disabled={!localImport.path}>
            {t('data.localImportButton')}
          </GlowButton>
        </Box>
      </GlassCard>

      {/* Dataset table */}
      <TableContainer component={GlassCard} noHover noAccent sx={{ p: 0 }}>
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
              datasets.map((ds) => {
                const scatter = scatterState[ds.id] || {};
                return (
                  <React.Fragment key={ds.id}>
                    <TableRow>
                      <TableCell>{ds.name}</TableCell>
                      <TableCell align="right">{ds.cell_count?.toLocaleString()}</TableCell>
                      <TableCell align="right">{ds.feature_count?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={localizeStatus(ds.status)}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: (t) => {
                              const c = statusColor(ds.status);
                              if (c === 'success') return t.palette.success.main;
                              if (c === 'info') return t.palette.info.main;
                              return t.palette.divider;
                            },
                            color: (t) => {
                              const c = statusColor(ds.status);
                              if (c === 'success') return t.palette.success.main;
                              if (c === 'info') return t.palette.info.main;
                              return t.palette.text.secondary;
                            },
                            bgcolor: 'transparent',
                          }}
                        />
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
                        <Tooltip title={t('data.scatterPlot')}>
                          <IconButton
                            size="small"
                            onClick={() => toggleScatter(ds)}
                            color={scatter.open ? 'primary' : 'default'}
                          >
                            {scatter.open ? <ExpandLessIcon fontSize="small" /> : <ScatterPlotIcon fontSize="small" />}
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
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 0, borderBottom: scatter.open ? undefined : 'none' }}>
                        <Collapse in={Boolean(scatter.open)} timeout="auto" unmountOnExit>
                          <Box sx={{ py: 2, px: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Box>
                                <Typography variant="subtitle2">{t('data.scatterPlotTitle')}</Typography>
                              </Box>
                              <Button size="small" startIcon={<RefreshIcon />} onClick={() => loadScatter(ds, true)}>
                                {t('data.refreshScatter')}
                              </Button>
                            </Box>

                            {scatter.loading && !scatter.data ? (
                              <Skeleton variant="rectangular" height={360} />
                            ) : scatter.error ? (
                              <Alert severity="error">{scatter.error}</Alert>
                            ) : scatter.data ? (
                              <>
                                <Box sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center' }}>
                                  {(() => {
                                    const defaultField = 'cell_type';
                                    const selectedColorBy = scatter.colorBy || defaultField;
                                    // compute available fields with more than 1 unique value
                                    const points = scatter.data?.points || [];
                                    const candidates = ['cell_type', 'disease', 'AgeGroup'];
                                    const available = candidates.map((f) => {
                                      const vals = new Set();
                                      for (let i = 0; i < points.length; i++) {
                                        const v = points[i] ? points[i][f] : undefined;
                                        if (v !== undefined) vals.add(String(v));
                                        if (vals.size > 1) break;
                                      }
                                      return { field: f, multi: vals.size > 1 };
                                    });

                                    // if current selection is not multi-valued, fallback to default
                                    const effective = available.find((a) => a.field === selectedColorBy && a.multi) ? selectedColorBy : defaultField;

                                    return (
                                      <FormControl size="small">
                                        <InputLabel>{t('data.colorBy') || 'Color by'}</InputLabel>
                                        <Select
                                          value={effective}
                                          label={t('data.colorBy') || 'Color by'}
                                          onChange={(e) => setScatterState((currentState) => ({
                                            ...currentState,
                                            [ds.id]: {
                                              ...(currentState[ds.id] || {}),
                                              colorBy: e.target.value,
                                            },
                                          }))}
                                        >
                                          {available.map((a) => (
                                            a.multi ? (
                                              <MenuItem key={a.field} value={a.field}>{a.field}</MenuItem>
                                            ) : (
                                              <MenuItem key={a.field} value={a.field} disabled>
                                                {a.field} ({t('data.singleValue') || 'single value'})
                                              </MenuItem>
                                            )
                                          ))}
                                        </Select>
                                      </FormControl>
                                    );
                                  })()}
                                </Box>
                                <CellScatterPlot
                                  key={`${ds.id}-${scatter.colorBy || 'cell_type'}`}
                                  visualization={scatter.data}
                                  colorBy={scatter.colorBy || 'cell_type'}
                                />
                              </>
                            ) : null}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })
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
