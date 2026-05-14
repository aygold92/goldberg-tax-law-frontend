import { RootState } from '../../store';

export const selectTransactionsLoading = (state: RootState) => state.csvOutput.transactionsLoading;
export const selectTransactionsError = (state: RootState) => state.csvOutput.transactionsError;
export const selectAllTransactions = (state: RootState) => state.csvOutput.allTransactions;

export const selectGoogleSheetsLoading = (state: RootState) => state.csvOutput.googleSheetsLoading;
export const selectGoogleSheetsError = (state: RootState) => state.csvOutput.googleSheetsError;
export const selectGoogleSheetsUrl = (state: RootState) => state.csvOutput.googleSheetsUrl;

export const selectDownloadLoading = (state: RootState) => state.csvOutput.downloadLoading;
export const selectDownloadError = (state: RootState) => state.csvOutput.downloadError;

export const selectIsAnyLoading = (state: RootState) =>
  state.csvOutput.transactionsLoading ||
  state.csvOutput.googleSheetsLoading ||
  state.csvOutput.downloadLoading;
