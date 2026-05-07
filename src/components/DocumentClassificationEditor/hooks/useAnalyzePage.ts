import { useState } from 'react';
import { ClassificationInfo, ProcessingOptions } from '../../../types/api';
import apiService from '../../../services/api';

export const useAnalyzePage = () => {
  const [analyzePageResult, setAnalyzePageResult] = useState<any>(null);
  const [analyzePageLoading, setAnalyzePageLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const analyzePages = async (
    classifications: ClassificationInfo[],
    processingOptions?: ProcessingOptions
  ): Promise<boolean> => {
    const classificationIds = classifications
      .map(c => c.classificationId)
      .filter(id => !!id); // skip unsaved (empty id)

    if (classificationIds.length === 0) return true;

    try {
      setAnalyzePageLoading(true);
      setError('');
      setAnalyzePageResult(null);

      const result = await apiService.analyzePages({
        pageRequests: classificationIds,
        ...(processingOptions && { processingOptions }),
      });
      setAnalyzePageResult(result);
      return true;
    } catch (err: any) {
      setError(err.userMessage || 'Failed to analyze pages');
      return false;
    } finally {
      setAnalyzePageLoading(false);
    }
  };

  const clearResults = () => {
    setAnalyzePageResult(null);
    setError('');
  };

  return {
    analyzePageResult,
    analyzePageLoading,
    error,
    analyzePages,
    clearResults,
    setError,
  };
};
