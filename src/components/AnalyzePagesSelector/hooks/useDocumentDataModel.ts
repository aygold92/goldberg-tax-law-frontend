import { useState, useCallback } from 'react';
import apiService from '../../../services/api';
import { GetDocumentDataModelRequest } from '../../../types/api';

export const useDocumentDataModel = () => {
  const [dataModelResult, setDataModelResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDocumentDataModel = useCallback(async (
    clientName: string,
    filename: string,
    pages: number[]
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setDataModelResult(null);

    try {
      const request: GetDocumentDataModelRequest = {
        clientName,
        pdfMetadata: {
          filename,
          pages,
        },
      };

      const response = await apiService.getDocumentDataModel(request);
      setDataModelResult(response);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get document data model';
      setError(errorMessage);
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
    // State
    dataModelResult,
    loading,
    error,
    
    // Actions
    getDocumentDataModel,
    clearResults,
  };
};
