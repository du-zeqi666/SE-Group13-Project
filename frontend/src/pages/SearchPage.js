import React, { useState, useEffect, useCallback } from 'react';
import { Box, Container, Grid, Paper, Tab, Tabs } from '@mui/material';
import Navbar from '../components/Navbar';
import SearchPanel from '../components/SearchPanel';
import ResultsDisplay from '../components/ResultsDisplay';
import AISearchPanel from '../components/AISearchPanel';
import AIResultsDisplay from '../components/AIResultsDisplay';
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label={t('search.tabVectorSearch')} />
          <Tab label={t('search.tabAISearch')} />
        </Tabs>

        {tab === 0 ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, position: 'sticky', top: 16 }}>
                <SearchPanel indices={indices} onResults={setResults} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, minHeight: 400 }}>
                <ResultsDisplay results={results} />
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, position: 'sticky', top: 16 }}>
                <AISearchPanel onResults={setResults} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, minHeight: 400 }}>
                <AIResultsDisplay results={results} />
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
}
