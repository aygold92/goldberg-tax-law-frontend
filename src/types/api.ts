import { CheckDataModel } from './bankStatement';

export interface ApiResponse<T = any> {
  status?: string;
  result?: T;
  errorMessage?: string;
}

// --- Common types ---

export interface StorageLocation {
  containerName: string;
  filePath: string;
  extension: 'pdf' | 'json';
}

export interface Client {
  clientId: string;
  clientName: string;
  createdAt: number;
}

export interface InputFileInfo {
  fileId: string;
  fileName: string;
  storageLocation: StorageLocation;
  numPages: number;
  contentHash: string;
  uploadedAt: number;
}

export interface InputFile {
  client: Client;
  info: InputFileInfo;
}

export interface ClassificationInfo {
  classificationId: string;
  pages: number[];
  classificationType: string;
  modelLocation: StorageLocation | null;
  createdAt: number;
  updatedAt: number;
}

export interface Classification {
  inputFile: InputFile;
  info: ClassificationInfo;
}

export interface StatementDetails {
  statementId: string;
  date: string | null;
  accountNumber: string | null;
  beginningBalance: number | null;
  endingBalance: number | null;
  interestCharged: number | null;
  feesCharged: number | null;
  batesStamps: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface TransactionDetails {
  transactionId: string;
  date: string | null;
  description: string | null;
  amount: number | null;
  checkNumber: number | null;
  filePageNumber: number;
  checkId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Statement {
  classification: Classification;
  statementDetails: StatementDetails;
  suspiciousReasons: string[];
  transactions: TransactionDetails[];
}

export interface StatementSummary {
  classification: Classification;
  statementDetails: StatementDetails;
  suspiciousReasons: string[];
  missingChecks: string[];
  manuallyVerified: boolean;
  totalSpending: number;
  totalIncomeCredits: number;
  numTransactions: number;
}

export interface InputFileSummary {
  inputFile: InputFile;
  numChecks: number | null;
  numStatements: number | null;
  numTransactions: number | null;
  numAnalyzed: number | null;
  numDocuments: number | null;
}

export interface CheckDetails {
  checkId: string;
  checkNumber: number | null;
  accountNumber: string | null;
  description: string | null;
  date: string | null;
  amount: number | null;
  to: string | null;
  batesStamp: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface TransactionCheckMatch {
  transactionId: string;
  checkId: string;
}

// --- Orchestration status (Durable Functions polling) ---

export interface ExternalOrchestrationStatus {
  stage: 'Verifying Documents' | 'Classifying Documents' | 'Extracting Data' | 'Matching Checks';
  docs: Record<string, DocumentOrchestrationStatus>;
  docsCompleted: number | null;
  totalDocuments: number | null;
}

export interface DocumentOrchestrationStatus {
  fileId: string;
  numStatementPages: number | null;
  numCheckPages: number | null;
  docsAnalyzed: number | null;
  classified: boolean;
}

// Keep wrapper for the Durable Functions poll response envelope
export interface PollForStatusResponse {
  runtimeStatus: string;
  customStatus: ExternalOrchestrationStatus;
  createdTime: string;
  lastUpdatedTime: string;
  instanceId: string;
  output: {
    status: string;
    result: any;
    errorMessage: string;
  };
}

// --- Client endpoints ---

export interface ListClientsResponse {
  clients: Client[];
}

export interface NewClientRequest {
  clientName: string;
  requestToken: string;
}

export interface NewClientResponse {
  clientId: string;
  clientName: string;
}

// --- File endpoints ---

export interface FetchWriteSASTokensRequest {
  clientId: string;
  filenames: string[];
}

export interface SASTokenEntry {
  token: string;
  storageLocation: StorageLocation;
}

export interface FetchWriteSASTokensResponse {
  tokens: Record<string, SASTokenEntry>;
  alreadyExist: string[];
}

export interface FetchReadSASTokenRequest {
  fileId: string;
}

export interface FetchReadSASTokenResponse {
  token: string;
  storageLocation: StorageLocation;
}

export interface PutFileInfoRequest {
  filename: string;
  clientId: string;
  requestToken: string;
}

export interface PutFileInfoResponse {
  fileId: string;
}

export interface GetInputFileSummaryResponse {
  summary: InputFileSummary;
}

export interface DeleteInputDocumentRequest {
  fileId: string;
}

export interface DeleteInputDocumentResponse {
  clientId: string;
  fileId: string;
}

// --- Document Analysis (Durable Functions — unchanged) ---

export interface InitAnalyzeDocumentsRequest {
  clientId: string;
  fileIds: string[];
}

export interface InitAnalyzeDocumentsResponse {
  statusQueryGetUri: string;
}

// --- Classification endpoints ---

export interface PutDocumentClassificationRequest {
  file: {
    fileId: string;
    classifications: Array<{ pages: number[]; classification: string }>;
  };
  classificationsToRemove: string[];
}

export interface PutDocumentClassificationResponse {
  classificationData: ClassificationInfo[];
}

export interface ClassifyDocumentRequest {
  fileId: string;
}

// --- Data model endpoints ---

export interface PutDocumentDataModelRequest {
  classificationId: string;
  model: any;
}

export interface PutDocumentDataModelResponse {
  classificationId: string;
  model: any;
}

// --- Page analysis ---

export interface AnalyzePagesRequest {
  pageRequests: string[];
}

export interface AnalyzePagesResponse extends ApiResponse {
  result?: Record<string, any>;
}

// --- Statement endpoints ---

export interface UpdateStatementModelsRequest {
  classificationId: string;
  classification: {
    pages: number[];
    classification: string;
  };
  statementDetails: StatementDetails;
  upserts: TransactionDetails[];
  deletes: string[];
}

export interface LoadTransactionsFromModelRequest {
  requestId: string;
  classificationId: string;
}

export interface DeleteStatementRequest {
  statementId: string;
}

// --- Check matching ---

export interface MatchStatementsWithChecksRequest {
  clientId: string;
  transactionCheckMatches: TransactionCheckMatch[];
}

// --- CSV (kept for backwards compat if still used elsewhere) ---

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
