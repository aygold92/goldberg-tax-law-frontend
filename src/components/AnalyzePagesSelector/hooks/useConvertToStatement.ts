import { useState, useCallback } from 'react';
import { TransactionCheckMatch } from '../../../types/api';
import apiService from '../../../services/api';

export const useConvertToStatement = () => {
  const [convertResult, setConvertResult] = useState<TransactionCheckMatch[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-match: pass empty transactionCheckMatches so the server discovers matches automatically
  const convertToStatement = useCallback(async (clientId: string): Promise<TransactionCheckMatch[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.matchStatementsWithChecks({
        clientId,
        transactionCheckMatches: [],
      });
      setConvertResult(response);
      return response;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to match statements with checks';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setConvertResult(null);
    setError(null);
  }, []);

  return {
    convertResult,
    loading,
    error,
    convertToStatement,
    clearResults,
  };
};
