import { useState, useCallback } from 'react';
import apiService from '../../../services/api';
import { MatchStatementsWithChecksRequest, MatchStatementsWithChecksResponse, DocumentClassification } from '../../../types/api';

export const useConvertToStatement = () => {
  const [convertResult, setConvertResult] = useState<MatchStatementsWithChecksResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convertToStatement = useCallback(async (
    clientName: string,
    classifications: DocumentClassification[]
  ): Promise<MatchStatementsWithChecksResponse> => {
    setLoading(true);
    setError(null);

    try {
      // Separate classifications into statements and checks
      const statements: Array<{ filename: string; pages: number[] }> = [];
      const checks: Array<{ filename: string; pages: number[] }> = [];

      classifications.forEach(classification => {
        const pdfMetadata = {
          filename: classification.filename,
          pages: classification.pages,
        };

        // Check if it's a check (classification === "Checks") or a statement (anything else)
        if (classification.classification === 'Checks') {
          checks.push(pdfMetadata);
        } else {
          statements.push(pdfMetadata);
        }
      });

      const request: MatchStatementsWithChecksRequest = {
        clientName,
        statements,
        checks,
      };

      const response = await apiService.matchStatementsWithChecks(request);
      setConvertResult(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to match statements with checks';
      setError(errorMessage);
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
    // State
    convertResult,
    loading,
    error,
    
    // Actions
    convertToStatement,
    clearResults,
  };
};

