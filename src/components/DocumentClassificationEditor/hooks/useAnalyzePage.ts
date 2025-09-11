import { useState } from 'react';
import { DocumentClassification, AnalyzePagesRequest, ProcessDataModelActivityInput } from '../../../types/api';
import apiService from '../../../services/api';

export const useAnalyzePage = () => {
  const [analyzePageResult, setAnalyzePageResult] = useState<any>(null);
  const [analyzePageLoading, setAnalyzePageLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Build the analyze page request
  const buildAnalyzePageRequest = (classifications: DocumentClassification[], clientName: string): AnalyzePagesRequest => {
    const pageRequests: ProcessDataModelActivityInput[] = classifications.map(classification => ({
      requestId: `webclient-${crypto.randomUUID()}`,
      clientName,
      classifiedPdfMetadata: {
        filename: classification.filename,
        pages: classification.pages,
        classification: classification.classification,
      },
      useOriginalFile: true,
    }));

    return {
      pageRequests,
    };
  };

  // Analyze pages
  const analyzePages = async (classifications: DocumentClassification[], clientName: string): Promise<boolean> => {
    if (classifications.length === 0) {
      return true; // Nothing to analyze
    }

    try {
      setAnalyzePageLoading(true);
      setError('');
      setAnalyzePageResult(null);

      const request = buildAnalyzePageRequest(classifications, clientName);
      const result = await apiService.analyzePages(request);
      
      setAnalyzePageResult(result);
      return true;
    } catch (err: any) {
      setError(err.userMessage || 'Failed to analyze pages');
      return false;
    } finally {
      setAnalyzePageLoading(false);
    }
  };

  // Clear results
  const clearResults = () => {
    setAnalyzePageResult(null);
    setError('');
  };

  return {
    // State
    analyzePageResult,
    analyzePageLoading,
    error,
    
    // Actions
    analyzePages,
    clearResults,
    
    // Setters for external control
    setError,
  };
};
