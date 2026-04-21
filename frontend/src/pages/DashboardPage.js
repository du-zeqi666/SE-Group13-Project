import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import DeleteIcon from '@mui/icons-material/Delete';
import StorageIcon from '@mui/icons-material/Storage';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import HistoryIcon from '@mui/icons-material/History';
import Navbar from '../components/Navbar';
import DataManagement from '../components/DataManagement';
import { listDatasets, listIndices, buildIndex, deleteIndex, getHistory } from '../api/client';
import { useAuth } from '../App';

export default function DashboardPage() {
  const { user } = useAuth();
  const [datasets, setDatasets] = useState([]);
  const [indices, setIndices] = useState([]);
  const [history, setHistory] = useState([]);
  const [buildForm, setBuildForm] = useState({
    dataset_id: '',
    index_type: 'faiss_flat',
    metric: 'l2',
    n_trees: 10,
  });
  const [buildLoading, setBuildLoading] = useState(false);
  const [buildError, setBuildError] = useState('');
  const [buildSuccess, setBuildSuccess] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [dsRes, idxRes, histRes] = await Promise.all([
        listDatasets(),
        listIndices(),
        getHistory(),
      ]);
      setDatasets(dsRes.data);
      setIndices(idxRes.data);
      setHistory(histRes.data);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleBuild = async () => {
    setBuildError('');
    setBuildSuccess('');
    if (!buildForm.dataset_id) {
      setBuildError('Please select a dataset.');
      return;
    }
    setBuildLoading(true);
    try {
      await buildIndex(buildForm);
      setBuildSuccess('Index built successfully!');
      fetchAll();
    } catch (err) {
      setBuildError(err.response?.data?.error || 'Failed to build index');
    } finally {
      setBuildLoading(false);
    }
  };

  const handleDeleteIndex = async (id) => {
    try {
      await deleteIndex(id);
      fetchAll();
    } catch (_) {}
  };

  const indexTypeLabel = { faiss_flat: 'FAISS Flat', faiss_ivf: 'FAISS IVF', annoy: 'Annoy' };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Navbar />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {user?.username}
        </Typography>

        {/* Stats cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <StorageIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{datasets.length}</Typography>
                  <Typography color="text.secondary">Datasets</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccountTreeIcon color="secondary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{indices.length}</Typography>
                  <Typography color="text.secondary">Indices</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <HistoryIcon color="action" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{history.length}</Typography>
                  <Typography color="text.secondary">Recent Searches</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Data Management */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Data Management
              </Typography>
              <DataManagement datasets={datasets} onRefresh={fetchAll} />
            </Paper>
          </Grid>

          {/* Build Index */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Build ANN Index
              </Typography>
              {buildError && <Alert severity="error" sx={{ mb: 2 }}>{buildError}</Alert>}
              {buildSuccess && <Alert severity="success" sx={{ mb: 2 }}>{buildSuccess}</Alert>}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Dataset</InputLabel>
                  <Select
                    value={buildForm.dataset_id}
                    label="Dataset"
                    onChange={(e) => setBuildForm({ ...buildForm, dataset_id: e.target.value })}
                  >
                    {datasets.map((ds) => (
                      <MenuItem key={ds.id} value={ds.id}>
                        {ds.name} ({ds.cell_count?.toLocaleString()} × {ds.feature_count})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box>
                  <Typography variant="body2" gutterBottom>
                    Index Type
                  </Typography>
                  <ToggleButtonGroup
                    value={buildForm.index_type}
                    exclusive
                    size="small"
                    onChange={(_, v) => v && setBuildForm({ ...buildForm, index_type: v })}
                    fullWidth
                  >
                    <ToggleButton value="faiss_flat">FAISS Flat</ToggleButton>
                    <ToggleButton value="faiss_ivf">FAISS IVF</ToggleButton>
                    <ToggleButton value="annoy">Annoy</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <FormControl fullWidth size="small">
                  <InputLabel>Metric</InputLabel>
                  <Select
                    value={buildForm.metric}
                    label="Metric"
                    onChange={(e) => setBuildForm({ ...buildForm, metric: e.target.value })}
                  >
                    <MenuItem value="l2">L2 (Euclidean)</MenuItem>
                    <MenuItem value="cosine">Cosine</MenuItem>
                    <MenuItem value="ip">Inner Product</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  startIcon={buildLoading ? <CircularProgress size={18} color="inherit" /> : <BuildIcon />}
                  onClick={handleBuild}
                  disabled={buildLoading}
                  fullWidth
                >
                  {buildLoading ? 'Building…' : 'Build Index'}
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Index list */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Available Indices
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Metric</TableCell>
                      <TableCell align="right">Cells</TableCell>
                      <TableCell align="right">Features</TableCell>
                      <TableCell align="right">Build (s)</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {indices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>
                          No indices yet. Build one above.
                        </TableCell>
                      </TableRow>
                    ) : (
                      indices.map((idx) => (
                        <TableRow key={idx.id}>
                          <TableCell>
                            <Chip
                              label={indexTypeLabel[idx.index_type] || idx.index_type}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{idx.metric?.toUpperCase()}</TableCell>
                          <TableCell align="right">{idx.n_cells?.toLocaleString()}</TableCell>
                          <TableCell align="right">{idx.n_features}</TableCell>
                          <TableCell align="right">{idx.build_time}</TableCell>
                          <TableCell align="center">
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteIndex(idx.id)}
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
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
