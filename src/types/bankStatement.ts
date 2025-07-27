// File: src/types/bankStatement.ts
// Purpose: TypeScript type for a full BankStatement object as returned by the /api/LoadBankStatement endpoint.
// See: docs/edit_page/BankStatement_API_Response_Spec.md

export interface ClassifiedPdfMetadata {
  filename: string;
  pages: number[];
  classification: string;
  // ...other fields as needed
}

export interface CheckDataModel {
  accountNumber: string;
  checkNumber: number;
  payee: string;
  description: string;
  date: string;
  amount: number;
  // ...other fields as needed
}

export interface TransactionHistoryRecord {
  id: string;
  date: string;
  checkNumber?: number | null;
  description: string;
  amount: number;
  filePageNumber: number;
  checkDataModel?: CheckDataModel | null;
  suspiciousReasons: string[]; // always empty for now, but required for UI
  // ...other fields as needed
}

export interface BankStatement {
  pageMetadata: ClassifiedPdfMetadata;
  date: string | null;
  accountNumber: string | null;
  beginningBalance: number | null;
  endingBalance: number | null;
  interestCharged: number | null;
  feesCharged: number | null;
  transactions: TransactionHistoryRecord[];
  batesStamps: Record<number, string>;
  checks: Record<number, ClassifiedPdfMetadata>;
  netTransactions: number;
  totalSpending: number;
  totalIncomeCredits: number;
  suspiciousReasons: string[];
} 