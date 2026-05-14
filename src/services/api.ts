import axios, { AxiosInstance } from 'axios';
import {
  ListClientsResponse,
  NewClientRequest,
  NewClientResponse,
  FetchWriteSASTokensRequest,
  FetchWriteSASTokensResponse,
  FetchReadSASTokenRequest,
  FetchReadSASTokenResponse,
  PutFileInfoRequest,
  PutFileInfoResponse,
  InputFileSummary,
  GetInputFileSummaryResponse,
  DeleteInputDocumentRequest,
  DeleteInputDocumentResponse,
  InitAnalyzeDocumentsRequest,
  InitAnalyzeDocumentsResponse,
  PollForStatusResponse,
  ClassificationInfo,
  PutDocumentClassificationRequest,
  PutDocumentClassificationResponse,
  ClassifyDocumentRequest,
  PutDocumentDataModelRequest,
  PutDocumentDataModelResponse,
  AnalyzePagesRequest,
  AnalyzePagesResponse,
  UpdateStatementModelsRequest,
  LoadTransactionsFromModelRequest,
  DeleteStatementRequest,
  MatchStatementsWithChecksRequest,
  TransactionCheckMatch,
  Statement,
  StatementSummary,
  TransactionWithCheck,
  WriteCsvSummaryRequest,
  WriteCsvSummaryResponse,
  RetrieveOutputFileRequest,
  RetrieveOutputFileResponse,
} from '../types/api';
import authService from './auth';

class ApiService {
  private api: AxiosInstance;

  constructor(baseURL: string = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001') {
    this.api = axios.create({
      baseURL,
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.api.interceptors.request.use(
      async (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        try {
          const token = await authService.getAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('Failed to get access token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
          error.userMessage = 'Unable to connect to the server. Please check if the backend is running.';
        } else if (error.code === 'ECONNABORTED') {
          error.userMessage = error.message || 'Request timed out.';
        } else if (error.response?.status === 404) {
          error.userMessage = 'API endpoint not found. Please check the server configuration.';
        } else if (error.response?.status >= 500) {
          error.userMessage = 'Server error occurred. Please try again later.';
        } else if (error.response?.status >= 400) {
          error.userMessage = error.response?.data?.errorMessage || error.response?.data?.message || 'Request failed. Please check your input.';
        } else {
          error.userMessage = 'An unexpected error occurred. Please try again.';
        }
        return Promise.reject(error);
      }
    );
  }

  // --- Clients ---

  async listClients(): Promise<ListClientsResponse> {
    const response = await this.api.get<ListClientsResponse>('/api/ListClients');
    return response.data;
  }

  async newClient(request: NewClientRequest): Promise<NewClientResponse> {
    const response = await this.api.post<NewClientResponse>('/api/NewClient', request);
    return response.data;
  }

  // --- Files ---

  async fetchWriteSASTokens(request: FetchWriteSASTokensRequest): Promise<FetchWriteSASTokensResponse> {
    const response = await this.api.post<FetchWriteSASTokensResponse>('/api/FetchWriteSASTokens', request);
    return response.data;
  }

  async fetchReadSASToken(request: FetchReadSASTokenRequest): Promise<FetchReadSASTokenResponse> {
    const response = await this.api.post<FetchReadSASTokenResponse>('/api/FetchReadSASToken', request);
    return response.data;
  }

  async putFileInfo(request: PutFileInfoRequest): Promise<PutFileInfoResponse> {
    const response = await this.api.post<PutFileInfoResponse>('/api/PutFileInfo', request);
    return response.data;
  }

  async listInputDocuments(clientId: string): Promise<InputFileSummary[]> {
    const response = await this.api.get<InputFileSummary[]>(
      `/api/ListInputDocuments?clientId=${encodeURIComponent(clientId)}`
    );
    return response.data;
  }

  async getInputFileSummary(fileId: string): Promise<GetInputFileSummaryResponse> {
    const response = await this.api.get<GetInputFileSummaryResponse>(
      `/api/GetInputFileSummary?fileId=${encodeURIComponent(fileId)}`
    );
    return response.data;
  }

  async deleteInputDocument(fileId: string): Promise<DeleteInputDocumentResponse> {
    const response = await this.api.post<DeleteInputDocumentResponse>('/api/DeleteInputDocument', { fileId });
    return response.data;
  }

  // --- Document Analysis (Durable Functions) ---

  async initAnalyzeDocuments(request: InitAnalyzeDocumentsRequest): Promise<InitAnalyzeDocumentsResponse> {
    const response = await this.api.post<InitAnalyzeDocumentsResponse>('/api/InitAnalyzeDocuments', request);
    return response.data;
  }

  async pollForStatus(statusQueryUrl: string): Promise<PollForStatusResponse> {
    if (statusQueryUrl.startsWith('http')) {
      const response = await fetch(statusQueryUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }
      return response.json();
    } else {
      const response = await this.api.get<PollForStatusResponse>(statusQueryUrl);
      return response.data;
    }
  }

  // --- Classifications ---

  async getDocumentClassification(fileId: string): Promise<ClassificationInfo[]> {
    const response = await this.api.get<ClassificationInfo[]>(
      `/api/GetDocumentClassification?fileId=${encodeURIComponent(fileId)}`
    );
    return response.data;
  }

  async putDocumentClassification(request: PutDocumentClassificationRequest): Promise<PutDocumentClassificationResponse> {
    const response = await this.api.post<PutDocumentClassificationResponse>('/api/PutDocumentClassification', request);
    return response.data;
  }

  async classifyDocument(fileId: string): Promise<any> {
    const response = await this.api.post<any>(
      '/api/ClassifyDocument',
      { fileId } satisfies ClassifyDocumentRequest,
      { timeout: 300000 }
    );
    return response.data;
  }

  // --- Data models ---

  async getDocumentDataModel(classificationId: string): Promise<any> {
    const response = await this.api.get<any>(
      `/api/GetDocumentDataModel?classificationId=${encodeURIComponent(classificationId)}`
    );
    return response.data;
  }

  async putDocumentDataModel(request: PutDocumentDataModelRequest): Promise<PutDocumentDataModelResponse> {
    const response = await this.api.post<PutDocumentDataModelResponse>('/api/PutDocumentDataModel', request);
    return response.data;
  }

  // --- Page analysis ---

  async analyzePages(request: AnalyzePagesRequest): Promise<AnalyzePagesResponse> {
    const response = await this.api.post<AnalyzePagesResponse>('/api/AnalyzePages', request);
    return response.data;
  }

  // --- Statements ---

  async listTransactions(clientId: string): Promise<TransactionWithCheck[]> {
    const response = await this.api.get<TransactionWithCheck[]>(
      `/api/ListTransactions?clientId=${encodeURIComponent(clientId)}`
    );
    return response.data;
  }

  async listStatements(clientId: string): Promise<StatementSummary[]> {
    const response = await this.api.get<StatementSummary[]>(
      `/api/ListStatements?clientId=${encodeURIComponent(clientId)}`
    );
    return response.data;
  }

  async loadBankStatement(statementId: string): Promise<Statement> {
    const response = await this.api.get<Statement>(
      `/api/LoadBankStatement?statementId=${encodeURIComponent(statementId)}`
    );
    return response.data;
  }

  async deleteStatement(statementId: string): Promise<void> {
    await this.api.post('/api/DeleteStatement', { statementId } satisfies DeleteStatementRequest);
  }

  async updateStatementModels(request: UpdateStatementModelsRequest): Promise<StatementSummary> {
    const response = await this.api.post<StatementSummary>('/api/UpdateStatementModels', request);
    return response.data;
  }

  async loadTransactionsFromModel(request: LoadTransactionsFromModelRequest): Promise<any> {
    const response = await this.api.post<any>('/api/LoadTransactionsFromModel', request);
    return response.data;
  }

  // --- Check matching ---

  async matchStatementsWithChecks(request: MatchStatementsWithChecksRequest): Promise<TransactionCheckMatch[]> {
    const response = await this.api.post<TransactionCheckMatch[]>('/api/MatchStatementsWithChecks', request);
    return response.data;
  }

  // --- CSV (legacy, kept if still used) ---

  async writeCsvSummary(request: WriteCsvSummaryRequest): Promise<WriteCsvSummaryResponse> {
    const response = await this.api.post<WriteCsvSummaryResponse>('/api/WriteCsvSummary', request);
    return response.data;
  }

  async retrieveOutputFile(request: RetrieveOutputFileRequest): Promise<RetrieveOutputFileResponse> {
    const response = await this.api.post<RetrieveOutputFileResponse>('/api/RetrieveOutputFile', request);
    return response.data;
  }
}

export default new ApiService();
