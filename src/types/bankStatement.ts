import { TransactionDetails, StatementDetails, Classification } from './api';

// CheckDataModel is used in the data model editor for check pages
export interface CheckDataModel {
  accountNumber?: string;
  checkNumber?: number;
  to?: string;
  description?: string;
  date?: string;
  amount?: number;
  batesStamp?: string;
  pageMetadata: ClassifiedPdfMetadata;
}

// ClassifiedPdfMetadata is used by the data model editor (validation, shape)
export interface ClassifiedPdfMetadata {
  filename: string;
  pages: number[];
  classification: string;
}

// UI-friendly transaction record used in the statement editor slice.
// Mapped from TransactionDetails with transactionId used as the local id.
export interface TransactionHistoryRecord {
  id: string; // = transactionId
  date?: string | null;
  checkNumber?: number | null;
  description?: string | null;
  amount?: number | null | undefined;
  filePageNumber?: number | null;
  checkId?: string | null;
  checkDataModel?: CheckDataModel | null;
  suspiciousReasons?: string[];
}

// UI-friendly bank statement used in the statement editor slice.
// Mapped from Statement API response.
export interface BankStatement {
  // Identification — stored so save/load can use IDs
  statementId: string;
  classificationId: string;
  fileId: string;

  // Displayed metadata (flattened from classification.info + inputFile.info)
  pageMetadata: ClassifiedPdfMetadata;

  // Statement fields
  date: string | null;
  accountNumber: string | null;
  beginningBalance: number | null;
  endingBalance: number | null;
  interestCharged: number | null;
  feesCharged: number | null;
  batesStamps: Record<number, string>;

  transactions: TransactionHistoryRecord[];
  suspiciousReasons?: string[];

  // Aggregates (not editable, derived)
  netTransactions: number;
  totalSpending: number;
  totalIncomeCredits: number;
}

// Maps a TransactionDetails (API) → TransactionHistoryRecord (UI)
export function mapTransaction(t: TransactionDetails): TransactionHistoryRecord {
  return {
    id: t.transactionId,
    date: t.date,
    checkNumber: t.checkNumber,
    description: t.description,
    amount: t.amount,
    filePageNumber: t.filePageNumber,
    checkId: t.checkId,
    suspiciousReasons: [],
  };
}

// Maps a TransactionHistoryRecord (UI) → TransactionDetails (API)
export function unmapTransaction(t: TransactionHistoryRecord): TransactionDetails {
  return {
    transactionId: t.id,
    date: t.date ?? null,
    description: t.description ?? null,
    amount: t.amount ?? null,
    checkNumber: t.checkNumber ?? null,
    filePageNumber: t.filePageNumber ?? 0,
    checkId: t.checkId ?? null,
    createdAt: 0,
    updatedAt: 0,
  };
}

// Classification types supported by the app
export enum ClassificationType {
  AMEX_CC = "AMEX CC",
  C1_CC = "C1 CC",
  CITI_CC = "CITI CC",
  WF_CC = "WF CC",
  BOFA_CC = "BofA CC",
  BOFA_CC_BUSINESS = "BofA CC Business",
  NFCU_CC = "NFCU CC",
  CAPITAL_ONE_CC = "C1 CC",
  CAPITAL_ONE_JOINT = "Capital One Joint",
  EAGLE_BANK = "Eagle Bank",
  WF_BANK = "WF Bank",
  WF_BANK_JOINT = "WF Bank Joint",
  BOFA = "BofA",
  NFCU_BANK = "NFCU Bank",
  TRUIST = "Truist",
  SANDY_SPRING = "Sandy Spring",
  ATLANTIC_UNION = "Atlantic Union",
  MT_BANK = "M&T Bank",
  TFCU_BANK = "TFCU Bank",
  TFCU_BANK_OLD = "TFCU Bank (Old)",
  ALLY_CC = "Ally CC",
  TFCU_CC = "TFCU CC",
  CHECKS = "Checks"
}
