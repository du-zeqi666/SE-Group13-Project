import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  CartesianGrid,
  Cell,
  ReferenceDot,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { useI18n } from '../App';
import GlassCard from './GlassCard';

const CLUSTER_COLORS = [
  '#5e6ad2',
  '#3b82f6',
  '#8b5cf6',
  '#0eb573',
  '#f2a33b',
  '#e5484d',
  '#6366f1',
  '#06b6d4',
];

function ScatterTooltip({ active, payload }) {
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

export default function CellScatterPlot({ visualization, colorBy = 'cell_type' }) {
  const { t } = useI18n();
  const theme = useTheme();

  if (!visualization || !visualization.points || visualization.points.length === 0) {
    return null;
  }

  // Group points based on colorBy
  const groups = visualization.points.reduce((acc, point) => {
    const key = (colorBy === 'cluster') ? (Number.isFinite(point.cluster) ? String(point.cluster) : '0') : (point[colorBy] ?? 'unknown');
    if (!acc[key]) acc[key] = [];
    acc[key].push(point);
    return acc;
  }, {});

  const groupKeys = Object.keys(groups).sort((a, b) => {
    // numeric sort when possible
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });
  const xValues = visualization.points.map((point) => point.x);
  const yValues = visualization.points.map((point) => point.y);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);

  return (
    <GlassCard noHover noAccent sx={{ mt: 1, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            {t('data.scatterPlotTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('data.scatterPlotHint')}
          </Typography>
        </Box>
        <Chip size="small" variant="outlined" label={`${colorBy === 'cluster' ? (t('search.clusterCount') || 'Clusters') : (t('data.groupCount') || 'Groups')}: ${visualization.cluster_count || groupKeys.length}`} />
      </Box>

      <Box sx={{ width: '100%', height: 420 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis type="number" dataKey="x" name="x" tick={{ fontSize: 11 }} domain={[xMin, xMax]} />
            <YAxis type="number" dataKey="y" name="y" tick={{ fontSize: 11 }} domain={[yMin, yMax]} />
            <ZAxis type="number" dataKey="cluster" range={[60, 60]} />
            <Tooltip content={<ScatterTooltip />} />
            {groupKeys.map((gk, index) => (
              <Scatter
                key={gk}
                name={`${colorBy === 'cluster' ? (t('search.cluster') || 'Cluster') : gk} ${colorBy === 'cluster' ? (Number(gk) + 1) : ''}`}
                data={groups[gk]}
                fill={CLUSTER_COLORS[index % CLUSTER_COLORS.length]}
                isAnimationActive={false}
              >
                {groups[gk].map((entry) => (
                  <Cell key={`${gk}-${entry.cell_id}-${entry.x}-${entry.y}`} />
                ))}
              </Scatter>
            ))}
            {visualization.query_point && (
              <ReferenceDot
                x={visualization.query_point.x}
                y={visualization.query_point.y}
                r={9}
                fill={theme.palette.error.main}
                stroke={theme.palette.common.white}
                strokeWidth={2}
                isFront
                label={{
                  value: t('search.queryPoint') || 'Query',
                  position: 'top',
                  fill: theme.palette.error.main,
                  fontSize: 12,
                }}
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </Box>
    </GlassCard>
  );
}
