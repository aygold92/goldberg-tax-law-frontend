/**
 * Files slice for Redux state management.
 * 
 * This slice manages file upload and management state including:
 * - List of uploaded files with their metadata
 * - File upload progress and status tracking
 * - File selection state for batch operations
 * - Error handling for upload failures
 * 
 * Replaces local state management in DocumentUpload component
 * with centralized Redux state for better scalability.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface InputFileMetadata {
  numstatements?: string;
  classified: string;
  analyzed: string;
  statements?: string;
}

interface ParsedFileMetadata {
  numstatements?: number;
  classified: boolean;
  analyzed: boolean;
  statements?: string[];
}

export interface UploadedFile {
  fileObjectUrl: string | null; // Object URL as string for serialization
  name: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error' | 'azure';
  progress: number;
  error?: string;
  azureUrl?: string;
  metadata?: ParsedFileMetadata;
  selected: boolean;
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

// Helper function to create object URL from File
const createFileUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

// Helper function to revoke object URL
export const revokeFileUrl = (fileUrl: string): void => {
  URL.revokeObjectURL(fileUrl);
};

// Helper function to convert File to UploadedFile
export const convertFileToUploadedFile = (file: File): UploadedFile => {
  return {
    fileObjectUrl: createFileUrl(file),
    name: file.name,
    status: 'pending',
    progress: 0,
    selected: true,
  };
};

// Helper function to convert object URL back to File object
export const convertObjectUrlToFile = async (fileObjectUrl: string, fileName: string): Promise<File> => {
  const response = await fetch(fileObjectUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: 'application/pdf' });
};

// Async thunk for loading Azure files
export const loadAzureFiles = createAsyncThunk(
  'files/loadAzureFiles',
  async (clientName: string, { rejectWithValue }) => {
    try {
      // Import the API service dynamically to avoid circular dependencies
      const { default: apiService, listBlobsWithMetadata } = await import('../../../services/api');
      
      const action = 'input';
      const storageAccountName = process.env.REACT_APP_AZURE_STORAGE_ACCOUNT || '';
      const sasResponse = await apiService.requestSASToken(clientName, action);
      const containerName = `${clientName}-${action}`;
      const blobs = await listBlobsWithMetadata(containerName, sasResponse.token, storageAccountName);
      
      const azureFiles = blobs.map(({ name, metadata }) => {
        const parsed: ParsedFileMetadata = {
          numstatements: metadata.numstatements ? Number(metadata.numstatements) : undefined,
          classified: metadata.classified === 'true',
          analyzed: metadata.analyzed === 'true',
          statements: metadata.statements ? metadata.statements.split(',') : undefined,
        };
        return {
          fileObjectUrl: null,
          name,
          status: 'azure' as const,
          progress: 100,
          metadata: parsed,
          selected: false,
        };
      });
      
      return azureFiles;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load files');
    }
  }
);

// Async thunk for uploading files to Azure
export const uploadFilesToAzure = createAsyncThunk(
  'files/uploadFilesToAzure',
  async ({ selectedClient }: { selectedClient: string }, { getState, rejectWithValue, dispatch }) => {
    const state = getState() as { files: FilesState };
    const pendingFiles = state.files.files.filter(
      file => file.status === 'pending' && file.selected
    );
    
    if (pendingFiles.length === 0) {
      return [];
    }

    try {
      // Update files to uploading status now that we have them captured
      dispatch(updateMultipleFiles({ 
        names: pendingFiles.map(f => f.name), 
        updates: { status: 'uploading', progress: 0 } 
      }));

      // Import the API service dynamically to avoid circular dependencies
      const { default: apiService } = await import('../../../services/api');
      
      const uploadPromises = pendingFiles.map(async (uploadedFile) => {
        try {
          if (!uploadedFile.fileObjectUrl) {
            throw new Error('No file object URL available');
          }
          
          const fileObj = await convertObjectUrlToFile(uploadedFile.fileObjectUrl, uploadedFile.name);
          
          // Upload to Azure
          const action = 'input';
          const storageAccountName = process.env.REACT_APP_AZURE_STORAGE_ACCOUNT;
          const sasResponse = await apiService.requestSASToken(selectedClient, action);
          const containerName = `${selectedClient}-${action}`;
          const uploadUrl = `https://${storageAccountName}.blob.core.windows.net/${containerName}/${encodeURIComponent(fileObj.name)}?${sasResponse.token}`;
          
          const response = await fetch(uploadUrl, {
            method: 'PUT',
            body: fileObj,
            headers: {
              'x-ms-blob-type': 'BlockBlob',
              'Content-Type': fileObj.type,
            },
          });
          
          if (!response.ok) {
            const errorMessage = `Upload failed: ${response.statusText || 'Unknown error'}`;
            throw new Error(errorMessage);
          }
          
          const blobUrl = uploadUrl.split('?')[0];
          
          return {
            ...uploadedFile,
            status: 'uploaded' as const,
            progress: 100,
            azureUrl: blobUrl,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          return {
            ...uploadedFile,
            status: 'error' as const,
            progress: 0,
            error: errorMessage,
          };
        }
      });
      
      return await Promise.all(uploadPromises);
    } catch (error) {
      // Return the pending files so the rejected reducer can set them to error status
      return rejectWithValue({
        error: error instanceof Error ? error.message : 'Upload failed',
        pendingFiles: pendingFiles.map((f: UploadedFile) => f.name)
      });
    }
  }
);

// Async thunk for deleting input documents
export const deleteInputDocument = createAsyncThunk(
  'files/deleteInputDocument',
  async ({ clientName, fileName }: { clientName: string; fileName: string }, { rejectWithValue }) => {
    try {
      // Import the API service dynamically to avoid circular dependencies
      const { default: apiService } = await import('../../../services/api');
      
      await apiService.deleteInputDocument(clientName, fileName);
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
    addAzureFiles: (state, action: PayloadAction<UploadedFile[]>) => {
      // Add Azure files without duplicates
      action.payload.forEach(azureFile => {
        const existingIndex = state.files.findIndex(file => file.name === azureFile.name);
        if (existingIndex === -1) {
          state.files.push(azureFile);
        }
      });
    },
    updateFile: (state, action: PayloadAction<{ name: string; updates: Partial<UploadedFile> }>) => {
      const { name, updates } = action.payload;
      const fileIndex = state.files.findIndex(file => file.name === name);
      if (fileIndex !== -1) {
        state.files[fileIndex] = { ...state.files[fileIndex], ...updates };
      }
    },
    updateMultipleFiles: (state, action: PayloadAction<{ names: string[]; updates: Partial<UploadedFile> }>) => {
      const { names, updates } = action.payload;
      names.forEach(name => {
        const fileIndex = state.files.findIndex(file => file.name === name);
        if (fileIndex !== -1) {
          state.files[fileIndex] = { ...state.files[fileIndex], ...updates };
        }
      });
    },
    removeFile: (state, action: PayloadAction<string>) => {
      const fileToRemove = state.files.find(file => file.name === action.payload);
      if (fileToRemove?.fileObjectUrl) {
        revokeFileUrl(fileToRemove.fileObjectUrl);
      }
      state.files = state.files.filter(file => file.name !== action.payload);
    },
    setFileSelection: (state, action: PayloadAction<{ name: string; selected: boolean }>) => {
      const { name, selected } = action.payload;
      const file = state.files.find(f => f.name === name);
      if (file) {
        file.selected = selected;
      }
    },
    setAllFilesSelection: (state, action: PayloadAction<boolean>) => {
      state.files.forEach(file => {
        file.selected = action.payload;
      });
    },
    clearError: (state) => {
      state.error = null;
    },
    clearFiles: (state) => {
      // Revoke all object URLs before clearing
      state.files.forEach(file => {
        if (file.fileObjectUrl) {
          revokeFileUrl(file.fileObjectUrl);
        }
      });
      state.files = [];
      state.error = null;
    },
    resetErrorStatus: (state, action: PayloadAction<string[]>) => {
      // Reset specified files from error status back to pending
      action.payload.forEach(fileName => {
        const fileIndex = state.files.findIndex(f => f.name === fileName);
        if (fileIndex !== -1 && state.files[fileIndex].status === 'error') {
          state.files[fileIndex].status = 'pending';
          state.files[fileIndex].progress = 0;
          state.files[fileIndex].error = undefined;
        }
      });
    },
  },
  extraReducers: (builder) => {
    // Load Azure files
    builder
      .addCase(loadAzureFiles.pending, (state) => {
        state.loadingAzureFiles = true;
        state.error = null;
      })
      .addCase(loadAzureFiles.fulfilled, (state, action) => {
        state.loadingAzureFiles = false;
        state.files = action.payload;
      })
      .addCase(loadAzureFiles.rejected, (state, action) => {
        state.loadingAzureFiles = false;
        state.error = action.payload as string;
      });

    // Upload files to Azure
    builder
      .addCase(uploadFilesToAzure.pending, (state) => {
        state.isUploading = true;
        state.error = null;
        // File status updates are now handled in the thunk itself
      })
      .addCase(uploadFilesToAzure.fulfilled, (state, action) => {
        state.isUploading = false;
        // Update files with upload results
        action.payload.forEach(updatedFile => {
          const fileIndex = state.files.findIndex(f => f.name === updatedFile.name);
          if (fileIndex !== -1) {
            state.files[fileIndex] = updatedFile;
          }
        });
      })
      .addCase(uploadFilesToAzure.rejected, (state, action) => {
        state.isUploading = false;
        
        // Handle the new payload structure
        if (action.payload && typeof action.payload === 'object' && 'error' in action.payload) {
          const payload = action.payload as { error: string; pendingFiles: string[] };
          state.error = payload.error;
          
          // Set uploading files back to error status
          payload.pendingFiles.forEach(fileName => {
            const fileIndex = state.files.findIndex(f => f.name === fileName);
            if (fileIndex !== -1) {
              state.files[fileIndex].status = 'error';
              state.files[fileIndex].progress = 0;
              state.files[fileIndex].error = payload.error;
            }
          });
        } else {
          // Fallback for old payload format
          state.error = action.payload as string;
        }
      });

    // Delete input document
    builder
      .addCase(deleteInputDocument.pending, (state) => {
        // No loading state needed for delete operations
      })
      .addCase(deleteInputDocument.fulfilled, (state, action) => {
        // Remove the file from state after successful deletion
        const fileName = action.payload;
        const fileToRemove = state.files.find(file => file.name === fileName);
        if (fileToRemove?.fileObjectUrl) {
          revokeFileUrl(fileToRemove.fileObjectUrl);
        }
        state.files = state.files.filter(file => file.name !== fileName);
      })
      .addCase(deleteInputDocument.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  addFiles,
  addAzureFiles,
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