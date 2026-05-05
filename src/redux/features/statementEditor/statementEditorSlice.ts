import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Statement, StatementDetails, UpdateStatementModelsRequest } from '../../../types/api';
import { BankStatement, TransactionHistoryRecord, mapTransaction, unmapTransaction } from '../../../types/bankStatement';
import apiService from '../../../services/api';

const createHash = (obj: any): string => {
  if (obj === null || obj === undefined) return 'null';
  const str = JSON.stringify(obj);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

// Derive spending/income totals from transactions
function computeAggregates(transactions: TransactionHistoryRecord[]) {
  let totalSpending = 0;
  let totalIncomeCredits = 0;
  for (const t of transactions) {
    const amt = t.amount ?? 0;
    if (amt < 0) totalSpending += amt;
    else totalIncomeCredits += amt;
  }
  return { totalSpending, totalIncomeCredits, netTransactions: totalSpending + totalIncomeCredits };
}

// Map Statement API response → UI BankStatement
function mapStatement(s: Statement): BankStatement {
  const transactions = s.transactions.map(mapTransaction);
  const aggregates = computeAggregates(transactions);
  return {
    statementId: s.statementDetails.statementId,
    classificationId: s.classification.info.classificationId,
    fileId: s.classification.inputFile.info.fileId,
    pageMetadata: {
      filename: s.classification.inputFile.info.fileName,
      pages: s.classification.info.pages,
      classification: s.classification.info.classificationType,
    },
    date: s.statementDetails.date,
    accountNumber: s.statementDetails.accountNumber,
    beginningBalance: s.statementDetails.beginningBalance,
    endingBalance: s.statementDetails.endingBalance,
    interestCharged: s.statementDetails.interestCharged,
    feesCharged: s.statementDetails.feesCharged,
    batesStamps: Object.fromEntries(
      Object.entries(s.statementDetails.batesStamps).map(([k, v]) => [Number(k), v])
    ),
    transactions,
    suspiciousReasons: s.suspiciousReasons,
    ...aggregates,
  };
}

// Unmap batesStamps from number keys → string keys for API
function batesStampsToApi(batesStamps: Record<number, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(batesStamps).map(([k, v]) => [String(k), v])
  );
}

interface StatementEditorState {
  currentStatement: BankStatement | null;
  currentStatementLoading: boolean;
  currentStatementError: string | null;
  hasUnsavedChanges: boolean;
  saveLoading: boolean;
  saveError: string | null;
  originalStatement: BankStatement | null;
  originalHashes: {
    transactions: Record<string, string>;
    pages: Record<number, string>;
    statementFields: Record<string, string>;
  };
}

const initialState: StatementEditorState = {
  currentStatement: null,
  currentStatementLoading: false,
  currentStatementError: null,
  hasUnsavedChanges: false,
  saveLoading: false,
  saveError: null,
  originalStatement: null,
  originalHashes: { transactions: {}, pages: {}, statementFields: {} },
};

export const loadBankStatement = createAsyncThunk<BankStatement, { statementId: string }>(
  'statementEditor/loadBankStatement',
  async ({ statementId }, { rejectWithValue }) => {
    try {
      const response = await apiService.loadBankStatement(statementId);
      return mapStatement(response);
    } catch (error: any) {
      return rejectWithValue(error.userMessage || error.message || 'Failed to load bank statement');
    }
  }
);

export const saveStatementChanges = createAsyncThunk<void, void>(
  'statementEditor/saveStatementChanges',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { statementEditor: StatementEditorState };
      const statement = state.statementEditor.currentStatement;
      const original = state.statementEditor.originalStatement;
      const hashes = state.statementEditor.originalHashes;

      if (!statement) throw new Error('No statement to save');

      // Identify dirty and new transactions
      const originalIds = new Set(original?.transactions.map(t => t.id) ?? []);
      const currentIds = new Set(statement.transactions.map(t => t.id));

      const upserts = statement.transactions
        .filter(t => !originalIds.has(t.id) || createHash(t) !== hashes.transactions[t.id])
        .map(unmapTransaction);

      const deletes = (original?.transactions ?? [])
        .filter(t => !currentIds.has(t.id))
        .map(t => t.id);

      const statementDetails: StatementDetails = {
        statementId: statement.statementId,
        date: statement.date,
        accountNumber: statement.accountNumber,
        beginningBalance: statement.beginningBalance,
        endingBalance: statement.endingBalance,
        interestCharged: statement.interestCharged,
        feesCharged: statement.feesCharged,
        batesStamps: batesStampsToApi(statement.batesStamps),
        createdAt: 0,
        updatedAt: 0,
      };

      const request: UpdateStatementModelsRequest = {
        classificationId: statement.classificationId,
        classification: {
          pages: statement.pageMetadata.pages,
          classification: statement.pageMetadata.classification,
        },
        statementDetails,
        upserts,
        deletes,
      };

      await apiService.updateStatementModels(request);
    } catch (error: any) {
      return rejectWithValue(error.userMessage || error.message || 'Failed to save statement changes');
    }
  }
);

const statementEditorSlice = createSlice({
  name: 'statementEditor',
  initialState,
  reducers: {
    clearCurrentStatement(state) {
      state.currentStatement = null;
      state.currentStatementError = null;
      state.currentStatementLoading = false;
    },
    updateStatementField(state, action: PayloadAction<{ field: string; value: any }>) {
      if (state.currentStatement) {
        const { field, value } = action.payload;
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
    batchUpdateTransaction(state, action: PayloadAction<{ transactionId: string; changes: Array<{ field: string; value: any }> }>) {
      if (state.currentStatement) {
        const { transactionId, changes } = action.payload;
        const transaction = state.currentStatement.transactions.find(t => t.id === transactionId);
        if (transaction) {
          changes.forEach(({ field, value }) => { (transaction as any)[field] = value; });
          state.hasUnsavedChanges = true;
        }
      }
    },
    batchUpdateMultipleTransactions(state, action: PayloadAction<Array<{ transactionId: string; changes: Array<{ field: string; value: any }> }>>) {
      if (state.currentStatement) {
        action.payload.forEach(({ transactionId, changes }) => {
          const transaction = state.currentStatement!.transactions.find(t => t.id === transactionId);
          if (transaction) {
            changes.forEach(({ field, value }) => {
              if (field === 'checkFilename') {
                (transaction as any).checkDataModel = {
                  ...transaction.checkDataModel,
                  pageMetadata: { ...transaction.checkDataModel?.pageMetadata, filename: value },
                };
              } else if (field === 'checkFilePage') {
                (transaction as any).checkDataModel = {
                  ...transaction.checkDataModel,
                  pageMetadata: { ...transaction.checkDataModel?.pageMetadata, pages: [value] },
                };
              } else {
                (transaction as any)[field] = value;
              }
            });
          }
        });
        state.hasUnsavedChanges = true;
      }
    },
    batchUpdatePages(state, action: PayloadAction<Array<{ pageNumber: number; changes: Array<{ field: string; value: any }> }>>) {
      if (state.currentStatement) {
        action.payload.forEach(({ pageNumber, changes }) => {
          changes.forEach(({ field, value }) => {
            if (field === 'pageNumber') {
              const pages = [...state.currentStatement!.pageMetadata.pages];
              const idx = pages.indexOf(pageNumber);
              if (idx !== -1) {
                pages[idx] = value;
                state.currentStatement!.pageMetadata.pages = pages;
                const stamp = state.currentStatement!.batesStamps[pageNumber];
                if (stamp !== undefined) {
                  state.currentStatement!.batesStamps[value] = stamp;
                  delete state.currentStatement!.batesStamps[pageNumber];
                }
              }
            } else if (field === 'batesStamp') {
              state.currentStatement!.batesStamps[pageNumber] = value;
            }
          });
        });
        state.hasUnsavedChanges = true;
      }
    },
    addPage(state, action: PayloadAction<number>) {
      if (state.currentStatement) {
        const p = action.payload;
        if (!state.currentStatement.pageMetadata.pages.includes(p)) {
          state.currentStatement.pageMetadata.pages.push(p);
          state.currentStatement.pageMetadata.pages.sort((a, b) => a - b);
          state.hasUnsavedChanges = true;
        }
      }
    },
    deletePage(state, action: PayloadAction<number>) {
      if (state.currentStatement) {
        const p = action.payload;
        state.currentStatement.pageMetadata.pages = state.currentStatement.pageMetadata.pages.filter(x => x !== p);
        delete state.currentStatement.batesStamps[p];
        state.hasUnsavedChanges = true;
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
        state.currentStatement.transactions = state.currentStatement.transactions.filter(t => t.id !== action.payload);
        state.hasUnsavedChanges = true;
      }
    },
    duplicateTransaction(state, action: PayloadAction<string>) {
      if (state.currentStatement) {
        const t = state.currentStatement.transactions.find(x => x.id === action.payload);
        if (t) {
          state.currentStatement.transactions.push({ ...t, id: crypto.randomUUID() });
          state.hasUnsavedChanges = true;
        }
      }
    },
    invertTransactionAmount(state, action: PayloadAction<string>) {
      if (state.currentStatement) {
        const t = state.currentStatement.transactions.find(x => x.id === action.payload);
        if (t && t.amount) {
          t.amount = -t.amount;
          state.hasUnsavedChanges = true;
        }
      }
    },
    clearUnsavedChanges(state) {
      state.hasUnsavedChanges = false;
    },
    resetTransaction(state, action: PayloadAction<string>) {
      if (state.currentStatement && state.originalStatement) {
        const orig = state.originalStatement.transactions.find(t => t.id === action.payload);
        const curr = state.currentStatement.transactions.find(t => t.id === action.payload);
        if (orig && curr) {
          Object.assign(curr, orig);
          state.hasUnsavedChanges = true;
        }
      }
    },
    resetPage(state, action: PayloadAction<number>) {
      if (state.currentStatement && state.originalStatement) {
        const stamp = state.originalStatement.batesStamps[action.payload];
        if (stamp !== undefined) {
          state.currentStatement.batesStamps[action.payload] = stamp;
          state.hasUnsavedChanges = true;
        }
      }
    },
    resetStatementField(state, action: PayloadAction<string>) {
      if (state.currentStatement && state.originalStatement) {
        const field = action.payload;
        if (field === 'classification') {
          state.currentStatement.pageMetadata.classification = state.originalStatement.pageMetadata.classification;
        } else {
          (state.currentStatement as any)[field] = (state.originalStatement as any)[field];
        }
        state.hasUnsavedChanges = true;
      }
    },
    restoreState(state, action: PayloadAction<StatementEditorState>) {
      Object.assign(state, action.payload);
      state.hasUnsavedChanges = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadBankStatement.pending, (state) => {
        state.currentStatementLoading = true;
        state.currentStatementError = null;
      })
      .addCase(loadBankStatement.fulfilled, (state, action: PayloadAction<BankStatement>) => {
        state.currentStatementLoading = false;
        state.currentStatement = action.payload;
        state.hasUnsavedChanges = false;
        state.originalStatement = JSON.parse(JSON.stringify(action.payload));
        state.originalHashes = { transactions: {}, pages: {}, statementFields: {} };

        action.payload.transactions.forEach(tx => {
          state.originalHashes.transactions[tx.id] = createHash(tx);
        });
        action.payload.pageMetadata.pages.forEach(p => {
          state.originalHashes.pages[p] = createHash({ pageNumber: p, batesStamp: action.payload.batesStamps[p] });
        });
        const fields = {
          date: action.payload.date,
          accountNumber: action.payload.accountNumber,
          beginningBalance: action.payload.beginningBalance,
          endingBalance: action.payload.endingBalance,
          interestCharged: action.payload.interestCharged,
          feesCharged: action.payload.feesCharged,
          classification: action.payload.pageMetadata.classification,
        };
        Object.entries(fields).forEach(([k, v]) => {
          state.originalHashes.statementFields[k] = createHash(v);
        });
      })
      .addCase(loadBankStatement.rejected, (state, action) => {
        state.currentStatementLoading = false;
        state.currentStatementError = action.payload as string;
      })
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
  clearCurrentStatement,
  updateStatementField,
  updateTransaction,
  batchUpdateTransaction,
  batchUpdateMultipleTransactions,
  batchUpdatePages,
  addPage,
  deletePage,
  addTransaction,
  deleteTransaction,
  duplicateTransaction,
  invertTransactionAmount,
  clearUnsavedChanges,
  resetTransaction,
  resetPage,
  resetStatementField,
  restoreState,
} = statementEditorSlice.actions;

export default statementEditorSlice.reducer;
