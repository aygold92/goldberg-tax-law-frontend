/**
 * Custom hook for processing bank statement data into organized account groups and timelines.
 * Handles grouping by account number, calculating summaries, and creating yearly timelines.
 */

import { useMemo } from 'react';
import { BankStatementMetadata } from '../../../types/api';
import { AccountGroup, NullAccountGroup, YearlyTimeline, MonthBlock } from '../types/accountSummary';

/**
 * Validates if a date string is valid and meaningful
 */
function isValidDate(dateString: string): boolean {
  if (!dateString || dateString === 'null' || dateString.trim() === '') {
    return false;
  }
  
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.getFullYear() > 1900;
}

/**
 * Formats a date string to display format
 */
function formatMonthYear(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Formats a statement date for display
 */
function formatStatementDate(dateString: string): string {
  if (!isValidDate(dateString)) {
    return dateString || 'null';
  }
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Creates a yearly timeline from statements
 */
function createYearlyTimeline(statements: BankStatementMetadata[]): YearlyTimeline {
  const timeline: YearlyTimeline = {};
  
  if (statements.length === 0) return timeline;
  
  // Get the range of years
  const years = new Set<number>();
  statements.forEach(statement => {
    const date = new Date(statement.key.date);
    years.add(date.getFullYear());
  });
  
  // Create timeline for each year
  years.forEach(year => {
    const yearStatements = statements.filter(s => new Date(s.key.date).getFullYear() === year);
    
    // Create 12 month blocks for this year
    const months: MonthBlock[] = [];
    for (let month = 0; month < 12; month++) {
      const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short' });
      const statementForMonth = yearStatements.find(s => new Date(s.key.date).getMonth() === month);
      
      months.push({
        month,
        monthName,
        hasStatement: !!statementForMonth,
        statement: statementForMonth,
        isSuspicious: statementForMonth?.metadata.suspicious || false,
        hasMissingChecks: statementForMonth?.metadata.missingChecks || false,
        isMissing: false, // Will be calculated later
        statementDate: statementForMonth ? formatStatementDate(statementForMonth.key.date) : undefined
      });
    }
    
    timeline[year.toString()] = { months };
  });
  
  // Mark missing months (gaps between statements)
  Object.values(timeline).forEach(yearData => {
    const firstStatementIndex = yearData.months.findIndex(m => m.hasStatement);
    let lastStatementIndex = -1;
    
    // Find last statement index manually
    for (let i = yearData.months.length - 1; i >= 0; i--) {
      if (yearData.months[i].hasStatement) {
        lastStatementIndex = i;
        break;
      }
    }
    
    if (firstStatementIndex !== -1 && lastStatementIndex !== -1) {
      for (let i = firstStatementIndex + 1; i < lastStatementIndex; i++) {
        if (!yearData.months[i].hasStatement) {
          yearData.months[i].isMissing = true;
        }
      }
    }
  });
  
  return timeline;
}

/**
 * Calculates the count of missing months in a timeline
 */
function calculateMissingMonthsCount(timeline: YearlyTimeline): number {
  let count = 0;
  Object.values(timeline).forEach(yearData => {
    count += yearData.months.filter(m => m.isMissing).length;
  });
  return count;
}

export function useAccountSummaryData(statements: BankStatementMetadata[]) {
  return useMemo(() => {
    const groups = new Map<string, AccountGroup>();
    const nullGroups = new Map<string, NullAccountGroup>();

    statements.forEach(statement => {
      const hasValidAccount = statement.key.accountNumber && 
                             statement.key.accountNumber !== 'null' && 
                             statement.key.accountNumber.trim() !== '';
      
      if (hasValidAccount) {
        const accountKey = `${statement.key.accountNumber}-${statement.key.classification}`;
        
        if (!groups.has(accountKey)) {
          groups.set(accountKey, {
            accountKey,
            accountNumber: statement.key.accountNumber,
            classification: statement.key.classification,
            bankType: statement.metadata.bankType || 'UNKNOWN',
            statements: [],
            totalStatements: 0,
            suspiciousCount: 0,
            missingChecksCount: 0,
            dateRange: '',
            missingMonthsCount: 0,
            yearlyTimeline: {},
            invalidDateStatements: []
          });
        }

        const group = groups.get(accountKey)!;
        group.statements.push(statement);
      } else {
        // Handle null account statements
        const classificationKey = statement.key.classification;
        
        if (!nullGroups.has(classificationKey)) {
          nullGroups.set(classificationKey, {
            classification: statement.key.classification,
            statements: [],
            totalStatements: 0,
            suspiciousCount: 0,
            missingChecksCount: 0,
            yearlyTimeline: {},
            invalidDateStatements: []
          });
        }

        const nullGroup = nullGroups.get(classificationKey)!;
        nullGroup.statements.push(statement);
      }
    });

    // Process regular account groups
    groups.forEach(group => {
      // Separate statements with valid dates from those with invalid dates
      const validDateStatements: BankStatementMetadata[] = [];
      const invalidDateStatements: BankStatementMetadata[] = [];

      group.statements.forEach(statement => {
        if (isValidDate(statement.key.date)) {
          validDateStatements.push(statement);
        } else {
          invalidDateStatements.push(statement);
        }
      });

      group.invalidDateStatements = invalidDateStatements;

      // Sort valid date statements by date
      validDateStatements.sort((a, b) => {
        const dateA = new Date(a.key.date);
        const dateB = new Date(b.key.date);
        return dateA.getTime() - dateB.getTime();
      });

      // Calculate counts
      group.totalStatements = group.statements.length;
      group.suspiciousCount = group.statements.filter(s => s.metadata.suspicious).length;
      group.missingChecksCount = group.statements.filter(s => s.metadata.missingChecks).length;

      // Calculate date range from valid date statements
      if (validDateStatements.length > 0) {
        const firstDate = new Date(validDateStatements[0].key.date);
        const lastDate = new Date(validDateStatements[validDateStatements.length - 1].key.date);
        group.dateRange = `${formatMonthYear(firstDate.toISOString())} - ${formatMonthYear(lastDate.toISOString())}`;
      }

      // Create yearly timeline from valid date statements
      group.yearlyTimeline = createYearlyTimeline(validDateStatements);
      group.missingMonthsCount = calculateMissingMonthsCount(group.yearlyTimeline);
    });

    // Process null account groups
    nullGroups.forEach(nullGroup => {
      // Separate statements with valid dates from those with invalid dates
      const validDateStatements: BankStatementMetadata[] = [];
      const invalidDateStatements: BankStatementMetadata[] = [];

      nullGroup.statements.forEach(statement => {
        if (isValidDate(statement.key.date)) {
          validDateStatements.push(statement);
        } else {
          invalidDateStatements.push(statement);
        }
      });

      nullGroup.invalidDateStatements = invalidDateStatements;

      // Sort valid date statements by date
      validDateStatements.sort((a, b) => {
        const dateA = new Date(a.key.date);
        const dateB = new Date(b.key.date);
        return dateA.getTime() - dateB.getTime();
      });

      // Calculate counts
      nullGroup.totalStatements = nullGroup.statements.length;
      nullGroup.suspiciousCount = nullGroup.statements.filter(s => s.metadata.suspicious).length;
      nullGroup.missingChecksCount = nullGroup.statements.filter(s => s.metadata.missingChecks).length;

      // Create yearly timeline from valid date statements
      nullGroup.yearlyTimeline = createYearlyTimeline(validDateStatements);
    });

    // Sort regular groups by classification first, then account number
    const sortedAccountGroups = Array.from(groups.values()).sort((a, b) => {
      const classificationCompare = a.classification.localeCompare(b.classification);
      if (classificationCompare !== 0) return classificationCompare;
      return a.accountNumber.localeCompare(b.accountNumber);
    });

    // Sort null groups by classification
    const sortedNullGroups = Array.from(nullGroups.values()).sort((a, b) => 
      a.classification.localeCompare(b.classification)
    );

    return { 
      accountGroups: sortedAccountGroups, 
      nullAccountGroups: sortedNullGroups 
    };
  }, [statements]);
}
