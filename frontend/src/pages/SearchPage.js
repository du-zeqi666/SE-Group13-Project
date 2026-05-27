import React, { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Tab, Tabs, Typography } from '@mui/material';
import SearchPanel from '../components/SearchPanel';
import ResultsDisplay from '../components/ResultsDisplay';
import AISearchPanel from '../components/AISearchPanel';
import AIResultsDisplay from '../components/AIResultsDisplay';
import GlassCard from '../components/GlassCard';
import { SearchMotif } from '../components/ScienceIllustrations';
import { listIndices } from '../api/client';
import { useI18n } from '../App';

export default function SearchPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState(0);
  const [indices, setIndices] = useState([]);
  const [results, setResults] = useState(null);

  const fetchIndices = useCallback(async () => {
    try {
      const res = await listIndices();
      setIndices(res.data);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchIndices();
  }, [fetchIndices]);

  const handleTabChange = (_, newTab) => {
    setTab(newTab);
    setResults(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {t('search.title')}
          </Typography>
          <Box
            sx={{
              width: 60,
              height: 3,
              borderRadius: '3px',
              background: (t2) => t2.palette.custom?.gradientBar || 'linear-gradient(135deg, #0d9488, #2563eb)',
              mb: 2,
            }}
          />
        </Box>
        <Box sx={{ position: 'relative', width: 100, height: 80, color: 'primary.main', flexShrink: 0, mt: -1, mr: -1 }}>
          <SearchMotif />
        </Box>
      </Box>
      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label={t('search.tabVectorSearch')} />
        <Tab label={t('search.tabAISearch')} />
      </Tabs>

      {tab === 0 ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <GlassCard sx={{ position: 'sticky', top: 24 }}>
              <SearchPanel indices={indices} onResults={setResults} />
            </GlassCard>
          </Grid>
          <Grid item xs={12} md={8}>
            <GlassCard sx={{ minHeight: 400 }}>
              <ResultsDisplay results={results} />
            </GlassCard>
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <GlassCard sx={{ position: 'sticky', top: 24 }}>
              <AISearchPanel onResults={setResults} />
            </GlassCard>
          </Grid>
          <Grid item xs={12} md={8}>
            <GlassCard sx={{ minHeight: 400 }}>
              <AIResultsDisplay results={results} />
            </GlassCard>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
