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
  to: string;
  description: string;
  date: string;
  amount: number;
  batesStamp: string;
  pageMetadata: ClassifiedPdfMetadata;
  // ...other fields as needed
}

export interface TransactionHistoryRecord {
  id: string;
  date?: string | null;
  checkNumber?: number | null;
  description?: string | null;
  amount?: number | null | undefined;
  filePageNumber?: number | null;
  checkDataModel?: CheckDataModel | null;
  suspiciousReasons?: string[]; // always empty for now, but required for UI
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

// Classification types as per BankStatement_API_Response_Spec.md
export enum ClassificationType {
  AMEX_CC = "AMEX CC",
  C1_CC = "C1 CC",
  CITI_CC = "CITI CC",
  WF_CC = "WF CC",
  BOFA_CC = "BofA CC",
  NFCU_CC = "NFCU CC",
  EAGLE_BANK = "Eagle Bank",
  WF_BANK = "WF Bank",
  WF_BANK_JOINT = "WF Bank Joint",
  BOFA = "BofA",
  NFCU_BANK = "NFCU Bank",
  TRUIST = "Truist",
  CHECKS = "Checks"
}
