/**
 * Analysis slice for Redux state management.
 * 
 * This slice manages analysis workflow state including:
 * - Analysis status tracking for uploaded files
 * - Analysis results and metadata
 * - Analysis progress and completion status
 * - Error handling for analysis failures
 * - Status polling from backend API
 * 
 * Provides centralized state management for document analysis workflows.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PollForStatusResponse } from '../../../types/api';
import apiService from '../../../services/api';

export interface AnalysisResult {
  fileId: string;
  fileName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  results?: any;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

interface AnalysisState {
  results: AnalysisResult[];
  isAnalyzing: boolean;
  error: string | null;
  statusQueryUrl: string | null;
  currentStatus: PollForStatusResponse | null;
  isPolling: boolean;
  pollingError: string | null;
}

const initialState: AnalysisState = {
  results: [],
  isAnalyzing: false,
  error: null,
  statusQueryUrl: null,
  currentStatus: null,
  isPolling: false,
  pollingError: null,
};

// Async thunk for starting analysis
export const startAnalysis = createAsyncThunk(
  'analysis/startAnalysis',
  async ({ clientName, documentFilenames }: { clientName: string; documentFilenames: string[] }, { rejectWithValue }) => {
    try {
      const response = await apiService.initAnalyzeDocuments({
        clientName,
        documents: documentFilenames,
        overwrite: true,
      });
      
      const results = documentFilenames.map(fileName => ({
        fileId: `file-${Date.now()}-${Math.random()}`,
        fileName,
        status: 'pending' as const,
        progress: 0,
        startedAt: new Date().toISOString(),
      }));
      
      return {
        results,
        statusQueryUrl: response.statusQueryGetUri,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to start analysis');
    }
  }
);

// Async thunk for checking analysis status
export const checkAnalysisStatus = createAsyncThunk(
  'analysis/checkStatus',
  async (statusQueryUrl: string, { rejectWithValue }) => {
    try {
      const response = await apiService.pollForStatus(statusQueryUrl);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to check analysis status');
    }
  }
);

// Async thunk for polling analysis status
export const pollAnalysisStatus = createAsyncThunk(
  'analysis/pollStatus',
  async (statusQueryUrl: string, { rejectWithValue }) => {
    try {
      const response = await apiService.pollForStatus(statusQueryUrl);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to poll analysis status');
    }
  }
);

const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    setStatusQueryUrl: (state, action: PayloadAction<string>) => {
      state.statusQueryUrl = action.payload;
    },
    updateAnalysisResult: (state, action: PayloadAction<{ fileId: string; updates: Partial<AnalysisResult> }>) => {
      const { fileId, updates } = action.payload;
      const resultIndex = state.results.findIndex(result => result.fileId === fileId);
      if (resultIndex !== -1) {
        state.results[resultIndex] = { ...state.results[resultIndex], ...updates };
      }
    },
    clearAnalysisResults: (state) => {
      state.results = [];
      state.error = null;
      state.currentStatus = null;
      state.pollingError = null;
    },
    clearError: (state) => {
      state.error = null;
      state.pollingError = null;
    },
    setPolling: (state, action: PayloadAction<boolean>) => {
      state.isPolling = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Start analysis
    builder
      .addCase(startAnalysis.pending, (state) => {
        state.isAnalyzing = true;
        state.error = null;
      })
      .addCase(startAnalysis.fulfilled, (state, action) => {
        state.isAnalyzing = false;
        state.results = action.payload.results;
        state.statusQueryUrl = action.payload.statusQueryUrl;
      })
      .addCase(startAnalysis.rejected, (state, action) => {
        state.isAnalyzing = false;
        state.error = action.payload as string;
      });

    // Check analysis status
    builder
      .addCase(checkAnalysisStatus.pending, (state) => {
        // Don't set isAnalyzing to true for status checks
      })
      .addCase(checkAnalysisStatus.fulfilled, (state, action) => {
        state.currentStatus = action.payload;
        state.pollingError = null;
      })
      .addCase(checkAnalysisStatus.rejected, (state, action) => {
        state.pollingError = action.payload as string;
      });

    // Poll analysis status
    builder
      .addCase(pollAnalysisStatus.pending, (state) => {
        state.isPolling = true;
        state.pollingError = null;
      })
      .addCase(pollAnalysisStatus.fulfilled, (state, action) => {
        state.isPolling = false;
        state.currentStatus = action.payload;
        state.pollingError = null;
      })
      .addCase(pollAnalysisStatus.rejected, (state, action) => {
        state.isPolling = false;
        state.pollingError = action.payload as string;
      });
  },
});

export const {
  setStatusQueryUrl,
  updateAnalysisResult,
  clearAnalysisResults,
  clearError,
  setPolling,
} = analysisSlice.actions;

export default analysisSlice.reducer; 