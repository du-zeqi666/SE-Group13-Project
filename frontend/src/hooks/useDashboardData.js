import { useCallback, useEffect, useState } from 'react';
import { getHistory, listDatasets, listIndices } from '../api/client';

export default function useDashboardData() {
  const [datasets, setDatasets] = useState([]);
  const [indices, setIndices] = useState([]);
  const [history, setHistory] = useState([]);

  const refresh = useCallback(async () => {
    const [datasetResponse, indexResponse, historyResponse] = await Promise.all([
      listDatasets(),
      listIndices(),
      getHistory(),
    ]);
    setDatasets(datasetResponse.data);
    setIndices(indexResponse.data);
    setHistory(historyResponse.data);
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  return {
    datasets,
    indices,
    history,
    refresh,
  };
}