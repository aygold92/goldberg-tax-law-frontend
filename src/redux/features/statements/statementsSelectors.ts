/**
 * Selectors for the statements slice in the Bank Statement Frontend application.
 *
 * These selectors provide convenient access to statements, loading, error, and spreadsheet state.
 */

import { RootState } from '../../store';
import { TransactionHistoryRecord } from '../../../types/bankStatement';

// Helper function to create hash for change detection
const createHash = (obj: any): string => {
  if (obj === null || obj === undefined) {
    return 'null';
  }
  const str = JSON.stringify(obj);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

export const selectStatements = (state: RootState) => state.statements.statements || [];
export const selectStatementsLoading = (state: RootState) => state.statements.loading;
export const selectStatementsError = (state: RootState) => state.statements.error;
export const selectSpreadsheetResult = (state: RootState) => state.statements.spreadsheetResult;
export const selectSpreadsheetLoading = (state: RootState) => state.statements.spreadsheetLoading;
export const selectSpreadsheetError = (state: RootState) => state.statements.spreadsheetError;
export const selectCurrentStatement = (state: RootState) => state.statements.currentStatement;
export const selectCurrentStatementLoading = (state: RootState) => state.statements.currentStatementLoading;
export const selectCurrentStatementError = (state: RootState) => state.statements.currentStatementError;
export const selectHasUnsavedChanges = (state: RootState) => state.statements.hasUnsavedChanges;
export const selectSaveLoading = (state: RootState) => state.statements.saveLoading;
export const selectSaveError = (state: RootState) => state.statements.saveError;

// Add selectors for change detection
export const selectTransactionChanges = (state: RootState) => {
  const { currentStatement, originalHashes } = state.statements;
  if (!currentStatement || !originalHashes) return { modified: [], newItems: [] };
  
  const modified: string[] = [];
  const newItems: string[] = [];
  
  currentStatement.transactions.forEach((tx: TransactionHistoryRecord) => {
    const currentHash = createHash(tx);
    const originalHash = originalHashes.transactions[tx.id];
    
    if (!originalHash) {
      newItems.push(tx.id);
    } else if (currentHash !== originalHash) {
      modified.push(tx.id);
    }
  });
  
  return { modified, newItems };
};

export const selectPageChanges = (state: RootState) => {
  const { currentStatement, originalHashes } = state.statements;
  if (!currentStatement || !originalHashes) return { modified: [], newItems: [] };
  
  const modified: number[] = [];
  const newItems: number[] = [];
  
  currentStatement.pageMetadata.pages.forEach((pageNum: number) => {
    const currentHash = createHash({
      pageNumber: pageNum,
      batesStamp: currentStatement.batesStamps[pageNum]
    });
    const originalHash = originalHashes.pages[pageNum];
    
    if (!originalHash) {
      newItems.push(pageNum);
    } else if (currentHash !== originalHash) {
      modified.push(pageNum);
    }
  });
  
  return { modified, newItems };
};

export const selectStatementFieldChanges = (state: RootState) => {
  const { currentStatement, originalHashes } = state.statements;
  if (!currentStatement || !originalHashes) return [];

  const modified: string[] = [];

  const fields = ['date', 'accountNumber', 'beginningBalance', 'endingBalance', 'interestCharged', 'feesCharged', 'classification'];

  fields.forEach(field => {
    const currentValue = field === 'classification'
      ? currentStatement.pageMetadata.classification
      : (currentStatement as any)[field];
    const currentHash = createHash(currentValue);
    const originalHash = originalHashes.statementFields[field];

    if (originalHash && currentHash !== originalHash) {
      modified.push(field);
    }
  });

  return modified;
};

// Add selectors for undo/redo state
export const selectCanUndo = () => {
  // This will be implemented by the middleware
  return false; // Placeholder
};

export const selectCanRedo = () => {
  // This will be implemented by the middleware
  return false; // Placeholder
}; 