import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Checkbox,
  FormControlLabel,
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { CloudUpload, Delete, CheckCircle, Error as ErrorIcon, Refresh, Refresh as RefreshIcon, Visibility } from '@mui/icons-material';
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
} from '../redux/features/files/filesSelectors';
import {
  addFiles,
  updateFile,
  removeFile,
  setFileSelection,
  clearError,
  uploadAndRegisterFiles,
  deleteInputDocument,
  loadInputDocuments,
  convertFileToUploadedFile,
  resetErrorStatus
} from '../redux/features/files/filesSlice';
import { startAnalysis } from '../redux/features/analysis/analysisSlice';
import { selectAnalysisError } from '../redux/features/analysis/analysisSelectors';

interface DocumentUploadProps {
  clientId: string;
  clientName: string;
  onAnalysisStarted: (statusQueryUrl: string) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ clientId, clientName, onAnalysisStarted }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const files = useAppSelector(selectFiles);
  const isUploading = useAppSelector(selectIsUploading);
  const isAnalyzing = useAppSelector(selectIsAnalyzing);
  const loadingAzureFiles = useAppSelector(selectLoadingAzureFiles);
  const error = useAppSelector(selectFilesError);
  const analysisError = useAppSelector(selectAnalysisError);
  const hasPendingFiles = useAppSelector(selectHasPendingFiles);

  const [selectionModel, setSelectionModel] = useState<string[]>([]);
  const [forceReanalysis, setForceReanalysis] = useState(false);
  const [forceRecreate, setForceRecreate] = useState(false);
  const [replaceOnRecreate, setReplaceOnRecreate] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateFile, setDuplicateFile] = useState<File | null>(null);
  const [pendingFilesQueue, setPendingFilesQueue] = useState<File[]>([]);

  const getUniqueFilename = (base: string, existingNames: Set<string>) => {
    if (!existingNames.has(base)) return base;
    const extIdx = base.lastIndexOf('.');
    const name = extIdx !== -1 ? base.slice(0, extIdx) : base;
    const ext = extIdx !== -1 ? base.slice(extIdx) : '';
    let i = 1;
    let newName = `${name} (${i})${ext}`;
    while (existingNames.has(newName)) { i++; newName = `${name} (${i})${ext}`; }
    return newName;
  };

  useEffect(() => {
    if (!clientId) return;
    dispatch(clearError());
    dispatch(loadInputDocuments(clientId));
  }, [clientId, dispatch]);

  useEffect(() => {
    const selectedFileNames = files.filter(file => file.selected).map(file => file.name);
    if (JSON.stringify(selectedFileNames.sort()) !== JSON.stringify(selectionModel.sort())) {
      setSelectionModel(selectedFileNames);
    }
  }, [files, selectionModel]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const existingNames = new Set(files.map(f => f.name));
    const nonDuplicates: File[] = [];
    const duplicates: File[] = [];

    for (const file of acceptedFiles) {
      if (existingNames.has(file.name)) duplicates.push(file);
      else nonDuplicates.push(file);
    }

    if (nonDuplicates.length > 0) {
      dispatch(addFiles(nonDuplicates.map(convertFileToUploadedFile)));
    }

    if (duplicates.length > 0) {
      setDuplicateFile(duplicates[0]);
      setPendingFilesQueue(duplicates.slice(1));
      setDuplicateDialogOpen(true);
    }
  }, [files, dispatch]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  });

  const handleUpload = async () => {
    try {
      await dispatch(uploadAndRegisterFiles({ clientId })).unwrap();
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleDuplicateAction = (action: 'overwrite' | 'rename' | 'cancel') => {
    if (!duplicateFile) return;
    const existingNames = new Set(files.map(f => f.name));

    if (action === 'overwrite') {
      dispatch(removeFile(duplicateFile.name));
      dispatch(addFiles([convertFileToUploadedFile(duplicateFile)]));
    } else if (action === 'rename') {
      const uniqueName = getUniqueFilename(duplicateFile.name, existingNames);
      const renamedFile = new File([duplicateFile], uniqueName, { type: duplicateFile.type });
      dispatch(addFiles([convertFileToUploadedFile(renamedFile)]));
    }

    setDuplicateDialogOpen(false);
    setDuplicateFile(null);

    if (pendingFilesQueue.length > 0) {
      onDrop(pendingFilesQueue);
      setPendingFilesQueue([]);
    }
  };

  const handleStartAnalysis = async () => {
    const selectedFiles = files.filter(file => file.selected && (file.status === 'uploaded' || file.status === 'azure'));
    if (selectedFiles.length === 0) return;

    try {
      const files = selectedFiles
        .filter((f): f is typeof f & { fileId: string } => !!f.fileId)
        .map(f => ({ fileId: f.fileId, fileName: f.name }));
      const processingOptions = (forceReanalysis || forceRecreate || replaceOnRecreate)
        ? { forceReanalysis, forceRecreate, replaceOnRecreate }
        : undefined;
      const result = await dispatch(startAnalysis({ clientId, files, processingOptions })).unwrap();
      onAnalysisStarted(result.statusQueryUrl);
    } catch (error: any) {
      console.error('Analysis error:', error);
    }
  };

  const handleDelete = async (file: any) => {
    try {
      if ((file.status === 'uploaded' || file.status === 'azure') && file.fileId) {
        await dispatch(deleteInputDocument({ fileId: file.fileId, fileName: file.name })).unwrap();
      } else {
        dispatch(removeFile(file.name));
      }
    } catch (error: any) {
      console.error('Failed to delete file:', error);
    }
  };

  const handleResetErrorStatus = (file: any) => {
    dispatch(resetErrorStatus([file.name]));
  };

  const handleViewFile = (file: any) => {
    if (file.fileId) {
      navigate(`/view-file?fileId=${encodeURIComponent(file.fileId)}`);
    }
  };

  const handleRefresh = async () => {
    if (!clientId) return;
    try {
      dispatch(clearError());
      await dispatch(loadInputDocuments(clientId)).unwrap();
    } catch (error) {
      console.error('Failed to refresh documents:', error);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Filename',
      flex: 2,
      renderCell: (params: GridRenderCellParams<any, any>) => (
        <Tooltip title={<span style={{ userSelect: 'text' }}>{params.value}</span>} placement="top" arrow>
          <span className={styles.filenameCell}>{params.value}</span>
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
        if (status === 'error') {
          return (
            <Tooltip title={params.row.error || 'Upload failed'} placement="top" arrow>
              <Chip label="Error" color="error" size="small" icon={<ErrorIcon />} />
            </Tooltip>
          );
        }
        return null;
      },
    },
    {
      field: 'numStatements',
      headerName: '# Statements',
      flex: 1,
      valueGetter: (_value: any, row: any) => row.inputFileSummary?.numStatements ?? '',
    },
    {
      field: 'numAnalyzed',
      headerName: '# Analyzed',
      flex: 1,
      valueGetter: (_value: any, row: any) => row.inputFileSummary?.numAnalyzed ?? '',
    },
    {
      field: 'actions',
      headerName: '',
      flex: 0.5,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<any, any>) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {params.row.status === 'error' && (
            <Tooltip title="Reset to pending" placement="top" arrow>
              <IconButton onClick={() => handleResetErrorStatus(params.row)} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
          )}
          {(params.row.status === 'azure' || params.row.status === 'uploaded') && params.row.fileId && (
            <Tooltip title="View file data" placement="top" arrow>
              <IconButton onClick={() => handleViewFile(params.row)} size="small">
                <Visibility />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete file" placement="top" arrow>
            <IconButton onClick={() => handleDelete(params.row)} size="small">
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const rows = files.map((file) => ({ id: file.name, ...file }));

  const canAnalyze = selectionModel.length > 0 && selectionModel.every(id => {
    const file = files.find(f => f.name === id);
    return file && (file.status === 'uploaded' || file.status === 'azure');
  });

  const handleSelectionModelChange = (newSelection: any) => {
    setSelectionModel(newSelection);
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
            variant="outlined"
            size="large"
            className={styles.actionButton}
            onClick={handleRefresh}
            disabled={!clientId || loadingAzureFiles || isUploading || isAnalyzing}
            startIcon={<RefreshIcon />}
          >
            {loadingAzureFiles ? 'Refreshing...' : 'Refresh Documents'}
          </Button>
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
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
            Analysis options:
          </Typography>
          <FormControlLabel
            control={<Checkbox size="small" checked={forceReanalysis} onChange={e => setForceReanalysis(e.target.checked)} />}
            label={<Typography variant="caption">Force reanalysis</Typography>}
          />
          <FormControlLabel
            control={<Checkbox size="small" checked={forceRecreate} onChange={e => setForceRecreate(e.target.checked)} />}
            label={<Typography variant="caption">Force recreate</Typography>}
          />
          <FormControlLabel
            control={<Checkbox size="small" checked={replaceOnRecreate} onChange={e => setReplaceOnRecreate(e.target.checked)} disabled={!forceRecreate} />}
            label={<Typography variant="caption">Replace on recreate</Typography>}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {analysisError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to start analysis: {analysisError}
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default DocumentUpload;
