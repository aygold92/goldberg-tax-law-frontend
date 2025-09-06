/**
 * Document Upload component for managing PDF document uploads and analysis.
 * 
 * This component provides comprehensive document management functionality:
 * - Drag-and-drop file upload with PDF validation
 * - Azure Blob Storage integration for file storage
 * - Duplicate file handling with user choice (overwrite/rename/cancel)
 * - File status tracking (pending, uploading, uploaded, error, azure)
 * - Document analysis initiation and progress tracking
 * - File metadata display and management
 * 
 * Features include:
 * - Integration with Azure Storage using SAS tokens
 * - Real-time upload progress tracking
 * - File selection and batch operations
 * - Error handling and retry mechanisms
 * - Support for both local uploads and existing Azure files
 * - DataGrid for file management with sorting and filtering
 * 
 * Handles the complete workflow from file upload to analysis initiation.
 * Uses Redux for centralized state management.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridValueGetter } from '@mui/x-data-grid';
import { CloudUpload, Delete, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { COLORS } from '../styles/constants';
import styles from '../styles/components/DocumentUpload.module.css';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { 
  selectFiles, 
  selectIsUploading, 
  selectIsAnalyzing, 
  selectLoadingAzureFiles, 
  selectFilesError,
  selectHasPendingFiles,
  selectHasSelectedFiles
} from '../redux/features/files/filesSelectors';
import { 
  addFiles, 
  addAzureFiles,
  updateFile, 
  removeFile, 
  setFileSelection, 
  setAllFilesSelection, 
  clearError,
  uploadFiles,
  uploadFilesToAzure,
  deleteInputDocument,
  loadAzureFiles,
  convertFileToUploadedFile,
  convertObjectUrlToFile
} from '../redux/features/files/filesSlice';
import { startAnalysis } from '../redux/features/analysis/analysisSlice';

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

interface DocumentUploadProps {
  selectedClient: string;
  onAnalysisStarted: (statusQueryUrl: string) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ selectedClient, onAnalysisStarted }) => {
  const dispatch = useAppDispatch();
  
  // Redux state
  const files = useAppSelector(selectFiles);
  const isUploading = useAppSelector(selectIsUploading);
  const isAnalyzing = useAppSelector(selectIsAnalyzing);
  const loadingAzureFiles = useAppSelector(selectLoadingAzureFiles);
  const error = useAppSelector(selectFilesError);
  const hasPendingFiles = useAppSelector(selectHasPendingFiles);
  const hasSelectedFiles = useAppSelector(selectHasSelectedFiles);
  
  // Local state for UI interactions
  const [selectionModel, setSelectionModel] = useState<string[]>([]);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateFile, setDuplicateFile] = useState<File | null>(null);
  const [pendingFilesQueue, setPendingFilesQueue] = useState<File[]>([]);

  // Helper to generate a new filename if needed
  const getUniqueFilename = (base: string, existingNames: Set<string>) => {
    if (!existingNames.has(base)) return base;
    const extIdx = base.lastIndexOf('.');
    const name = extIdx !== -1 ? base.slice(0, extIdx) : base;
    const ext = extIdx !== -1 ? base.slice(extIdx) : '';
    let i = 1;
    let newName = `${name} (${i})${ext}`;
    while (existingNames.has(newName)) {
      i++;
      newName = `${name} (${i})${ext}`;
    }
    return newName;
  };

  // Fetch previously uploaded files from Azure on client change
  useEffect(() => {
    if (!selectedClient) return;
    
    dispatch(clearError());
    
    // Load Azure files using async thunk
    dispatch(loadAzureFiles(selectedClient));
  }, [selectedClient, dispatch]);

  // Modified onDrop to handle duplicates
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const existingNames = new Set(files.map(f => f.name));
    const nonDuplicates: File[] = [];
    const duplicates: File[] = [];
    
    for (const file of acceptedFiles) {
      if (existingNames.has(file.name)) {
        duplicates.push(file);
      } else {
        nonDuplicates.push(file);
      }
    }
    
    // Add all non-duplicate files immediately
    if (nonDuplicates.length > 0) {
      const uploadedFiles = nonDuplicates.map(convertFileToUploadedFile);
      dispatch(addFiles(uploadedFiles));
    }
    
    // If there are duplicates, prompt for the first one
    if (duplicates.length > 0) {
      setDuplicateFile(duplicates[0]);
      setPendingFilesQueue(duplicates.slice(1));
      setDuplicateDialogOpen(true);
    }
  }, [files, dispatch]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: true,
  });

  // Handle upload using Redux async thunk
  const handleUpload = async () => {
    try {
      await dispatch(uploadFilesToAzure({ selectedClient })).unwrap();
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  // Handle duplicate dialog actions
  const handleDuplicateAction = (action: 'overwrite' | 'rename' | 'cancel') => {
    if (!duplicateFile) return;
    
    const existingNames = new Set(files.map(f => f.name));
    
    if (action === 'overwrite') {
      // Remove existing file and add new one
      dispatch(removeFile(duplicateFile.name));
      const uploadedFile = convertFileToUploadedFile(duplicateFile);
      dispatch(addFiles([uploadedFile]));
    } else if (action === 'rename') {
      const uniqueName = getUniqueFilename(duplicateFile.name, existingNames);
      const renamedFile = new File([duplicateFile], uniqueName, { type: duplicateFile.type });
      const uploadedFile = convertFileToUploadedFile(renamedFile);
      dispatch(addFiles([uploadedFile]));
    }
    // If cancel, do nothing
    
    setDuplicateDialogOpen(false);
    setDuplicateFile(null);
    
    // If there are more files in the queue, process them
    if (pendingFilesQueue.length > 0) {
      onDrop(pendingFilesQueue);
      setPendingFilesQueue([]);
    }
  };

  const handleStartAnalysis = async () => {
    const selectedFiles = files.filter(file => file.selected && (file.status === 'uploaded' || file.status === 'azure'));
    if (selectedFiles.length === 0) return;
    
    try {
      const documentFilenames = selectedFiles.map(file => file.name);
      const result = await dispatch(startAnalysis({ 
        clientName: selectedClient, 
        documentFilenames 
      })).unwrap();
      
      // Call the callback with the status query URL
      onAnalysisStarted(result.statusQueryUrl);
    } catch (error: any) {
      console.error('Analysis error:', error);
    }
  };

  // Delete handler for files
  const handleDelete = async (file: any) => {
    try {
      // For uploaded/azure files, call the API to delete from Azure
      if (file.status === 'uploaded' || file.status === 'azure') {
        await dispatch(deleteInputDocument({ 
          clientName: selectedClient, 
          fileName: file.name 
        })).unwrap();
      } else {
        // For local files, just remove from Redux state
        dispatch(removeFile(file.name));
      }
    } catch (error: any) {
      console.error('Failed to delete file:', error);
    }
  };

  // DataGrid columns
  const numStatementsGetter: GridValueGetter<any> = (value, row) => row.metadata?.numstatements ?? '';
  const statementsGetter: GridValueGetter<any> = (value, row) => (row.metadata?.statements ? row.metadata.statements.join(', ') : '');

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Filename',
      flex: 2,
      renderCell: (params: GridRenderCellParams<any, any>) => (
        <Tooltip
          title={<span style={{ userSelect: 'text' }}>{params.value}</span>}
          placement="top"
          arrow
        >
          <span className={styles.filenameCell}>
            {params.value}
          </span>
        </Tooltip>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      renderCell: (params: GridRenderCellParams<any, any>) => {
        const status = params.row.status === 'azure' ? 'uploaded' : params.row.status;
        if (status === 'pending') return <Chip label="Pending upload" color="default" size="small" />;
        if (status === 'uploading') return <Chip label="Uploading" color="info" size="small" icon={<CircularProgress size={16} />} />;
        if (status === 'uploaded') return <Chip label="Uploaded" color="success" size="small" icon={<CheckCircle />} />;
        if (status === 'error') return <Chip label="Error" color="error" size="small" icon={<ErrorIcon />} />;
        return null;
      },
    },
    { field: 'classified', headerName: 'Classified', flex: 1, renderCell: (params: GridRenderCellParams<any, any>) => {
      const classified = params.row.metadata?.classified;
      return classified ? <Chip label="Classified" color="success" size="small" /> : <Chip label="Not Classified" color="warning" size="small" />;
    } },
    { field: 'numstatements', headerName: '# Statements', flex: 1, valueGetter: numStatementsGetter },
    { field: 'statements', headerName: 'Statements', flex: 2, valueGetter: statementsGetter },
    { field: 'actions', headerName: '', flex: 0.5, sortable: false, filterable: false, renderCell: (params: GridRenderCellParams<any, any>) => (
      <IconButton onClick={() => handleDelete(params.row)}>
        <Delete />
      </IconButton>
    ) },
  ];

  // DataGrid rows
  const rows = files.map((file) => ({ id: file.name, ...file }));

  // Only allow analysis for selected files that are uploaded or in Azure
  const canAnalyze = selectionModel.length > 0 && selectionModel.every(id => {
    const file = files.find(f => f.name === id);
    return file && (file.status === 'uploaded' || file.status === 'azure');
  });

  const handleSelectionModelChange = (newSelection: any) => {
    setSelectionModel(newSelection);
    
    // Update file selection in Redux
    files.forEach(file => {
      const isSelected = newSelection.includes(file.name);
      if (file.selected !== isSelected) {
        dispatch(setFileSelection({ name: file.name, selected: isSelected }));
      }
    });
  };

  return (
    <Box className={styles.uploadContainer}>
      <Paper elevation={4} className={styles.uploadPaper}>
        <Typography variant="h4" fontWeight={700} gutterBottom className={styles.uploadTitle}>
          Upload Documents
        </Typography>
        <Paper
          {...getRootProps()}
          elevation={0}
          className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : styles.dropzoneInactive}`}
        >
          <input {...getInputProps()} />
          <CloudUpload className={`${styles.uploadIcon} ${isDragActive ? styles.uploadIconActive : styles.uploadIconInactive}`} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            {isDragActive ? 'Drop files here' : 'Drag & drop PDF files or click to select'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Only PDF files are supported
          </Typography>
        </Paper>
        
        {/* Duplicate file dialog */}
        <Dialog open={duplicateDialogOpen} onClose={() => handleDuplicateAction('cancel')}>
          <DialogTitle>Duplicate File Detected</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              A file named <b>{duplicateFile?.name}</b> already exists. What would you like to do?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleDuplicateAction('overwrite')} color="primary" variant="contained">Overwrite</Button>
            <Button onClick={() => handleDuplicateAction('rename')} color="secondary" variant="contained">Keep Both (Rename)</Button>
            <Button onClick={() => handleDuplicateAction('cancel')} variant="outlined">Cancel</Button>
          </DialogActions>
        </Dialog>
        
        <Box className={styles.dataGridContainer}>
          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            checkboxSelection
            disableRowSelectionOnClick
            rowSelectionModel={selectionModel}
            onRowSelectionModelChange={handleSelectionModelChange}
            density="comfortable"
            className={styles.dataGrid}
          />
        </Box>
        
        <Box className={styles.actionsContainer}>
          <Button
            variant="contained"
            size="large"
            className={styles.actionButton}
            onClick={handleUpload}
            disabled={!hasPendingFiles || isUploading || isAnalyzing}
            startIcon={<CloudUpload />}
          >
            {isUploading ? 'Uploading...' : 'Upload to Azure'}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            className={styles.actionButton}
            onClick={handleStartAnalysis}
            disabled={!canAnalyze || isAnalyzing}
          >
            {isAnalyzing ? 'Starting Analysis...' : 'Start Analysis'}
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default DocumentUpload; 