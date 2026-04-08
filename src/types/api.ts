/**
 * TypeScript interfaces and types for API communication in the Bank Statement Frontend.
 *
 * This file defines all the TypeScript interfaces used for:
 * - API request/response structures
 * - Client management operations
 * - Document analysis and processing workflows
 * - Azure Blob Storage operations
 * - Statement and transaction data models
 *
 * These types ensure type safety when communicating with the backend API
 * and provide clear contracts for data structures used throughout the application.
 */

import { ClassifiedPdfMetadata } from './bankStatement';

// API Types based on the JSON spec
export interface ApiResponse<T = any> {
  status?: string;
  result?: T;
  errorMessage?: string;
}

// Client Management
export interface ListClientsResponse {
  clients: string[];
}

export interface NewClientRequest {
  clientName: string;
}

// SAS Token
export interface RequestSASTokenResponse {
  token: string;
}

// Document Analysis
export interface InitAnalyzeDocumentsRequest {
  clientName: string;
  documents: string[];
  overwrite: boolean;
}

export interface InitAnalyzeDocumentsResponse {
  statusQueryGetUri: string;
}

// Status Polling
export interface PollForStatusResponse {
  runtimeStatus: string;
  customStatus: AnalyzeDocumentCustomStatus;
  createdTime: string;
  lastUpdatedTime: string;
  instanceId: string;
  output: {
    status: string;
    result: any;
    errorMessage: string;
  };
}

export type AnalyzeDocumentCustomStatus = {
  stage: string;
  documents: {
    [key: string]: DocumentStatus;
  };
  totalStatements: number;
  statementsCompleted: number;
};

export type DocumentStatus = {
  filename: string;
  numStatements: number;
  statementsCompleted: number;
  classified: boolean;
};

// Statement Key and Metadata
export interface BankStatementKey {
  accountNumber: string;
  classification: string;
  date: string; // format mm/dd/yyyy
}

export interface StatementMetadata {
  md5: string;
  suspicious: boolean;
  missingChecks: boolean;
  manuallyVerified: boolean;
  bankType?: string;
  totalSpending: number;
  totalIncomeCredits: number;
  numTransactions: number;
  filename: string;
  pageRange: { first: number; second: number };
}

export interface BankStatementMetadata {
  key: BankStatementKey;
  metadata: StatementMetadata;
}

// CSV Operations
export interface StatementRequest {
  accountNumber: string | null;
  classification: string;
  date: string | null;
  filenameWithPages?: string;
}

export interface WriteCsvSummaryRequest {
  clientName: string;
  statementKeys: StatementRequest[];
  outputDirectory: string;
}

export interface WriteCsvSummaryResponse {
  status: string;
  errorMessage?: string;
  recordsFile?: string;
  accountSummaryFile?: string;
  statementSummaryFile?: string;
  checkSummaryFile?: string;
}

// Retrieve Output File
export interface RetrieveOutputFileRequest {
  clientName: string;
  fileName: string;
}

export interface RetrieveOutputFileResponse {
  status: string;
  fileName?: string;
  content?: string;
  errorMessage?: string;
}

// Document Data Model
export interface GetDocumentDataModelRequest {
  clientName: string;
  pdfMetadata: {
    filename: string;
    pages: number[];
  };
}

export interface GetDocumentDataModelResponse extends ApiResponse {
  data: any;
}

export interface PutDocumentDataModelRequest {
  clientName: string;
  model: {
    statementType: any;
  };
}

export interface PutDocumentDataModelResponse extends ApiResponse {}

// Document Classification
export interface DocumentClassification {
  filename: string;
  pages: number[];
  classification: string;
}

export interface GetDocumentClassificationRequest {
  clientName: string;
  filename: string;
}

export interface GetDocumentClassificationResponse extends Array<DocumentClassification> {}

export interface PutDocumentClassificationRequest {
  clientName: string;
  classification: DocumentClassification[];
  overwriteAll: boolean;
}

export interface PutDocumentClassificationResponse extends ApiResponse {}

// Page Analysis
export interface ProcessDataModelActivityInput {
  requestId: string;
  clientName: string;
  classifiedPdfMetadata: {
    filename: string;
    pages: number[];
    classification: string;
  };
  useOriginalFile: boolean;
}

export interface AnalyzePagesRequest {
  pageRequests: ProcessDataModelActivityInput[];
}

export interface AnalyzePagesResponse extends ApiResponse {}

// Statement Models
export interface UpdateStatementModelsRequest {
  clientName: string;
  stmtFilename: string;
  modelDetails: any;
}

export interface UpdateStatementModelsResponse extends ApiResponse {}

// Transaction Loading
export interface LoadTransactionsFromModelRequest {
  requestId: string;
  clientName: string;
  pdfMetadata: {
    filename: string;
    pages: number[];
  };
  statementDate: string;
}

export interface Transaction {
  date: string;
  amount: number;
  vendor: string;
}

export interface LoadTransactionsFromModelResponse extends Array<Transaction> {}

// Match Statements with Checks
export interface MatchStatementsWithChecksRequest {
  clientName: string;
  statements: Array<{
    filename: string;
    pages: number[];
  }>;
  checks: Array<{
    filename: string;
    pages: number[];
  }>;
}

export interface MatchStatementsWithChecksResponse {
  filenameStatementMap: Record<string, string[]>;
}

// File Metadata Operations
export interface InputFileMetadata {
  numstatements?: number;
  classified: boolean;
  analyzed: boolean;
  statements?: string[];
}

export interface GetInputFileMetadataRequest {
  clientName: string;
  filename: string;
}

export interface GetInputFileMetadataResponse {
  status: string;
  message: string;
  metadata: InputFileMetadata | null;
}

export interface UpdateInputFileMetadataRequest {
  clientName: string;
  filename: string;
  metadata: InputFileMetadata;
}

export interface UpdateInputFileMetadataResponse {
  status: string;
  message: string;
  updatedMetadata: InputFileMetadata | null;
}

export interface ClassifyDocumentResponse {
  filename: string;
  classifiedDocuments: ClassifiedPdfMetadata[];
}
