import React from 'react';
import {
  Box,
  Chip,
  Paper,
  Typography,
} from '@mui/material';
import {
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  Cell,
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import { useI18n } from '../App';

const CLUSTER_COLORS = [
  '#1976d2',
  '#2e7d32',
  '#ed6c02',
  '#9c27b0',
  '#d32f2f',
  '#0288d1',
  '#6d4c41',
  '#7b1fa2',
];

function ClusterTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0].payload || {};
  return (
    <Paper variant="outlined" sx={{ p: 1.25, boxShadow: 3 }}>
      <Typography variant="subtitle2">{point.cell_name || point.cell_id || '-'}</Typography>
      <Typography variant="body2" color="text.secondary">
        {`x: ${Number(point.x).toFixed(3)} | y: ${Number(point.y).toFixed(3)}`}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {`cluster: ${point.cluster ?? '-'}`}
      </Typography>
      {point.cell_type && (
        <Typography variant="body2" color="text.secondary">{`cell_type: ${point.cell_type}`}</Typography>
      )}
      {point.disease && (
        <Typography variant="body2" color="text.secondary">{`disease: ${point.disease}`}</Typography>
      )}
      {point.AgeGroup && (
        <Typography variant="body2" color="text.secondary">{`AgeGroup: ${point.AgeGroup}`}</Typography>
      )}
      {point.donor_id && (
        <Typography variant="body2" color="text.secondary">{`donor_id: ${point.donor_id}`}</Typography>
      )}
    </Paper>
  );
}

export default function CellScatterPlot({ visualization }) {
  const { t } = useI18n();
  const theme = useTheme();

  if (!visualization || !visualization.points || visualization.points.length === 0) {
    return null;
  }

  const clusters = visualization.points.reduce((acc, point) => {
    const clusterId = Number.isFinite(point.cluster) ? point.cluster : 0;
    if (!acc[clusterId]) {
      acc[clusterId] = [];
    }
    acc[clusterId].push(point);
    return acc;
  }, {});

  const clusterIds = Object.keys(clusters).map(Number).sort((a, b) => a - b);
  const xValues = visualization.points.map((point) => point.x);
  const yValues = visualization.points.map((point) => point.y);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  const queryPoint = visualization.query_point;

  return (
    <Paper variant="outlined" sx={{ mt: 3, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            {t('search.embeddingPlotTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('search.embeddingPlotHint')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip size="small" color="default" variant="outlined" label={`${t('search.clusterCount')}: ${visualization.cluster_count || clusterIds.length}`} />
          <Chip size="small" color="error" variant="outlined" label={t('search.queryPoint')} />
        </Box>
      </Box>

      <Box sx={{ width: '100%', height: 520 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
              type="number"
              dataKey="x"
              name="x"
              tick={{ fontSize: 11 }}
              domain={[xMin, xMax]}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="y"
              tick={{ fontSize: 11 }}
              domain={[yMin, yMax]}
            />
            <ZAxis type="number" dataKey="cluster" range={[60, 60]} />
            <Tooltip content={<ClusterTooltip />} />
            {clusterIds.map((clusterId, index) => (
              <Scatter
                key={clusterId}
                name={`${t('search.cluster')} ${clusterId + 1}`}
                data={clusters[clusterId]}
                fill={CLUSTER_COLORS[index % CLUSTER_COLORS.length]}
                isAnimationActive={false}
              >
                {clusters[clusterId].map((entry) => (
                  <Cell key={`${clusterId}-${entry.cell_id}-${entry.x}-${entry.y}`} />
                ))}
              </Scatter>
            ))}
            {queryPoint && (
              <ReferenceDot
                x={queryPoint.x}
                y={queryPoint.y}
                r={9}
                fill={theme.palette.error.main}
                stroke={theme.palette.common.white}
                strokeWidth={2}
                isFront
                label={{ value: t('search.queryPoint'), position: 'top', fill: theme.palette.error.main, fontSize: 12 }}
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
