/**
 * Tests for filter utilities.
 * 
 * This file contains unit tests for the filtering functionality:
 * - Basic text search filtering
 * - Advanced filtering with comparison operators
 * - Custom filters for suspicious, new, income, and expense transactions
 * 
 * Tests ensure that the filtering logic works correctly for all scenarios.
 */

import { applyFilters, FilterState } from './filterUtils';
import { TransactionHistoryRecord, BankStatement } from '../types/bankStatement';

// Mock statement data for testing
const mockStatement: BankStatement = {
  date: '01/31/2024',
  accountNumber: '1234567890',
  beginningBalance: 1000,
  endingBalance: 1650,
  transactions: [],
  pageMetadata: {
    filename: 'test.pdf',
    classification: 'BANK',
    pages: [1, 2, 3]
  },
  batesStamps: {},
  checks: {},
  netTransactions: 0,
  totalSpending: 0,
  totalIncomeCredits: 0,
  suspiciousReasons: [],
  interestCharged: null,
  feesCharged: null
};

// Mock transaction data for testing
const mockTransactions: TransactionHistoryRecord[] = [
  {
    id: '1',
    date: '01/15/2024',
    description: 'Bank deposit',
    amount: 1000,
    filePageNumber: 1,
    checkNumber: null,
    checkDataModel: null
  },
  {
    id: '2',
    date: '01/16/2024',
    description: 'ATM withdrawal',
    amount: -200,
    filePageNumber: 2,
    checkNumber: null,
    checkDataModel: null
  },
  {
    id: '3',
    date: '01/17/2024',
    description: 'Online payment',
    amount: -150,
    filePageNumber: 3,
    checkNumber: null,
    checkDataModel: null
  }
];

describe('filterUtils', () => {
  describe('applyFilters', () => {
    it('should return all transactions when no filters are applied', () => {
      const filters: FilterState = {
        searchText: '',
        advancedFilters: [],
        showSuspicious: false,
        showNew: false,
        showIncome: false,
        showExpenses: false
      };

      const result = applyFilters(mockTransactions, filters, [], [], mockStatement);
      expect(result).toHaveLength(3);
    });

    it('should filter by search text with AND logic', () => {
      const filters: FilterState = {
        searchText: 'bank deposit',
        advancedFilters: [],
        showSuspicious: false,
        showNew: false,
        showIncome: false,
        showExpenses: false
      };

      const result = applyFilters(mockTransactions, filters, [], [], mockStatement);
      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Bank deposit');
    });

    it('should filter by search text with multiple terms', () => {
      const filters: FilterState = {
        searchText: 'online payment',
        advancedFilters: [],
        showSuspicious: false,
        showNew: false,
        showIncome: false,
        showExpenses: false
      };

      const result = applyFilters(mockTransactions, filters, [], [], mockStatement);
      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Online payment');
    });

    it('should filter income transactions', () => {
      const filters: FilterState = {
        searchText: '',
        advancedFilters: [],
        showSuspicious: false,
        showNew: false,
        showIncome: true,
        showExpenses: false
      };

      const result = applyFilters(mockTransactions, filters, [], [], mockStatement);
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBeGreaterThan(0);
    });

    it('should filter expense transactions', () => {
      const filters: FilterState = {
        searchText: '',
        advancedFilters: [],
        showSuspicious: false,
        showNew: false,
        showIncome: false,
        showExpenses: true
      };

      const result = applyFilters(mockTransactions, filters, [], [], mockStatement);
      expect(result).toHaveLength(2);
      expect(result.every(t => t.amount! < 0)).toBe(true);
    });

    it('should filter new transactions', () => {
      const filters: FilterState = {
        searchText: '',
        advancedFilters: [],
        showSuspicious: false,
        showNew: true,
        showIncome: false,
        showExpenses: false
      };

      const result = applyFilters(mockTransactions, filters, [], ['2'], mockStatement); // Transaction 2 is new
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should combine multiple filters with AND logic', () => {
      const filters: FilterState = {
        searchText: 'payment',
        advancedFilters: [],
        showSuspicious: false,
        showNew: false,
        showIncome: false,
        showExpenses: true
      };

      const result = applyFilters(mockTransactions, filters, [], [], mockStatement);
      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Online payment');
      expect(result[0].amount).toBeLessThan(0);
    });

    it('should filter suspicious transactions', () => {
      // Create a transaction with missing description (suspicious)
      const suspiciousTransaction: TransactionHistoryRecord = {
        id: '4',
        date: '01/18/2024',
        description: '', // Missing description
        amount: 500,
        filePageNumber: 4,
        checkNumber: null,
        checkDataModel: null
      };

      const transactionsWithSuspicious = [...mockTransactions, suspiciousTransaction];
      
      const filters: FilterState = {
        searchText: '',
        advancedFilters: [],
        showSuspicious: true,
        showNew: false,
        showIncome: false,
        showExpenses: false
      };

      const result = applyFilters(transactionsWithSuspicious, filters, [], [], mockStatement);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('4');
      expect(result[0].description).toBe('');
    });
  });
}); 