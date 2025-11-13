/**
 * Selectors for CSV output Redux state.
 * 
 * Provides typed selectors for accessing CSV output state from components.
 * Includes selectors for loading states, errors, and data.
 */

import { RootState } from '../../store';

export const selectCsvOutputState = (state: RootState) => state.csvOutput;

export const selectCsvGenerationLoading = (state: RootState) => state.csvOutput.csvGenerationLoading;
export const selectCsvGenerationError = (state: RootState) => state.csvOutput.csvGenerationError;
export const selectCsvFiles = (state: RootState) => state.csvOutput.csvFiles;

export const selectFileRetrievalLoading = (state: RootState) => state.csvOutput.fileRetrievalLoading;
export const selectFileRetrievalError = (state: RootState) => state.csvOutput.fileRetrievalError;
export const selectFileContents = (state: RootState) => state.csvOutput.fileContents;

export const selectGoogleSheetsLoading = (state: RootState) => state.csvOutput.googleSheetsLoading;
export const selectGoogleSheetsError = (state: RootState) => state.csvOutput.googleSheetsError;
export const selectGoogleSheetsUrl = (state: RootState) => state.csvOutput.googleSheetsUrl;

export const selectDownloadLoading = (state: RootState) => state.csvOutput.downloadLoading;
export const selectDownloadError = (state: RootState) => state.csvOutput.downloadError;

export const selectIsAnyLoading = (state: RootState) => 
  state.csvOutput.csvGenerationLoading ||
  state.csvOutput.fileRetrievalLoading ||
  state.csvOutput.googleSheetsLoading ||
  state.csvOutput.downloadLoading;

