import { useState, useCallback } from 'react';
import apiService from '../../../services/api';

export const useDocumentDataModel = () => {
  const [dataModelResult, setDataModelResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDocumentDataModel = useCallback(async (classificationId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setDataModelResult(null);

    try {
      const response = await apiService.getDocumentDataModel(classificationId);
      setDataModelResult(response);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get document data model');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setDataModelResult(null);
    setError(null);
  }, []);

  return {
    dataModelResult,
    loading,
    error,
    getDocumentDataModel,
    clearResults,
  };
};
