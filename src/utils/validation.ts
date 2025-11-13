/**
 * Validation utilities for bank statement data.
 * 
 * This file contains validation functions for:
 * - Statement-level data validation
 * - Transaction-level data validation
 * - Required field validation
 * - Date range validation
 * - Balance calculation validation
 * 
 * Used by the EditPage component to validate data before saving.
 */

import { BankStatement, TransactionHistoryRecord } from '../types/bankStatement';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validates a bank statement and its transactions
 */
export function validateBankStatement(statement: BankStatement): ValidationResult {
  const errors: ValidationError[] = [];

  // Required statement fields - these are the actual fields in the BankStatement structure
  if (!statement.pageMetadata.filename) {
    errors.push({
      field: 'filename',
      message: 'filename is required'
    });
  }
  
  if (!statement.pageMetadata.classification) {
    errors.push({
      field: 'classification',
      message: 'classification is required'
    });
  }
  
  if (!statement.date) {
    errors.push({
      field: 'statementDate',
      message: 'statementDate is required'
    });
  }
  
  if (!statement.accountNumber) {
    errors.push({
      field: 'accountNumber',
      message: 'accountNumber is required'
    });
  }
  
  if (statement.beginningBalance === null || statement.beginningBalance === undefined) {
    errors.push({
      field: 'beginningBalance',
      message: 'beginningBalance is required'
    });
  }
  
  if (statement.endingBalance === null || statement.endingBalance === undefined) {
    errors.push({
      field: 'endingBalance',
      message: 'endingBalance is required'
    });
  }

  // Validate each transaction
  statement.transactions.forEach((transaction, index) => {
    const transactionErrors = validateTransaction(transaction, statement);
    transactionErrors.forEach(error => {
      errors.push({
        field: `transaction[${index}].${error.field}`,
        message: error.message
      });
    });
  });

  // Validate balance calculation - only if both balances are provided (including 0)
  if (statement.beginningBalance !== null && statement.beginningBalance !== undefined && 
      statement.endingBalance !== null && statement.endingBalance !== undefined) {
    const isCreditCard = statement.pageMetadata.classification?.includes(' CC') || false;
    let expectedValue: number;
    
    if (isCreditCard) {
      expectedValue = statement.beginningBalance - statement.endingBalance;
    } else {
      expectedValue = statement.endingBalance - statement.beginningBalance;
    }
    
    const actualValue = statement.transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const difference = Math.abs(expectedValue - actualValue);
    
    if (difference > 0.01) { // Allow small floating point differences
      errors.push({
        field: 'balanceCalculation',
        message: `Balance calculation mismatch. Expected: ${expectedValue.toFixed(2)}, Actual: ${actualValue.toFixed(2)}`
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a single transaction
 */
export function validateTransaction(transaction: TransactionHistoryRecord, statement: BankStatement): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate required fields - these should have values
  if (!transaction.date || transaction.date.trim() === '') {
    errors.push({
      field: 'date',
      message: 'Transaction date is required'
    });
  } else {
    // Validate date is on or before statement date but no more than 45 days before
    if (statement.date) {
      const transactionDate = new Date(transaction.date);
      const statementDate = new Date(statement.date);
      const daysDifference = (statementDate.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (transactionDate > statementDate) {
        errors.push({
          field: 'date',
          message: 'Transaction date cannot be after statement date'
        });
      } else if (daysDifference > 45) {
        errors.push({
          field: 'date',
          message: 'Transaction date cannot be more than 45 days before statement date'
        });
      }
    }
  }

  if (!transaction.description || transaction.description.trim() === '') {
    errors.push({
      field: 'description',
      message: 'Transaction description is required'
    });
  }

  if ((transaction.amount === null || transaction.amount === undefined) && transaction.description?.toLowerCase().startsWith('interest rate change from') === false) {
    errors.push({
      field: 'amount',
      message: 'Transaction amount is required'
    });
  }

  if (transaction.filePageNumber === null || transaction.filePageNumber === undefined) {
    errors.push({
      field: 'filePageNumber',
      message: 'Page number is required'
    });
  } else if (!statement.pageMetadata.pages.includes(transaction.filePageNumber)) {
    errors.push({
      field: 'filePageNumber',
      message: `Page number ${transaction.filePageNumber} is not in the statement pages`
    });
  }

  return errors;
}

/**
 * Calculates suspicious reasons for a transaction
 */
export function calculateTransactionSuspiciousReasons(transaction: TransactionHistoryRecord, statement: BankStatement): string[] {
  const reasons: string[] = [];

  // Check for missing required fields
  if (!transaction.date || transaction.date.trim() === '') {
    reasons.push('Missing transaction date');
  } else {
    // Check if transaction date is valid
    if (statement.date) {
      const transactionDate = new Date(transaction.date);
      const statementDate = new Date(statement.date);
      const daysDifference = (statementDate.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (transactionDate > statementDate) {
        reasons.push('Transaction date is after statement date');
      } else if (daysDifference > 45) {
        reasons.push('Transaction date is more than 45 days before statement date');
      }
    }
  }

  if (!transaction.description || transaction.description.trim() === '') {
    reasons.push('Missing transaction description');
  }

  if ((transaction.amount === null || transaction.amount === undefined || Number.isNaN(transaction.amount)) && transaction.description?.toLowerCase().startsWith('interest rate change from') === false) {
    reasons.push('Missing transaction amount');
  }

  if (transaction.filePageNumber === null || transaction.filePageNumber === undefined) {
    reasons.push('Missing page number');
  } else if (!statement.pageMetadata.pages.includes(transaction.filePageNumber)) {
    reasons.push(`Page number ${transaction.filePageNumber} is not in the statement pages`);
  }



  return reasons;
}

/**
 * Calculates suspicious reasons for the entire statement
 */
export function calculateStatementSuspiciousReasons(statement: BankStatement): string[] {
  const reasons: string[] = [];

  // Check required statement fields
  if (!statement.pageMetadata.filename) reasons.push('Missing filename');
  if (!statement.pageMetadata.classification) reasons.push('Missing classification');
  if (!statement.date) reasons.push('Missing statement date');
  if (!statement.accountNumber) reasons.push('Missing account number');
  if (statement.beginningBalance === null || statement.beginningBalance === undefined) reasons.push('Missing beginning balance');
  if (statement.endingBalance === null || statement.endingBalance === undefined) reasons.push('Missing ending balance');

  // Check balance calculation - only if both balances are provided (including 0)
  if (statement.beginningBalance !== null && statement.beginningBalance !== undefined && 
      statement.endingBalance !== null && statement.endingBalance !== undefined) {
    const isCreditCard = statement.pageMetadata.classification?.includes(' CC') || false;
    let expectedValue: number;
    
    if (isCreditCard) {
      expectedValue = statement.beginningBalance - statement.endingBalance;
    } else {
      expectedValue = statement.endingBalance - statement.beginningBalance;
    }
    
    const actualValue = statement.transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const difference = Math.abs(expectedValue - actualValue);
    
    if (difference > 0.01) {
      reasons.push(`Balance calculation mismatch. Expected: ${expectedValue.toFixed(2)}, Actual: ${actualValue.toFixed(2)}`);
    }
  }

  // Check each transaction
  statement.transactions.forEach((transaction, index) => {
    const transactionReasons = calculateTransactionSuspiciousReasons(transaction, statement);
    transactionReasons.forEach(reason => {
      reasons.push(`Transaction ${index + 1}: ${reason}`);
    });
  });

  return reasons;
} 