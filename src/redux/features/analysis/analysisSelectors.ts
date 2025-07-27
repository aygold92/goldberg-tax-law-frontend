/**
 * Analysis selectors for Redux state access.
 * 
 * These selectors provide type-safe access to analysis state:
 * - Analysis results and status tracking
 * - Analysis progress and completion status
 * - Error handling for analysis failures
 * - Status polling state and current status
 * 
 * Using these selectors ensures consistent state access patterns
 * and provides better TypeScript support.
 */

import { RootState } from '../../store';

// Basic selectors
export const selectAnalysisResults = (state: RootState) => state.analysis.results;
export const selectIsAnalyzing = (state: RootState) => state.analysis.isAnalyzing;
export const selectAnalysisError = (state: RootState) => state.analysis.error;
export const selectStatusQueryUrl = (state: RootState) => state.analysis.statusQueryUrl;
export const selectCurrentStatus = (state: RootState) => state.analysis.currentStatus;
export const selectIsPolling = (state: RootState) => state.analysis.isPolling;
export const selectPollingError = (state: RootState) => state.analysis.pollingError;

// Derived selectors
export const selectCompletedAnalysis = (state: RootState) => 
  state.analysis.results.filter(result => result.status === 'completed');

export const selectFailedAnalysis = (state: RootState) => 
  state.analysis.results.filter(result => result.status === 'failed');

export const selectRunningAnalysis = (state: RootState) => 
  state.analysis.results.filter(result => result.status === 'running');

export const selectPendingAnalysis = (state: RootState) => 
  state.analysis.results.filter(result => result.status === 'pending');

export const selectHasAnalysisResults = (state: RootState) => 
  state.analysis.results.length > 0;

export const selectHasAnalysisErrors = (state: RootState) => 
  state.analysis.results.some(result => result.status === 'failed');

export const selectTotalAnalysisResults = (state: RootState) => 
  state.analysis.results.length;

// Status-specific selectors
export const selectAnalysisRuntimeStatus = (state: RootState) => 
  state.analysis.currentStatus?.runtimeStatus;

export const selectAnalysisCustomStatus = (state: RootState) => 
  state.analysis.currentStatus?.customStatus;

export const selectAnalysisOutput = (state: RootState) => 
  state.analysis.currentStatus?.output;

export const selectIsAnalysisComplete = (state: RootState) => {
  const status = state.analysis.currentStatus?.runtimeStatus;
  return status === 'Completed' || status === 'Failed';
};

export const selectIsAnalysisSuccessful = (state: RootState) => 
  state.analysis.currentStatus?.runtimeStatus === 'Completed';

export const selectAnalysisProgress = (state: RootState) => {
  const customStatus = state.analysis.currentStatus?.customStatus;
  if (!customStatus) return 0;
  const { totalStatements, statementsCompleted } = customStatus;
  return totalStatements > 0 ? (statementsCompleted / totalStatements) * 100 : 0;
}; 