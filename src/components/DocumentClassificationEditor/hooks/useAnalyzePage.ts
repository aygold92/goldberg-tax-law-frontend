import { useState } from 'react';
import { ClassificationInfo, ProcessingOptions } from '../../../types/api';
import { useAnalyzePages } from '../../../hooks/useAnalyzePages';

export const useAnalyzePage = () => {
  const [error, setError] = useState<string>('');
  const { analyzePages: runAnalyzePages, analyzing: analyzePageLoading, result: analyzePageResult, clearResult } = useAnalyzePages();

  const analyzePages = async (
    classifications: ClassificationInfo[],
    processingOptions?: ProcessingOptions
  ): Promise<boolean> => {
    const classificationIds = classifications
      .map(c => c.classificationId)
      .filter(id => !!id); // skip unsaved (empty id)

    setError('');

    const success = await runAnalyzePages(classificationIds, processingOptions);
    if (!success) setError('Failed to analyze pages');
    return success;
  };

  const clearResults = () => {
    clearResult();
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
