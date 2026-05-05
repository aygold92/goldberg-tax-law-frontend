import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ExternalOrchestrationStatus, PollForStatusResponse } from '../../../types/api';
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

export const startAnalysis = createAsyncThunk(
  'analysis/startAnalysis',
  async ({ clientId, files }: { clientId: string; files: Array<{ fileId: string; fileName: string }> }, { rejectWithValue }) => {
    try {
      const response = await apiService.initAnalyzeDocuments({
        clientId,
        fileIds: files.map(f => f.fileId),
      });

      const results = files.map(({ fileId, fileName }) => ({
        fileId,
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

export const checkAnalysisStatus = createAsyncThunk(
  'analysis/checkStatus',
  async (statusQueryUrl: string, { rejectWithValue }) => {
    try {
      return await apiService.pollForStatus(statusQueryUrl);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to check analysis status');
    }
  }
);

export const pollAnalysisStatus = createAsyncThunk(
  'analysis/pollStatus',
  async (statusQueryUrl: string, { rejectWithValue }) => {
    try {
      return await apiService.pollForStatus(statusQueryUrl);
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
      const idx = state.results.findIndex(r => r.fileId === fileId);
      if (idx !== -1) state.results[idx] = { ...state.results[idx], ...updates };
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
    builder
      .addCase(startAnalysis.pending, (state) => {
        state.isAnalyzing = true;
        state.error = null;
        // Clear previous analysis state so stale results don't show while the new one starts
        state.currentStatus = null;
        state.statusQueryUrl = null;
        state.results = [];
        state.pollingError = null;
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

    builder
      .addCase(checkAnalysisStatus.fulfilled, (state, action: PayloadAction<PollForStatusResponse>) => {
        state.currentStatus = action.payload;
        state.pollingError = null;
      })
      .addCase(checkAnalysisStatus.rejected, (state, action) => {
        state.pollingError = action.payload as string;
      });

    builder
      .addCase(pollAnalysisStatus.pending, (state) => {
        state.isPolling = true;
        state.pollingError = null;
      })
      .addCase(pollAnalysisStatus.fulfilled, (state, action: PayloadAction<PollForStatusResponse>) => {
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
