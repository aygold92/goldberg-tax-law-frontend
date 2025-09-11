/**
 * Type definitions for the AccountSummary component and its sub-components.
 * Defines interfaces for account grouping, timeline data, and component props.
 */

import { BankStatementMetadata } from '../../../types/api';

export interface AccountGroup {
  accountKey: string;
  accountNumber: string;
  classification: string;
  bankType: string;
  statements: BankStatementMetadata[];
  totalStatements: number;
  suspiciousCount: number;
  missingChecksCount: number;
  dateRange: string;
  missingMonthsCount: number;
  yearlyTimeline: YearlyTimeline;
  invalidDateStatements: BankStatementMetadata[];
}

export interface NullAccountGroup {
  classification: string;
  statements: BankStatementMetadata[];
  totalStatements: number;
  suspiciousCount: number;
  missingChecksCount: number;
  yearlyTimeline: YearlyTimeline;
  invalidDateStatements: BankStatementMetadata[];
}

export interface YearlyTimeline {
  [year: string]: {
    months: MonthBlock[];
  };
}

export interface MonthBlock {
  month: number; // 0-11 (January = 0)
  monthName: string;
  hasStatement: boolean;
  statement?: BankStatementMetadata;
  isSuspicious: boolean;
  hasMissingChecks: boolean;
  isMissing: boolean;
  statementDate?: string;
}

export interface AccountSummaryProps {
  statements: BankStatementMetadata[];
  selectedClient?: string;
}

export interface AccountGroupCardProps {
  group: AccountGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onEditStatement: (statement: BankStatementMetadata) => void;
}

export interface NullAccountGroupCardProps {
  group: NullAccountGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onEditStatement: (statement: BankStatementMetadata) => void;
}

export interface YearlyTimelineProps {
  yearlyTimeline: YearlyTimeline;
  onEditStatement: (statement: BankStatementMetadata) => void;
}

export interface InvalidDateStatementsProps {
  invalidDateStatements: BankStatementMetadata[];
  onEditStatement: (statement: BankStatementMetadata) => void;
}

export interface MonthBlockProps {
  monthBlock: MonthBlock;
  onEditStatement: (statement: BankStatementMetadata) => void;
}

export interface StatementTooltipProps {
  monthBlock: MonthBlock;
}
