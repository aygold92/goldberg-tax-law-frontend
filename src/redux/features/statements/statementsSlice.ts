/**
 * Redux slice for managing bank statements in the Bank Statement Frontend application.
 *
 * This slice handles:
 * - Fetching all statements for a client
 * - Deleting selected statements
 * - Creating a spreadsheet from selected statements
 * - Loading a single BankStatement object from the backend
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

// Add BankStatement type import
import { BankStatement } from '../../../types/bankStatement';

interface StatementsState {
  statements: BankStatementMetadata[];
  loading: boolean;
  error: string | null;
  spreadsheetResult: WriteCsvSummaryResponse | null;
  spreadsheetLoading: boolean;
  spreadsheetError: string | null;
  // Add single statement state
  currentStatement: BankStatement | null;
  currentStatementLoading: boolean;
  currentStatementError: string | null;
}

const initialState: StatementsState = {
  statements: [],
  loading: false,
  error: null,
  spreadsheetResult: null,
  spreadsheetLoading: false,
  spreadsheetError: null,
  currentStatement: null,
  currentStatementLoading: false,
  currentStatementError: null,
};

export const fetchStatements = createAsyncThunk<BankStatementMetadata[], { clientName: string }>(
  'statements/fetchStatements',
  async ({ clientName }, { rejectWithValue }) => {
    try {
      return await apiService.listStatements({ clientName });
    } catch (error: any) {
      return rejectWithValue(error.userMessage || error.message || 'Failed to fetch statements');
    }
  }
);

export const deleteStatements = createAsyncThunk<BankStatementKey[], { clientName: string; keys: BankStatementKey[] }>(
  'statements/deleteStatements',
  async ({ clientName, keys }, { rejectWithValue }) => {
    try {
      for (const key of keys) {
        await apiService.deleteStatement({
          clientName,
          accountNumber: key.accountNumber,
          classification: key.classification,
          date: key.date,
        });
      }
      return keys;
    } catch (error: any) {
      return rejectWithValue(error.userMessage || error.message || 'Failed to delete statements');
    }
  }
);

export const createSpreadsheet = createAsyncThunk<WriteCsvSummaryResponse, { clientName: string; keys: BankStatementKey[]; outputDirectory: string }>(
  'statements/createSpreadsheet',
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

// Add thunk for loading a single BankStatement
export const loadBankStatement = createAsyncThunk<BankStatement, { clientName: string; accountNumber: string; classification: string; date: string }>(
  'statements/loadBankStatement',
  async (params, { rejectWithValue }) => {
    try {
      return await apiService.loadBankStatement(params);
    } catch (error: any) {
      return rejectWithValue(error.userMessage || error.message || 'Failed to load bank statement');
    }
  }
);

const statementsSlice = createSlice({
  name: 'statements',
  initialState,
  reducers: {
    clearSpreadsheetResult(state) {
      state.spreadsheetResult = null;
      state.spreadsheetError = null;
    },
    // Add reducer to clear current statement
    clearCurrentStatement(state) {
      state.currentStatement = null;
      state.currentStatementError = null;
      state.currentStatementLoading = false;
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
      })
      // Add cases for loadBankStatement
      .addCase(loadBankStatement.pending, (state) => {
        state.currentStatementLoading = true;
        state.currentStatementError = null;
      })
      .addCase(loadBankStatement.fulfilled, (state, action: PayloadAction<BankStatement>) => {
        state.currentStatementLoading = false;
        state.currentStatement = action.payload;
      })
      .addCase(loadBankStatement.rejected, (state, action) => {
        state.currentStatementLoading = false;
        state.currentStatementError = action.payload as string;
      });
  },
});

export const { clearSpreadsheetResult, clearCurrentStatement } = statementsSlice.actions;
export default statementsSlice.reducer; 