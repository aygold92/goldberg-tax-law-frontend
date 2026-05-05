import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { InputFileSummary } from '../../../types/api';

export interface UploadedFile {
  fileObjectUrl: string | null;
  name: string;         // display name (original filename)
  fileId?: string;      // populated after PutFileInfo
  status: 'pending' | 'uploading' | 'uploaded' | 'error' | 'azure';
  progress: number;
  error?: string;
  selected: boolean;
  inputFileSummary?: InputFileSummary;
}

interface FilesState {
  files: UploadedFile[];
  isUploading: boolean;
  isAnalyzing: boolean;
  loadingAzureFiles: boolean;
  error: string | null;
}

const initialState: FilesState = {
  files: [],
  isUploading: false,
  isAnalyzing: false,
  loadingAzureFiles: false,
  error: null,
};

export const revokeFileUrl = (fileUrl: string): void => {
  URL.revokeObjectURL(fileUrl);
};

export const convertFileToUploadedFile = (file: File): UploadedFile => ({
  fileObjectUrl: URL.createObjectURL(file),
  name: file.name,
  status: 'pending',
  progress: 0,
  selected: true,
});

export const convertObjectUrlToFile = async (fileObjectUrl: string, fileName: string): Promise<File> => {
  const response = await fetch(fileObjectUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: 'application/pdf' });
};

// Load files for a client from the API (replaces loadAzureFiles)
export const loadInputDocuments = createAsyncThunk(
  'files/loadInputDocuments',
  async (clientId: string, { rejectWithValue }) => {
    try {
      const { default: apiService } = await import('../../../services/api');
      const summaries = await apiService.listInputDocuments(clientId);
      return summaries;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load files');
    }
  }
);

// Upload selected pending files then register each with PutFileInfo
export const uploadAndRegisterFiles = createAsyncThunk(
  'files/uploadAndRegisterFiles',
  async ({ clientId }: { clientId: string }, { getState, rejectWithValue, dispatch }) => {
    const state = getState() as { files: FilesState };
    const pendingFiles = state.files.files.filter(
      f => f.status === 'pending' && f.selected
    );

    if (pendingFiles.length === 0) return [];

    try {
      const { default: apiService } = await import('../../../services/api');

      dispatch(updateMultipleFiles({
        names: pendingFiles.map(f => f.name),
        updates: { status: 'uploading', progress: 0 },
      }));

      const storageAccountName = process.env.REACT_APP_AZURE_STORAGE_ACCOUNT || '';

      // 1. Get per-file write SAS tokens
      const sasResponse = await apiService.fetchWriteSASTokens({
        clientId,
        filenames: pendingFiles.map(f => f.name),
      });

      // Mark already-existing files
      if (sasResponse.alreadyExist.length > 0) {
        dispatch(updateMultipleFiles({
          names: sasResponse.alreadyExist.map(name => `${name}.pdf`),
          updates: { status: 'azure', progress: 100 },
        }));
      }

      // 2. Upload each file that received a token, then register it
      const results = await Promise.all(
        pendingFiles
          .filter(f => {
            const key = f.name.replace(/\.pdf$/i, '');
            return sasResponse.tokens[key] !== undefined;
          })
          .map(async (uploadedFile) => {
            try {
              if (!uploadedFile.fileObjectUrl) throw new Error('No file object URL');

              const key = uploadedFile.name.replace(/\.pdf$/i, '');
              const { token, storageLocation } = sasResponse.tokens[key];

              const fileObj = await convertObjectUrlToFile(uploadedFile.fileObjectUrl, uploadedFile.name);

              // Build the upload URL from storageLocation
              const uploadUrl = `https://${storageAccountName}.blob.core.windows.net/${storageLocation.containerName}/${storageLocation.filePath}.${storageLocation.extension.toLowerCase()}?${token}`;

              const putResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: fileObj,
                headers: {
                  'x-ms-blob-type': 'BlockBlob',
                  'Content-Type': 'application/pdf',
                },
              });

              if (!putResponse.ok) {
                throw new Error(`Upload failed: ${putResponse.statusText || 'Unknown error'}`);
              }

              // 3. Register with backend
              const fileInfo = await apiService.putFileInfo({
                filename: uploadedFile.name,
                clientId,
                requestToken: crypto.randomUUID(),
              });

              return {
                name: uploadedFile.name,
                status: 'uploaded' as const,
                progress: 100,
                fileId: fileInfo.fileId,
                error: undefined,
              };
            } catch (error) {
              return {
                name: uploadedFile.name,
                status: 'error' as const,
                progress: 0,
                error: error instanceof Error ? error.message : 'Upload failed',
              };
            }
          })
      );

      return results;
    } catch (error) {
      return rejectWithValue({
        error: error instanceof Error ? error.message : 'Upload failed',
        pendingFiles: pendingFiles.map(f => f.name),
      });
    }
  }
);

// Delete a file (just needs fileId)
export const deleteInputDocument = createAsyncThunk(
  'files/deleteInputDocument',
  async ({ fileId, fileName }: { fileId: string; fileName: string }, { rejectWithValue }) => {
    try {
      const { default: apiService } = await import('../../../services/api');
      await apiService.deleteInputDocument(fileId);
      return fileName;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete document');
    }
  }
);

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    addFiles: (state, action: PayloadAction<UploadedFile[]>) => {
      state.files.push(...action.payload);
    },
    updateFile: (state, action: PayloadAction<{ name: string; updates: Partial<UploadedFile> }>) => {
      const { name, updates } = action.payload;
      const idx = state.files.findIndex(f => f.name === name);
      if (idx !== -1) state.files[idx] = { ...state.files[idx], ...updates };
    },
    updateMultipleFiles: (state, action: PayloadAction<{ names: string[]; updates: Partial<UploadedFile> }>) => {
      const { names, updates } = action.payload;
      names.forEach(name => {
        const idx = state.files.findIndex(f => f.name === name);
        if (idx !== -1) state.files[idx] = { ...state.files[idx], ...updates };
      });
    },
    removeFile: (state, action: PayloadAction<string>) => {
      const file = state.files.find(f => f.name === action.payload);
      if (file?.fileObjectUrl) revokeFileUrl(file.fileObjectUrl);
      state.files = state.files.filter(f => f.name !== action.payload);
    },
    setFileSelection: (state, action: PayloadAction<{ name: string; selected: boolean }>) => {
      const file = state.files.find(f => f.name === action.payload.name);
      if (file) file.selected = action.payload.selected;
    },
    setAllFilesSelection: (state, action: PayloadAction<boolean>) => {
      state.files.forEach(f => { f.selected = action.payload; });
    },
    clearError: (state) => { state.error = null; },
    clearFiles: (state) => {
      state.files.forEach(f => { if (f.fileObjectUrl) revokeFileUrl(f.fileObjectUrl); });
      state.files = [];
      state.error = null;
    },
    resetErrorStatus: (state, action: PayloadAction<string[]>) => {
      action.payload.forEach(name => {
        const idx = state.files.findIndex(f => f.name === name);
        if (idx !== -1 && state.files[idx].status === 'error') {
          state.files[idx].status = 'pending';
          state.files[idx].progress = 0;
          state.files[idx].error = undefined;
        }
      });
    },
  },
  extraReducers: (builder) => {
    // Load input documents
    builder
      .addCase(loadInputDocuments.pending, (state) => {
        state.loadingAzureFiles = true;
        state.error = null;
      })
      .addCase(loadInputDocuments.fulfilled, (state, action) => {
        state.loadingAzureFiles = false;
        state.files = action.payload.map((summary): UploadedFile => ({
          fileObjectUrl: null,
          name: summary.inputFile.info.fileName,
          fileId: summary.inputFile.info.fileId,
          status: 'azure',
          progress: 100,
          selected: false,
          inputFileSummary: summary,
        }));
      })
      .addCase(loadInputDocuments.rejected, (state, action) => {
        state.loadingAzureFiles = false;
        state.error = action.payload as string;
      });

    // Upload and register files
    builder
      .addCase(uploadAndRegisterFiles.pending, (state) => {
        state.isUploading = true;
        state.error = null;
      })
      .addCase(uploadAndRegisterFiles.fulfilled, (state, action) => {
        state.isUploading = false;
        action.payload.forEach(result => {
          const idx = state.files.findIndex(f => f.name === result.name);
          if (idx !== -1) {
            state.files[idx] = { ...state.files[idx], ...result };
          }
        });
      })
      .addCase(uploadAndRegisterFiles.rejected, (state, action) => {
        state.isUploading = false;
        if (action.payload && typeof action.payload === 'object' && 'error' in action.payload) {
          const payload = action.payload as { error: string; pendingFiles: string[] };
          state.error = payload.error;
          payload.pendingFiles.forEach(name => {
            const idx = state.files.findIndex(f => f.name === name);
            if (idx !== -1) {
              state.files[idx].status = 'error';
              state.files[idx].progress = 0;
              state.files[idx].error = payload.error;
            }
          });
        } else {
          state.error = action.payload as string;
        }
      });

    // Delete input document
    builder
      .addCase(deleteInputDocument.pending, () => {})
      .addCase(deleteInputDocument.fulfilled, (state, action) => {
        const name = action.payload;
        const file = state.files.find(f => f.name === name);
        if (file?.fileObjectUrl) revokeFileUrl(file.fileObjectUrl);
        state.files = state.files.filter(f => f.name !== name);
      })
      .addCase(deleteInputDocument.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  addFiles,
  updateFile,
  updateMultipleFiles,
  removeFile,
  setFileSelection,
  setAllFilesSelection,
  clearError,
  clearFiles,
  resetErrorStatus,
} = filesSlice.actions;

export default filesSlice.reducer;
