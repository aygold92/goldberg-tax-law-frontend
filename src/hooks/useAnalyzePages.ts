import { useState } from 'react';
import { AnalyzePagesResponse, ProcessingOptions } from '../types/api';
import apiService from '../services/api';

export const useAnalyzePages = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzePagesResponse | null>(null);

  const analyzePages = async (
    classificationIds: string[],
    processingOptions?: ProcessingOptions
  ): Promise<boolean> => {
    if (classificationIds.length === 0) return true;
    setAnalyzing(true);
    setResult(null);
    try {
      const data = await apiService.analyzePages({
        pageRequests: classificationIds,
        ...(processingOptions && { processingOptions }),
      });
      setResult(data);
      return true;
    } catch {
      return false;
    } finally {
      setAnalyzing(false);
    }
  };

  const clearResult = () => setResult(null);

  return { analyzePages, analyzing, result, clearResult };
};
