import { StatementSummary } from '../../../types/api';

export interface AccountGroup {
  accountKey: string;
  accountNumber: string;
  classification: string;
  bankType: string;
  statements: StatementSummary[];
  totalStatements: number;
  suspiciousCount: number;
  missingChecksCount: number;
  noTransactionsCount: number;
  multipleStatementsCount: number;
  dateRange: string;
  missingMonthsCount: number;
  yearlyTimeline: YearlyTimeline;
  invalidDateStatements: StatementSummary[];
}

export interface NullAccountGroup {
  classification: string;
  statements: StatementSummary[];
  totalStatements: number;
  suspiciousCount: number;
  missingChecksCount: number;
  noTransactionsCount: number;
  multipleStatementsCount: number;
  yearlyTimeline: YearlyTimeline;
  invalidDateStatements: StatementSummary[];
}

export interface YearlyTimeline {
  [year: string]: {
    months: MonthBlock[];
  };
}

export interface MonthBlock {
  month: number;
  monthName: string;
  hasStatement: boolean;
  statement?: StatementSummary;
  statements: StatementSummary[];
  hasMultipleStatements: boolean;
  isSuspicious: boolean;
  hasMissingChecks: boolean;
  hasNoTransactions: boolean;
  isMissing: boolean;
  statementDate?: string;
}

export interface AccountSummaryProps {
  statements: StatementSummary[];
  selectedClientId?: string;
}

export interface AccountGroupCardProps {
  group: AccountGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onEditStatement: (statement: StatementSummary) => void;
}

export interface NullAccountGroupCardProps {
  group: NullAccountGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onEditStatement: (statement: StatementSummary) => void;
}

export interface YearlyTimelineProps {
  yearlyTimeline: YearlyTimeline;
  onEditStatement: (statement: StatementSummary) => void;
}

export interface InvalidDateStatementsProps {
  invalidDateStatements: StatementSummary[];
  onEditStatement: (statement: StatementSummary) => void;
}

export interface MonthBlockProps {
  monthBlock: MonthBlock;
  onEditStatement: (statement: StatementSummary) => void;
}

export interface StatementTooltipProps {
  monthBlock: MonthBlock;
}
