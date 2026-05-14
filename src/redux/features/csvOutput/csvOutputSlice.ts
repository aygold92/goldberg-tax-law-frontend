import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TransactionWithCheck } from '../../../types/api';
import { RootState } from '../../store';
import apiService from '../../../services/api';
import googleSheetsService from '../../../services/googleSheets';
import JSZip from 'jszip';
import {
  generateRecordsRows,
  generateAccountSummaryRows,
  generateStatementSummaryRows,
  generateCheckSummaryRows,
  generateBillRows,
  generateBillData,
  rowsToCSV,
} from '../../../utils/spreadsheetGenerators';

export interface CsvOutputState {
  // Transaction loading
  transactionsLoading: boolean;
  transactionsError: string | null;
  allTransactions: TransactionWithCheck[] | null;

  // Google Sheets
  googleSheetsLoading: boolean;
  googleSheetsError: string | null;
  googleSheetsUrl: string | null;

  // Download
  downloadLoading: boolean;
  downloadError: string | null;
}

const initialState: CsvOutputState = {
  transactionsLoading: false,
  transactionsError: null,
  allTransactions: null,

  googleSheetsLoading: false,
  googleSheetsError: null,
  googleSheetsUrl: null,

  downloadLoading: false,
  downloadError: null,
};

export const listTransactions = createAsyncThunk<
  TransactionWithCheck[],
  { clientId: string }
>(
  'csvOutput/listTransactions',
  async ({ clientId }, { rejectWithValue }) => {
    try {
      return await apiService.listTransactions(clientId);
    } catch (error: any) {
      const message =
        error.response?.data?.errorMessage ||
        error.response?.data?.message ||
        error.message ||
        'Failed to load transactions';
      return rejectWithValue(message);
    }
  }
);

function buildSheetData(allTransactions: TransactionWithCheck[], state: RootState) {
  const statements = state.statementsList.statements;
  const checks = allTransactions.filter(t => t.checkDetails != null);
  const numTxn = allTransactions.length;
  const numStmt = statements.length;
  const numChecks = checks.length;

  return {
    recordsCSV: rowsToCSV(generateRecordsRows(statements, allTransactions)),
    accountSummaryCSV: rowsToCSV(generateAccountSummaryRows(statements)),
    statementSummaryCSV: rowsToCSV(generateStatementSummaryRows(statements)),
    checkSummaryCSV: rowsToCSV(generateCheckSummaryRows(allTransactions, statements)),
    // For Google Sheets: formula-based data written via values.update
    billSheetData: generateBillData(numTxn, numStmt, numChecks, statements),
    // For CSV download: pre-computed values
    billCSV: rowsToCSV(generateBillRows(numTxn, numStmt, numChecks, statements)),
  };
}

export const createGoogleSheets = createAsyncThunk<string, void>(
  'csvOutput/createGoogleSheets',
  async (_, { rejectWithValue, dispatch, getState }) => {
    try {
      const state = getState() as RootState;
      const client = state.client.selectedClient;
      if (!client) throw new Error('No client selected');

      const transactions = await dispatch(listTransactions({ clientId: client.clientId })).unwrap();
      const { recordsCSV, accountSummaryCSV, statementSummaryCSV, checkSummaryCSV, billSheetData } =
        buildSheetData(transactions, getState() as RootState);

      return await googleSheetsService.createSpreadsheet(
        `${client.clientName} - Bank Statements`,
        [
          { name: 'Records', csvContent: recordsCSV },
          { name: 'Account Summary', csvContent: accountSummaryCSV },
          { name: 'Statement Summary', csvContent: statementSummaryCSV },
          { name: 'Check Summary', csvContent: checkSummaryCSV },
        ],
        billSheetData
      );
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.errorMessage || error.message || 'Failed to create Google Sheets'
      );
    }
  }
);

export const downloadCsvFiles = createAsyncThunk<void, void>(
  'csvOutput/downloadCsvFiles',
  async (_, { rejectWithValue, dispatch, getState }) => {
    try {
      const state = getState() as RootState;
      const client = state.client.selectedClient;
      if (!client) throw new Error('No client selected');

      const transactions = await dispatch(listTransactions({ clientId: client.clientId })).unwrap();
      const { recordsCSV, accountSummaryCSV, statementSummaryCSV, checkSummaryCSV, billCSV } =
        buildSheetData(transactions, getState() as RootState);

      const zip = new JSZip();
      zip.file('Records.csv', recordsCSV);
      zip.file('Account Summary.csv', accountSummaryCSV);
      zip.file('Statement Summary.csv', statementSummaryCSV);
      zip.file('Check Summary.csv', checkSummaryCSV);
      zip.file('Bill.csv', billCSV);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${client.clientName}_bank_statements.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.errorMessage || error.message || 'Failed to download CSV files'
      );
    }
  }
);

const csvOutputSlice = createSlice({
  name: 'csvOutput',
  initialState,
  reducers: {
    clearCsvOutput(state) {
      state.allTransactions = null;
      state.googleSheetsUrl = null;
      state.transactionsError = null;
      state.googleSheetsError = null;
      state.downloadError = null;
    },
    clearGoogleSheetsResult(state) {
      state.googleSheetsUrl = null;
      state.googleSheetsError = null;
    },
    clearDownloadResult(state) {
      state.downloadError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listTransactions.pending, (state) => {
        state.transactionsLoading = true;
        state.transactionsError = null;
      })
      .addCase(listTransactions.fulfilled, (state, action: PayloadAction<TransactionWithCheck[]>) => {
        state.transactionsLoading = false;
        state.allTransactions = action.payload;
      })
      .addCase(listTransactions.rejected, (state, action) => {
        state.transactionsLoading = false;
        state.transactionsError = action.payload as string;
      })

      .addCase(createGoogleSheets.pending, (state) => {
        state.googleSheetsLoading = true;
        state.googleSheetsError = null;
        state.googleSheetsUrl = null;
      })
      .addCase(createGoogleSheets.fulfilled, (state, action: PayloadAction<string>) => {
        state.googleSheetsLoading = false;
        state.googleSheetsUrl = action.payload;
      })
      .addCase(createGoogleSheets.rejected, (state, action) => {
        state.googleSheetsLoading = false;
        state.googleSheetsError = action.payload as string;
      })

      .addCase(downloadCsvFiles.pending, (state) => {
        state.downloadLoading = true;
        state.downloadError = null;
      })
      .addCase(downloadCsvFiles.fulfilled, (state) => {
        state.downloadLoading = false;
      })
      .addCase(downloadCsvFiles.rejected, (state, action) => {
        state.downloadLoading = false;
        state.downloadError = action.payload as string;
      });
  },
});

export const {
  clearCsvOutput,
  clearGoogleSheetsResult,
  clearDownloadResult,
} = csvOutputSlice.actions;

export default csvOutputSlice.reducer;
