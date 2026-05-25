import { useCallback, useEffect, useState } from 'react';
import { getHistory, listDatasets, listIndices, listJointIndices } from '../api/client';

export default function useDashboardData() {
  const [datasets, setDatasets] = useState([]);
  const [indices, setIndices] = useState([]);
  const [jointIndices, setJointIndices] = useState([]);
  const [history, setHistory] = useState([]);

  const refresh = useCallback(async () => {
    const [datasetResponse, indexResponse, jointResponse, historyResponse] = await Promise.all([
      listDatasets(),
      listIndices(),
      listJointIndices(),
      getHistory(),
    ]);
    setDatasets(datasetResponse.data);
    setIndices(indexResponse.data);
    setJointIndices(jointResponse.data);
    setHistory(historyResponse.data);
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  return {
    datasets,
    indices,
    jointIndices,
    history,
    refresh,
  };
}