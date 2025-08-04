/**
 * Selectors for the statementsList slice in the Bank Statement Frontend application.
 *
 * These selectors provide convenient access to statements list, loading, error, and spreadsheet state.
 */

import { RootState } from '../../store';

export const selectStatements = (state: RootState) => state.statementsList.statements || [];
export const selectStatementsLoading = (state: RootState) => state.statementsList.loading;
export const selectStatementsError = (state: RootState) => state.statementsList.error;
export const selectSpreadsheetResult = (state: RootState) => state.statementsList.spreadsheetResult;
export const selectSpreadsheetLoading = (state: RootState) => state.statementsList.spreadsheetLoading;
export const selectSpreadsheetError = (state: RootState) => state.statementsList.spreadsheetError; 