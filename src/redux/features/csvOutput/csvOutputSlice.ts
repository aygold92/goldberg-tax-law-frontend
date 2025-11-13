/**
 * Redux slice for managing CSV output operations in the Bank Statement Frontend application.
 * 
 * This slice handles:
 * - Creating CSV files from selected statements
 * - Retrieving CSV file content from Azure Storage
 * - Creating Google Sheets from CSV data
 * - Downloading CSV files directly
 * 
 * Uses Redux Toolkit for state management and async thunks for API calls.
 * Integrates with Google Sheets API for spreadsheet creation.
 * 
 * Depends on:
 * - @reduxjs/toolkit: https://redux-toolkit.js.org/
 * - src/types/api.ts for type definitions
 * - src/services/api.ts for API calls
 * - src/services/googleSheets.ts for Google Sheets operations
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { BankStatementKey, WriteCsvSummaryResponse, RetrieveOutputFileResponse, StatementRequest } from '../../../types/api';
import apiService from '../../../services/api';
import googleSheetsService from '../../../services/googleSheets';
import JSZip from 'jszip';

export interface CsvFileContent {
  fileName: string;
  content: string;
}

export interface CsvOutputState {
  // CSV Generation
  csvGenerationLoading: boolean;
  csvGenerationError: string | null;
  csvFiles: WriteCsvSummaryResponse | null;
  
  // File Retrieval
  fileRetrievalLoading: boolean;
  fileRetrievalError: string | null;
  fileContents: CsvFileContent[];
  
  // Google Sheets
  googleSheetsLoading: boolean;
  googleSheetsError: string | null;
  googleSheetsUrl: string | null;
  
  // Download
  downloadLoading: boolean;
  downloadError: string | null;
}

const initialState: CsvOutputState = {
  csvGenerationLoading: false,
  csvGenerationError: null,
  csvFiles: null,
  
  fileRetrievalLoading: false,
  fileRetrievalError: null,
  fileContents: [],
  
  googleSheetsLoading: false,
  googleSheetsError: null,
  googleSheetsUrl: null,
  
  downloadLoading: false,
  downloadError: null,
};

// Generate CSV files
export const generateCsvFiles = createAsyncThunk<
  WriteCsvSummaryResponse,
  { clientName: string; keys: BankStatementKey[]; outputDirectory: string }
>(
  'csvOutput/generateCsvFiles',
  async ({ clientName, keys, outputDirectory }, { rejectWithValue }) => {
    try {
      // Convert BankStatementKey objects to StatementRequest objects
      const statementRequests: StatementRequest[] = keys.map(key => ({
        accountNumber: key.accountNumber,
        classification: key.classification,
        date: key.date,
        filenameWithPages: undefined, // This will be handled by the backend if needed
      }));

      console.log('Sending CSV generation request:', {
        clientName,
        statementKeys: statementRequests,
        outputDirectory,
      });

      const response = await apiService.writeCsvSummary({
        clientName,
        statementKeys: statementRequests,
        outputDirectory,
      });
      
      console.log('CSV generation response:', response);
      return response;
    } catch (error: any) {
      console.error('CSV generation error:', error);
      const errorMessage = error.response?.data?.errorMessage || 
                          error.response?.data?.message || 
                          error.userMessage || 
                          error.message || 
                          'Failed to generate CSV files';
      return rejectWithValue(errorMessage);
    }
  }
);

// Retrieve CSV file contents
export const retrieveCsvFileContents = createAsyncThunk<
  CsvFileContent[],
  { clientName: string; fileNames: string[] }
>(
  'csvOutput/retrieveCsvFileContents',
  async ({ clientName, fileNames }, { rejectWithValue }) => {
    try {
      const promises = fileNames.map(async (fileName) => {
        console.log(`Retrieving file: ${fileName}`);
        const response = await apiService.retrieveOutputFile({
          clientName,
          fileName,
        });
        
        console.log(`File ${fileName} response:`, response);
        
        if (response.status !== 'SUCCESS' || !response.content) {
          throw new Error(response.errorMessage || 'Failed to retrieve file content');
        }
        
        return {
          fileName,
          content: response.content,
        };
      });
      
      return await Promise.all(promises);
    } catch (error: any) {
      console.error('File retrieval error:', error);
      const errorMessage = error.response?.data?.errorMessage || 
                          error.response?.data?.message || 
                          error.userMessage || 
                          error.message || 
                          'Failed to retrieve CSV file contents';
      return rejectWithValue(errorMessage);
    }
  }
);

// Create Google Sheets
export const createGoogleSheets = createAsyncThunk<
  string,
  { clientName: string; keys: BankStatementKey[]; outputDirectory: string }
>(
  'csvOutput/createGoogleSheets',
  async ({ clientName, keys, outputDirectory }, { rejectWithValue, dispatch }) => {
    try {
      // Step 1: Generate CSV files
      const csvResponse = await dispatch(generateCsvFiles({ clientName, keys, outputDirectory })).unwrap();
      
      if (csvResponse.status !== 'Success') {
        throw new Error(csvResponse.errorMessage || 'Failed to generate CSV files');
      }
      
      // Step 2: Retrieve file contents
      const fileNames = [
        csvResponse.recordsFile,
        csvResponse.accountSummaryFile,
        csvResponse.statementSummaryFile,
        csvResponse.checkSummaryFile,
      ].filter(Boolean) as string[];
      
      const fileContents = await dispatch(retrieveCsvFileContents({ clientName, fileNames })).unwrap();
      
      // Step 3: Create Google Sheets
      const recordsContent = fileContents.find(f => f.fileName === csvResponse.recordsFile)?.content || '';
      const accountSummaryContent = fileContents.find(f => f.fileName === csvResponse.accountSummaryFile)?.content || '';
      const statementSummaryContent = fileContents.find(f => f.fileName === csvResponse.statementSummaryFile)?.content || '';
      const checkSummaryContent = fileContents.find(f => f.fileName === csvResponse.checkSummaryFile)?.content || '';
      
      const spreadsheetUrl = await googleSheetsService.createSpreadsheet(
        `${clientName} - Bank Statements`,
        recordsContent,
        accountSummaryContent,
        statementSummaryContent,
        checkSummaryContent
      );
      
      return spreadsheetUrl;
    } catch (error: any) {
      console.error('Google Sheets creation error:', error);
      const errorMessage = error.response?.data?.errorMessage || 
                          error.response?.data?.message || 
                          error.userMessage || 
                          error.message || 
                          'Failed to create Google Sheets';
      return rejectWithValue(errorMessage);
    }
  }
);

// Download CSV files
export const downloadCsvFiles = createAsyncThunk<
  void,
  { clientName: string; keys: BankStatementKey[]; outputDirectory: string }
>(
  'csvOutput/downloadCsvFiles',
  async ({ clientName, keys, outputDirectory }, { rejectWithValue, dispatch }) => {
    try {
      // Step 1: Generate CSV files
      const csvResponse = await dispatch(generateCsvFiles({ clientName, keys, outputDirectory })).unwrap();
      
      if (csvResponse.status !== 'Success') {
        throw new Error(csvResponse.errorMessage || 'Failed to generate CSV files');
      }
      
      // Step 2: Retrieve file contents
      const fileNames = [
        csvResponse.recordsFile,
        csvResponse.accountSummaryFile,
        csvResponse.statementSummaryFile,
        csvResponse.checkSummaryFile,
      ].filter(Boolean) as string[];
      
      const fileContents = await dispatch(retrieveCsvFileContents({ clientName, fileNames })).unwrap();
      
      // Step 3: Create zip file and download
      const zip = new JSZip();
      
      // Add each CSV file to the zip
      fileContents.forEach(({ fileName, content }) => {
        zip.file(fileName, content);
      });
      
      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Download the zip file
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${clientName}_bank_statements.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('CSV download error:', error);
      const errorMessage = error.response?.data?.errorMessage || 
                          error.response?.data?.message || 
                          error.userMessage || 
                          error.message || 
                          'Failed to download CSV files';
      return rejectWithValue(errorMessage);
    }
  }
);

const csvOutputSlice = createSlice({
  name: 'csvOutput',
  initialState,
  reducers: {
    clearCsvOutput(state) {
      state.csvFiles = null;
      state.fileContents = [];
      state.googleSheetsUrl = null;
      state.csvGenerationError = null;
      state.fileRetrievalError = null;
      state.googleSheetsError = null;
      state.downloadError = null;
    },
    clearGoogleSheetsResult(state) {
      state.googleSheetsUrl = null;
      state.googleSheetsError = null;
    },
    clearDownloadResult(state) {
      state.downloadError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate CSV files
      .addCase(generateCsvFiles.pending, (state) => {
        state.csvGenerationLoading = true;
        state.csvGenerationError = null;
      })
      .addCase(generateCsvFiles.fulfilled, (state, action: PayloadAction<WriteCsvSummaryResponse>) => {
        state.csvGenerationLoading = false;
        state.csvFiles = action.payload;
      })
      .addCase(generateCsvFiles.rejected, (state, action) => {
        state.csvGenerationLoading = false;
        state.csvGenerationError = action.payload as string;
      })
      
      // Retrieve CSV file contents
      .addCase(retrieveCsvFileContents.pending, (state) => {
        state.fileRetrievalLoading = true;
        state.fileRetrievalError = null;
      })
      .addCase(retrieveCsvFileContents.fulfilled, (state, action: PayloadAction<CsvFileContent[]>) => {
        state.fileRetrievalLoading = false;
        state.fileContents = action.payload;
      })
      .addCase(retrieveCsvFileContents.rejected, (state, action) => {
        state.fileRetrievalLoading = false;
        state.fileRetrievalError = action.payload as string;
      })
      
      // Create Google Sheets
      .addCase(createGoogleSheets.pending, (state) => {
        state.googleSheetsLoading = true;
        state.googleSheetsError = null;
        state.googleSheetsUrl = null;
      })
      .addCase(createGoogleSheets.fulfilled, (state, action: PayloadAction<string>) => {
        state.googleSheetsLoading = false;
        state.googleSheetsUrl = action.payload;
      })
      .addCase(createGoogleSheets.rejected, (state, action) => {
        state.googleSheetsLoading = false;
        state.googleSheetsError = action.payload as string;
      })
      
      // Download CSV files
      .addCase(downloadCsvFiles.pending, (state) => {
        state.downloadLoading = true;
        state.downloadError = null;
      })
      .addCase(downloadCsvFiles.fulfilled, (state) => {
        state.downloadLoading = false;
      })
      .addCase(downloadCsvFiles.rejected, (state, action) => {
        state.downloadLoading = false;
        state.downloadError = action.payload as string;
      });
  },
});

export const { 
  clearCsvOutput,
  clearGoogleSheetsResult,
  clearDownloadResult,
} = csvOutputSlice.actions;

export default csvOutputSlice.reducer;
