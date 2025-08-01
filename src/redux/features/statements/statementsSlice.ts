/**
 * Redux slice for managing bank statements in the Bank Statement Frontend application.
 *
 * This slice handles:
 * - Fetching all statements for a client
 * - Deleting selected statements
 * - Creating a spreadsheet from selected statements
 * - Loading a single BankStatement object from the backend
 * - Editing statement data and transactions
 * - Saving changes to the backend
 *
 * Uses Redux Toolkit for state management and async thunks for API calls.
 *
 * Depends on:
 * - @reduxjs/toolkit: https://redux-toolkit.js.org/
 * - src/types/api.ts for type definitions
 * - src/services/api.ts for API calls
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { BankStatementMetadata, BankStatementKey, WriteCsvSummaryResponse, UpdateStatementModelsRequest, UpdateStatementModelsResponse } from '../../../types/api';
import apiService from '../../../services/api';

// Add BankStatement type import
import { BankStatement, TransactionHistoryRecord } from '../../../types/bankStatement';

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
  // Add editing state
  hasUnsavedChanges: boolean;
  saveLoading: boolean;
  saveError: string | null;
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
  hasUnsavedChanges: false,
  saveLoading: false,
  saveError: null,
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

// Add thunk for saving statement changes
export const saveStatementChanges = createAsyncThunk<UpdateStatementModelsResponse, { clientName: string; accountNumber: string; classification: string; date: string }>(
  'statements/saveStatementChanges',
  async (params, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { statements: StatementsState };
      const statement = state.statements.currentStatement;
      
      if (!statement) {
        throw new Error('No statement to save');
      }

      // Create the filename in the required format
      const stmtFilename = `${params.accountNumber}:${params.classification}:${params.date.replace("/", "_")}.json`;

      const request: UpdateStatementModelsRequest = {
        clientName: params.clientName,
        stmtFilename,
        modelDetails: {
          transactions: statement.transactions.map(txn => ({
            id: txn.id,
            date: txn.date,
            description: txn.description,
            amount: txn.amount,
            checkNumber: txn.checkNumber || null,
            checkPdfMetadata: txn.checkDataModel ? {
              filename: txn.checkDataModel.description || '',
              pages: [1], // Default to page 1 for check
              classification: 'CHECK'
            } : null,
            filePageNumber: txn.filePageNumber,
          })),
          pages: statement.pageMetadata.pages.map(page => ({
            filePageNumber: page,
            batesStamp: statement.batesStamps[page] || null,
          })),
          details: {
            filename: statement.pageMetadata.filename,
            classification: statement.pageMetadata.classification,
            statementDate: statement.date || '',
            accountNumber: statement.accountNumber || '',
            beginningBalance: statement.beginningBalance || 0,
            endingBalance: statement.endingBalance || 0,
            interestCharged: statement.interestCharged || null,
            feesCharged: statement.feesCharged || null,
          },
        },
      };

      return await apiService.updateStatementModels(request);
    } catch (error: any) {
      return rejectWithValue(error.userMessage || error.message || 'Failed to save statement changes');
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
    // Add reducers for editing
    updateStatementField(state, action: PayloadAction<{ field: string; value: any }>) {
      if (state.currentStatement) {
        const { field, value } = action.payload;
        
        // Handle special case for classification which is nested in pageMetadata
        if (field === 'classification') {
          state.currentStatement.pageMetadata.classification = value;
        } else {
          (state.currentStatement as any)[field] = value;
        }
        
        state.hasUnsavedChanges = true;
      }
    },
    updateTransaction(state, action: PayloadAction<{ transactionId: string; field: string; value: any }>) {
      if (state.currentStatement) {
        const { transactionId, field, value } = action.payload;
        const transaction = state.currentStatement.transactions.find(t => t.id === transactionId);
        if (transaction) {
          (transaction as any)[field] = value;
          state.hasUnsavedChanges = true;
        }
      }
    },
    addTransaction(state, action: PayloadAction<TransactionHistoryRecord>) {
      if (state.currentStatement) {
        state.currentStatement.transactions.push(action.payload);
        state.hasUnsavedChanges = true;
      }
    },
    deleteTransaction(state, action: PayloadAction<string>) {
      if (state.currentStatement) {
        state.currentStatement.transactions = state.currentStatement.transactions.filter(
          t => t.id !== action.payload
        );
        state.hasUnsavedChanges = true;
      }
    },
    duplicateTransaction(state, action: PayloadAction<string>) {
      if (state.currentStatement) {
        const transaction = state.currentStatement.transactions.find(t => t.id === action.payload);
        if (transaction) {
          const newTransaction: TransactionHistoryRecord = {
            ...transaction,
            id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          };
          state.currentStatement.transactions.push(newTransaction);
          state.hasUnsavedChanges = true;
        }
      }
    },
    invertTransactionAmount(state, action: PayloadAction<string>) {
      if (state.currentStatement) {
        const transaction = state.currentStatement.transactions.find(t => t.id === action.payload);
        if (transaction && transaction.amount !== null) {
          transaction.amount = -transaction.amount;
          state.hasUnsavedChanges = true;
        }
      }
    },
    clearUnsavedChanges(state) {
      state.hasUnsavedChanges = false;
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
        state.hasUnsavedChanges = false;
      })
      .addCase(loadBankStatement.rejected, (state, action) => {
        state.currentStatementLoading = false;
        state.currentStatementError = action.payload as string;
      })
      // Add cases for saveStatementChanges
      .addCase(saveStatementChanges.pending, (state) => {
        state.saveLoading = true;
        state.saveError = null;
      })
      .addCase(saveStatementChanges.fulfilled, (state) => {
        state.saveLoading = false;
        state.hasUnsavedChanges = false;
      })
      .addCase(saveStatementChanges.rejected, (state, action) => {
        state.saveLoading = false;
        state.saveError = action.payload as string;
      });
  },
});

export const { 
  clearSpreadsheetResult, 
  clearCurrentStatement,
  updateStatementField,
  updateTransaction,
  addTransaction,
  deleteTransaction,
  duplicateTransaction,
  invertTransactionAmount,
  clearUnsavedChanges,
} = statementsSlice.actions;
export default statementsSlice.reducer; 