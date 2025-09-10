/**
 * Redux slice for managing bank statement list in the Bank Statement Frontend application.
 *
 * This slice handles:
 * - Fetching all statements for a client (metadata only)
 * - Deleting selected statements
 * - Creating a spreadsheet from selected statements
 *
 * Uses Redux Toolkit for state management and async thunks for API calls.
 *
 * Depends on:
 * - @reduxjs/toolkit: https://redux-toolkit.js.org/
 * - src/types/api.ts for type definitions
 * - src/services/api.ts for API calls
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { BankStatementMetadata, BankStatementKey, WriteCsvSummaryResponse } from '../../../types/api';
import apiService from '../../../services/api';
import { constructFilenameWithPages } from '../../../utils/filenameUtils';

interface StatementsListState {
  statements: BankStatementMetadata[];
  loading: boolean;
  error: string | null;
  spreadsheetResult: WriteCsvSummaryResponse | null;
  spreadsheetLoading: boolean;
  spreadsheetError: string | null;
}

const initialState: StatementsListState = {
  statements: [],
  loading: false,
  error: null,
  spreadsheetResult: null,
  spreadsheetLoading: false,
  spreadsheetError: null,
};

export const fetchStatements = createAsyncThunk<BankStatementMetadata[], { clientName: string }>(
  'statementsList/fetchStatements',
  async ({ clientName }, { rejectWithValue }) => {
    try {
      return await apiService.listStatements({ clientName });
    } catch (error: any) {
      return rejectWithValue(error.userMessage || error.message || 'Failed to fetch statements');
    }
  }
);

export const deleteStatements = createAsyncThunk<BankStatementKey[], { clientName: string; statements: BankStatementMetadata[] }>(
  'statementsList/deleteStatements',
  async ({ clientName, statements }, { rejectWithValue }) => {
    try {
      for (const statement of statements) {
        const key = statement.key;
        const filenameWithPages = (key.accountNumber === 'null' || key.date === 'null') 
          ? constructFilenameWithPages(statement.metadata.filename, statement.metadata.pageRange)
          : undefined;
        
        await apiService.deleteStatement({
          clientName,
          accountNumber: key.accountNumber,
          classification: key.classification,
          date: key.date,
          filenameWithPages,
        });
      }
      return statements.map(s => s.key);
    } catch (error: any) {
      return rejectWithValue(error.userMessage || error.message || 'Failed to delete statements');
    }
  }
);

export const createSpreadsheet = createAsyncThunk<WriteCsvSummaryResponse, { clientName: string; keys: BankStatementKey[]; outputDirectory: string }>(
  'statementsList/createSpreadsheet',
  async ({ clientName, keys, outputDirectory }, { rejectWithValue }) => {
    try {
      const response = await apiService.writeCsvSummary({
        clientName,
        statementKeys: keys,
        outputDirectory,
      });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.userMessage || error.message || 'Failed to create spreadsheet');
    }
  }
);

const statementsListSlice = createSlice({
  name: 'statementsList',
  initialState,
  reducers: {
    clearSpreadsheetResult(state) {
      state.spreadsheetResult = null;
      state.spreadsheetError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStatements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStatements.fulfilled, (state, action: PayloadAction<BankStatementMetadata[]>) => {
        state.loading = false;
        state.statements = action.payload;
      })
      .addCase(fetchStatements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteStatements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStatements.fulfilled, (state, action: PayloadAction<BankStatementKey[]>) => {
        state.loading = false;
        state.statements = state.statements.filter(
          (stmt) => !action.payload.some(
            (key) =>
              stmt.key.accountNumber === key.accountNumber &&
              stmt.key.classification === key.classification &&
              stmt.key.date === key.date
          )
        );
      })
      .addCase(deleteStatements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createSpreadsheet.pending, (state) => {
        state.spreadsheetLoading = true;
        state.spreadsheetError = null;
        state.spreadsheetResult = null;
      })
      .addCase(createSpreadsheet.fulfilled, (state, action: PayloadAction<WriteCsvSummaryResponse>) => {
        state.spreadsheetLoading = false;
        state.spreadsheetResult = action.payload;
      })
      .addCase(createSpreadsheet.rejected, (state, action) => {
        state.spreadsheetLoading = false;
        state.spreadsheetError = action.payload as string;
      });
  },
});

export const { 
  clearSpreadsheetResult,
} = statementsListSlice.actions;
export default statementsListSlice.reducer; 