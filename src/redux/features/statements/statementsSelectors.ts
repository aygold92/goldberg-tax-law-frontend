/**
 * Selectors for the statements slice in the Bank Statement Frontend application.
 *
 * These selectors provide convenient access to statements, loading, error, and spreadsheet state.
 */

import { RootState } from '../../store';

export const selectStatements = (state: RootState) => state.statements.statements || [];
export const selectStatementsLoading = (state: RootState) => state.statements.loading;
export const selectStatementsError = (state: RootState) => state.statements.error;
export const selectSpreadsheetResult = (state: RootState) => state.statements.spreadsheetResult;
export const selectSpreadsheetLoading = (state: RootState) => state.statements.spreadsheetLoading;
export const selectSpreadsheetError = (state: RootState) => state.statements.spreadsheetError;
export const selectCurrentStatement = (state: RootState) => state.statements.currentStatement;
export const selectCurrentStatementLoading = (state: RootState) => state.statements.currentStatementLoading;
export const selectCurrentStatementError = (state: RootState) => state.statements.currentStatementError; 