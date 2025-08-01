/**
 * Filter utilities for transaction data.
 * 
 * This file contains functions for filtering transaction data based on various criteria:
 * - Basic text search across all fields
 * - Advanced filtering with comparison operators
 * - Custom filters for suspicious, new, income, and expense transactions
 * 
 * Used by the TransactionsTable component for filtering transaction data before
 * passing it to ReactGrid.
 */

import { TransactionHistoryRecord, BankStatement } from '../types/bankStatement';
import { calculateTransactionSuspiciousReasons } from './validation';

export interface FilterCriteria {
  columnId: string;
  comparison: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'null';
  value?: string | number;
}

export interface FilterState {
  searchText: string;
  advancedFilters: FilterCriteria[];
  showSuspicious: boolean;
  showNew: boolean;
  showIncome: boolean;
  showExpenses: boolean;
}

/**
 * Applies all filters to a list of transactions
 */
export const applyFilters = (
  transactions: TransactionHistoryRecord[],
  filters: FilterState,
  modifiedTransactions: string[],
  newTransactions: string[],
  statement: BankStatement | null
): TransactionHistoryRecord[] => {
  return transactions.filter(transaction => {
    // Apply search text filter
    if (filters.searchText) {
      const searchTerms = filters.searchText.toLowerCase().split(' ').filter(term => term.trim());
      if (searchTerms.length > 0) {
        const transactionText = `${transaction.date || ''} ${transaction.description || ''} ${transaction.amount || ''}`.toLowerCase();
        if (!searchTerms.every(term => transactionText.includes(term))) {
          return false;
        }
      }
    }
    
    // Apply advanced filters
    for (const filter of filters.advancedFilters) {
      if (!matchesFilter(transaction, filter)) {
        return false;
      }
    }
    
    // Apply custom filters
    if (filters.showSuspicious && !hasSuspiciousReasons(transaction, statement)) return false;
    if (filters.showNew && !newTransactions.includes(transaction.id)) return false;
    if (filters.showIncome && (transaction.amount === null || transaction.amount === undefined || transaction.amount <= 0)) return false;
    if (filters.showExpenses && (transaction.amount === null || transaction.amount === undefined || transaction.amount >= 0)) return false;
    
    return true;
  });
};

/**
 * Checks if a transaction matches a specific filter criteria
 */
const matchesFilter = (transaction: TransactionHistoryRecord, filter: FilterCriteria): boolean => {
  const value = getTransactionValue(transaction, filter.columnId);
  
  switch (filter.comparison) {
    case 'equals':
      return value === filter.value;
    case 'not_equals':
      return value !== filter.value;
    case 'greater_than':
      return filter.value !== undefined && value > filter.value;
    case 'less_than':
      return filter.value !== undefined && value < filter.value;
    case 'null':
      return value === null || value === undefined || value === '';
    default:
      return true;
  }
};

/**
 * Gets the value of a specific field from a transaction
 */
const getTransactionValue = (transaction: TransactionHistoryRecord, columnId: string): any => {
  switch (columnId) {
    case 'date':
      return transaction.date;
    case 'description':
      return transaction.description;
    case 'amount':
      return transaction.amount;
    case 'filePageNumber':
      return transaction.filePageNumber;
    case 'checkNumber':
      return transaction.checkNumber;
    case 'checkFilename':
      return transaction.checkDataModel?.description;
    case 'checkFilePage':
      return transaction.checkDataModel?.to;
    default:
      return null;
  }
};

/**
 * Checks if a transaction has suspicious reasons
 */
const hasSuspiciousReasons = (transaction: TransactionHistoryRecord, statement: BankStatement | null): boolean => {
  if (!statement) return false;
  const reasons = calculateTransactionSuspiciousReasons(transaction, statement);
  return reasons.length > 0;
};

/**
 * Gets the display text for a comparison operator
 */
export const getComparisonDisplayText = (comparison: FilterCriteria['comparison']): string => {
  switch (comparison) {
    case 'equals': return 'Equals';
    case 'not_equals': return 'Not equals';
    case 'greater_than': return 'Greater than';
    case 'less_than': return 'Less than';
    case 'null': return 'Is null/empty';
    default: return comparison;
  }
};

/**
 * Gets the comparison operators available for a column type
 */
export const getComparisonOperators = (columnId: string): FilterCriteria['comparison'][] => {
  switch (columnId) {
    case 'date':
    case 'amount':
    case 'filePageNumber':
    case 'checkNumber':
    case 'checkFilePage':
      return ['equals', 'not_equals', 'greater_than', 'less_than', 'null'];
    case 'description':
    case 'checkFilename':
      return ['equals', 'not_equals', 'null'];
    default:
      return ['equals', 'not_equals', 'null'];
  }
};

/**
 * Gets the input type for a column
 */
export const getColumnInputType = (columnId: string): string => {
  switch (columnId) {
    case 'date':
      return 'date';
    case 'amount':
    case 'filePageNumber':
    case 'checkNumber':
    case 'checkFilePage':
      return 'number';
    case 'description':
    case 'checkFilename':
      return 'text';
    default:
      return 'text';
  }
}; 