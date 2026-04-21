import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function ResultsDisplay({ results }) {
  if (!results) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 300 }}>
        <Typography color="text.secondary">
          Run a search to see results here.
        </Typography>
      </Box>
    );
  }

  const { results: rows, query_time_ms, k, metric, query_cell } = results;

  const handleExport = () => {
    const header = 'Rank,Cell ID,Cell Name,Distance\n';
    const csv =
      header +
      rows.map((r) => `${r.rank},${r.cell_id},${r.cell_name},${r.distance}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ann_search_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = rows.slice(0, 20).map((r) => ({
    name: r.cell_name.length > 10 ? r.cell_name.slice(0, 10) + '…' : r.cell_name,
    distance: parseFloat(r.distance.toFixed(4)),
  }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Results</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip label={`k=${k}`} size="small" />
          <Chip label={metric?.toUpperCase()} size="small" color="primary" />
          <Chip label={`${query_time_ms} ms`} size="small" color="success" />
          {query_cell && <Chip label={`Query: ${query_cell}`} size="small" color="info" />}
          <Button size="small" startIcon={<DownloadIcon />} onClick={handleExport} variant="outlined">
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* Distance bar chart */}
      {rows.length > 0 && (
        <Box sx={{ height: 200, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Distance Distribution (top {Math.min(20, rows.length)})
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="distance" fill="#1976d2" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Cell ID</TableCell>
              <TableCell>Cell Name</TableCell>
              <TableCell align="right">Distance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.rank}>
                  <TableCell>{r.rank}</TableCell>
                  <TableCell>{r.cell_id}</TableCell>
                  <TableCell>{r.cell_name}</TableCell>
                  <TableCell align="right">{r.distance.toFixed(6)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
