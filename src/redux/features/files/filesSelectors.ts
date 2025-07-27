/**
 * Files selectors for Redux state access.
 * 
 * These selectors provide type-safe access to file management state:
 * - List of uploaded files with their metadata
 * - File upload progress and status tracking
 * - File selection state for batch operations
 * - Error handling for upload failures
 * 
 * Using these selectors ensures consistent state access patterns
 * and provides better TypeScript support.
 */

import { RootState } from '../../store';
import { UploadedFile } from './filesSlice';

// Basic selectors
export const selectFiles = (state: RootState) => state.files.files;
export const selectIsUploading = (state: RootState) => state.files.isUploading;
export const selectIsAnalyzing = (state: RootState) => state.files.isAnalyzing;
export const selectLoadingAzureFiles = (state: RootState) => state.files.loadingAzureFiles;
export const selectFilesError = (state: RootState) => state.files.error;

// Derived selectors
export const selectPendingFiles = (state: RootState) => 
  state.files.files.filter(file => file.status === 'pending');

export const selectUploadedFiles = (state: RootState) => 
  state.files.files.filter(file => file.status === 'uploaded' || file.status === 'azure');

export const selectSelectedFiles = (state: RootState) => 
  state.files.files.filter(file => file.selected);

export const selectFilesWithErrors = (state: RootState) => 
  state.files.files.filter(file => file.status === 'error');

export const selectHasFiles = (state: RootState) => 
  state.files.files.length > 0;

export const selectHasSelectedFiles = (state: RootState) => 
  state.files.files.some(file => file.selected);

export const selectHasPendingFiles = (state: RootState) => 
  state.files.files.some(file => file.status === 'pending');

export const selectTotalFiles = (state: RootState) => 
  state.files.files.length;

export const selectSelectedFilesCount = (state: RootState) => 
  state.files.files.filter(file => file.selected).length; 