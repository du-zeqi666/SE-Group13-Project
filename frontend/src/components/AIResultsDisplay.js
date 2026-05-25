import React from 'react';
import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useI18n } from '../App';

function StatBox({ label, value }) {
  return (
    <Box sx={{ textAlign: 'center', px: 2 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h6">{value}</Typography>
    </Box>
  );
}

function DistributionList({ data, emptyText }) {
  if (!data || Object.keys(data).length === 0) {
    return <Typography variant="body2" color="text.secondary">{emptyText}</Typography>;
  }
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {Object.entries(data).map(([key, count]) => (
        <Chip key={key} label={`${key}: ${count}`} size="small" variant="outlined" />
      ))}
    </Box>
  );
}

export default function AIResultsDisplay({ results }) {
  const { t } = useI18n();

  if (!results) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <Typography color="text.secondary" variant="body1">
          {t('search.runSearchPrompt')}
        </Typography>
      </Box>
    );
  }

  const { results: rows, analysis, query_time_ms, k, parsed_query } = results;

  if (!rows || rows.length === 0) {
    return (
      <Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip label={`K = ${k}`} size="small" color="primary" />
          <Chip label={`${query_time_ms} ms`} size="small" variant="outlined" />
        </Box>
        <Typography color="text.secondary">{analysis?.summary || t('search.noResults')}</Typography>
      </Box>
    );
  }

  const metadataColumns = [];
  const sample = rows[0] || {};
  if (sample.cell_type || rows.some((r) => r.cell_type)) metadataColumns.push('cell_type');
  if (sample.disease || rows.some((r) => r.disease)) metadataColumns.push('disease');
  if (sample.AgeGroup || rows.some((r) => r.AgeGroup)) metadataColumns.push('AgeGroup');
  if (sample.donor_id || rows.some((r) => r.donor_id)) metadataColumns.push('donor_id');
  metadataColumns.push('dataset_source');

  const exportCsv = () => {
    const headers = ['Rank', 'Cell ID', 'Cell Name', ...metadataColumns.map((c) => c === 'cell_type' ? 'Cell Type' : c === 'AgeGroup' ? 'Age Group' : c === 'donor_id' ? 'Donor ID' : c === 'dataset_source' ? 'Dataset' : c), 'Distance'];
    const body = rows.map((r) =>
      [
        r.rank,
        r.cell_id,
        `"${(r.cell_name || '')}"`,
        ...metadataColumns.map((c) => `"${r[c] || ''}"`),
        r.distance,
      ].join(',')
    );
    const csv = '﻿' + headers.join(',') + '\n' + body.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ann_ai_search_results.csv';
    link.click();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip label={`K = ${k}`} size="small" color="primary" />
        <Chip label={`${query_time_ms} ms`} size="small" variant="outlined" />
        {parsed_query?.embedding_source && (
          <Chip label={parsed_query.embedding_source === 'llm' ? t('rag.llmModel') : t('rag.localModel')} size="small" color="info" variant="outlined" />
        )}
        {parsed_query?.filters && Object.keys(parsed_query.filters).length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">{t('rag.parsedQuery')}:</Typography>
            {Object.entries(parsed_query.filters).map(([k, v]) => (
              <Chip key={k} label={`${k}: ${v}`} size="small" />
            ))}
          </Box>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" startIcon={<DownloadIcon />} onClick={exportCsv}>
          {t('search.exportCsv')}
        </Button>
      </Box>

      {analysis && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {t('rag.analysisSection')}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {analysis.summary}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">{t('rag.cellTypeDistribution')}</Typography>
              <DistributionList data={analysis.cell_type_distribution} emptyText="-" />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">{t('rag.diseaseDistribution')}</Typography>
              <DistributionList data={analysis.disease_distribution} emptyText="-" />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
            <StatBox label={t('rag.minDistance')} value={analysis.distance_stats?.min?.toFixed(4) || '-'} />
            <StatBox label={t('rag.maxDistance')} value={analysis.distance_stats?.max?.toFixed(4) || '-'} />
            <StatBox label={t('rag.meanDistance')} value={analysis.distance_stats?.mean?.toFixed(4) || '-'} />
          </Box>
          {analysis.interpretation && (
            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
              {analysis.interpretation}
            </Typography>
          )}
        </Paper>
      )}

      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('search.rank')}</TableCell>
                <TableCell>{t('search.cellIdHeader')}</TableCell>
                <TableCell>{t('search.cellName')}</TableCell>
                {metadataColumns.map((col) => (
                  <TableCell key={col}>
                    {col === 'cell_type' ? t('search.cellType') :
                     col === 'disease' ? t('search.disease') :
                     col === 'AgeGroup' ? t('search.ageGroup') :
                     col === 'donor_id' ? t('search.donorId') :
                     col === 'dataset_source' ? t('rag.datasetSource') : col}
                  </TableCell>
                ))}
                <TableCell align="right">{t('search.distance')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.cell_id}>
                  <TableCell>{row.rank}</TableCell>
                  <TableCell>{row.cell_id}</TableCell>
                  <TableCell>{row.cell_name || '-'}</TableCell>
                  {metadataColumns.map((col) => (
                    <TableCell key={col}>{row[col] || '-'}</TableCell>
                  ))}
                  <TableCell align="right">{row.distance?.toFixed(4)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
