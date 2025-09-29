/**
 * API Service for backend communication in the Bank Statement Frontend application.
 * 
 * This service provides a centralized interface for all backend API calls:
 * - Client management (list, create clients)
 * - Document analysis and processing
 * - Azure Blob Storage operations (SAS tokens, blob listing)
 * - Document data model operations
 * - Statement and transaction management
 * 
 * Features include:
 * - Automatic authentication token injection
 * - Request/response interceptors for logging and error handling
 * - Comprehensive error handling with user-friendly messages
 * - Timeout configuration for long-running operations
 * - CORS handling to minimize preflight requests
 * 
 * Uses axios for HTTP requests and integrates with the authentication service.
 */

import axios, { AxiosInstance } from 'axios';
import {
  ListClientsResponse,
  NewClientRequest,
  RequestSASTokenResponse,
  InitAnalyzeDocumentsRequest,
  InitAnalyzeDocumentsResponse,
  PollForStatusResponse,
  WriteCsvSummaryRequest,
  WriteCsvSummaryResponse,
  GetDocumentDataModelRequest,
  GetDocumentDataModelResponse,
  PutDocumentDataModelRequest,
  PutDocumentDataModelResponse,
  GetDocumentClassificationRequest,
  GetDocumentClassificationResponse,
  PutDocumentClassificationRequest,
  PutDocumentClassificationResponse,
  AnalyzePagesRequest,
  AnalyzePagesResponse,
  UpdateStatementModelsRequest,
  UpdateStatementModelsResponse,
  LoadTransactionsFromModelRequest,
  LoadTransactionsFromModelResponse,
  BankStatementMetadata,
  GetInputFileMetadataRequest,
  GetInputFileMetadataResponse,
  UpdateInputFileMetadataRequest,
  UpdateInputFileMetadataResponse,
  InputFileMetadata,
} from '../types/api';
import authService from './auth';
// Add BankStatement import
import { BankStatement } from '../types/bankStatement';


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

    // Add request interceptor for authentication and logging
    this.api.interceptors.request.use(
      async (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        
        // Add authorization header if user is authenticated
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
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        
        // Enhance error messages for better user feedback
        if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
          error.userMessage = 'Unable to connect to the server. Please check if the backend is running.';
        } else if (error.response?.status === 404) {
          error.userMessage = 'API endpoint not found. Please check the server configuration.';
        } else if (error.response?.status >= 500) {
          error.userMessage = 'Server error occurred. Please try again later.';
        } else if (error.response?.status >= 400) {
          error.userMessage = error.response?.data?.message || 'Request failed. Please check your input.';
        } else {
          error.userMessage = 'An unexpected error occurred. Please try again.';
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Client Management
  async listClients(): Promise<ListClientsResponse> {
    const response = await this.api.get<ListClientsResponse>('/api/ListClients');
    return response.data;
  }

  async newClient(request: NewClientRequest): Promise<void> {
    await this.api.post('/api/NewClient', request);
  }

  // SAS Token
  async requestSASToken(clientName: string, action: string): Promise<RequestSASTokenResponse> {
    const response = await this.api.get<RequestSASTokenResponse>(
      `/api/RequestSASToken?clientName=${encodeURIComponent(clientName)}&action=${encodeURIComponent(action)}`
    );
    return response.data;
  }

  // Document Analysis
  async initAnalyzeDocuments(request: InitAnalyzeDocumentsRequest): Promise<InitAnalyzeDocumentsResponse> {
    const response = await this.api.post<InitAnalyzeDocumentsResponse>('/api/InitAnalyzeDocuments', request);
    return response.data;
  }

  async pollForStatus(statusQueryUrl: string): Promise<PollForStatusResponse> {
    // For external URLs, use fetch directly to avoid CORS issues
    if (statusQueryUrl.startsWith('http')) {
      const response = await fetch(statusQueryUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
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

  // CSV Operations
  async writeCsvSummary(request: WriteCsvSummaryRequest): Promise<WriteCsvSummaryResponse> {
    const response = await this.api.post<WriteCsvSummaryResponse>('/api/WriteCsvSummary', request);
    return response.data;
  }

  // Document Data Model
  async getDocumentDataModel(request: GetDocumentDataModelRequest): Promise<GetDocumentDataModelResponse> {
    const response = await this.api.post<GetDocumentDataModelResponse>('/api/GetDocumentDataModel', request);
    return response.data;
  }

  async putDocumentDataModel(request: PutDocumentDataModelRequest): Promise<PutDocumentDataModelResponse> {
    const response = await this.api.post<PutDocumentDataModelResponse>('/api/PutDocumentDataModel', request);
    return response.data;
  }

  // Document Classification
  async getDocumentClassification(request: GetDocumentClassificationRequest): Promise<GetDocumentClassificationResponse> {
    const response = await this.api.post<GetDocumentClassificationResponse>('/api/GetDocumentClassification', request);
    return response.data;
  }

  async putDocumentClassification(request: PutDocumentClassificationRequest): Promise<PutDocumentClassificationResponse> {
    const response = await this.api.post<PutDocumentClassificationResponse>('/api/PutDocumentClassification', request);
    return response.data;
  }

  // Page Analysis
  async analyzePages(request: AnalyzePagesRequest): Promise<AnalyzePagesResponse> {
    const response = await this.api.post<AnalyzePagesResponse>('/api/AnalyzePage', request);
    return response.data;
  }

  // Statement Models
  async updateStatementModels(request: UpdateStatementModelsRequest): Promise<UpdateStatementModelsResponse> {
    const response = await this.api.post<UpdateStatementModelsResponse>('/api/UpdateStatementModels', request);
    return response.data;
  }

  // Transaction Loading
  async loadTransactionsFromModel(request: LoadTransactionsFromModelRequest): Promise<LoadTransactionsFromModelResponse> {
    const response = await this.api.post<LoadTransactionsFromModelResponse>('/api/LoadTransactionsFromModel', request);
    return response.data;
  }

  // Add loadBankStatement method
  async loadBankStatement(params: { clientName: string; accountNumber: string; classification: string; date: string; filenameWithPages?: string }): Promise<BankStatement> {
    const response = await this.api.post<BankStatement>('/api/LoadBankStatement', params);
    return response.data;
  }

  // Statements
  async listStatements(request: { clientName: string }): Promise<BankStatementMetadata[]> {
    const response = await this.api.post<BankStatementMetadata[]>('/api/ListStatements', request);
    return response.data;
  }

  async deleteStatement(request: { clientName: string; accountNumber: string; classification: string; date: string; filenameWithPages?: string }): Promise<void> {
    await this.api.post('/api/DeleteStatement', request);
  }

  // Delete input document
  async deleteInputDocument(clientName: string, filename: string): Promise<void> {
    await this.api.post('/api/DeleteInputDocument', { clientName, filename });
  }

  // File Metadata Operations
  async getInputFileMetadata(request: GetInputFileMetadataRequest): Promise<GetInputFileMetadataResponse> {
    const response = await this.api.get<GetInputFileMetadataResponse>(
      `/api/GetInputFileMetadata?clientName=${encodeURIComponent(request.clientName)}&filename=${encodeURIComponent(request.filename)}`
    );
    return response.data;
  }

  async updateInputFileMetadata(request: UpdateInputFileMetadataRequest): Promise<UpdateInputFileMetadataResponse> {
    const response = await this.api.post<UpdateInputFileMetadataResponse>('/api/UpdateInputFileMetadata', request);
    return response.data;
  }
}

export default new ApiService();

// List blobs in a container using Azure Storage REST API
export async function listBlobsWithMetadata(containerName: string, sasToken: string, storageAccountName: string): Promise<Array<{ name: string; metadata: Record<string, string> }>> {
  // List blobs
  const listUrl = `https://${storageAccountName}.blob.core.windows.net/${containerName}?restype=container&comp=list&include=metadata&${sasToken}`;
  const response = await fetch(listUrl);
  if (!response.ok) throw new Error('Failed to list blobs');
  const text = await response.text();
  // Parse XML response
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'application/xml');
  const blobs: Array<{ name: string; metadata: Record<string, string> }> = [];
  const blobNodes = xml.getElementsByTagName('Blob');
  for (let i = 0; i < blobNodes.length; i++) {
    const blobNode = blobNodes[i];
    const name = blobNode.getElementsByTagName('Name')[0]?.textContent || '';
    const metadataNode = blobNode.getElementsByTagName('Metadata')[0];
    const metadata: Record<string, string> = {};
    if (metadataNode) {
      for (let j = 0; j < metadataNode.children.length; j++) {
        const meta = metadataNode.children[j];
        metadata[meta.nodeName] = meta.textContent || '';
      }
    }
    blobs.push({ name, metadata });
  }
  return blobs;
}

 