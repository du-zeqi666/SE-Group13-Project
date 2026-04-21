import React, { useState, useEffect, useCallback } from 'react';
import { Box, Container, Grid, Paper } from '@mui/material';
import Navbar from '../components/Navbar';
import SearchPanel from '../components/SearchPanel';
import ResultsDisplay from '../components/ResultsDisplay';
import { listIndices } from '../api/client';

export default function SearchPage() {
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Navbar />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3} sx={{ height: '100%' }}>
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
      </Container>
    </Box>
  );
}
