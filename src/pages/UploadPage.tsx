/**
 * Upload Page component for document upload and analysis workflow.
 * 
 * This page orchestrates the complete document processing workflow:
 * - Client selection and management
 * - Document upload to Azure Blob Storage
 * - Analysis initiation and progress monitoring
 * - State management for the upload-to-analysis pipeline
 * 
 * Features include:
 * - Persistent client selection using localStorage
 * - Conditional rendering based on workflow state
 * - Integration of ClientSelector, DocumentUpload, and AnalysisStatus components
 * - Success notifications upon analysis completion
 * - User guidance through the upload process
 * 
 * Serves as the main entry point for document processing in the application.
 */

import React, { useState, useEffect } from 'react';
import { Box, Alert, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import ClientSelector from '../components/ClientSelector';
import DocumentUpload from '../components/DocumentUpload';
import AnalysisStatus from '../components/AnalysisStatus';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectSelectedClient } from '../redux/features/client/clientSelectors';
import { clearAnalysisResults } from '../redux/features/analysis/analysisSlice';
import { usePageTitle } from '../hooks/usePageTitle';
import { COLORS } from '../styles/constants';
import styles from '../styles/components/UploadPage.module.css';

const UploadPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedClient = useAppSelector(selectSelectedClient);
  const [statusQueryUrl, setStatusQueryUrl] = useState<string>('');
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const { setPageTitle } = usePageTitle();

  // Set page title
  useEffect(() => {
    setPageTitle('Upload Documents');
  }, [setPageTitle]);

  // handleClientChange and setSelectedClient are no longer needed

  const handleAnalysisStarted = (url: string) => {
    setStatusQueryUrl(url);
    setAnalysisComplete(false);
  };

  const handleAnalysisComplete = () => {
    setAnalysisComplete(true);
  };

  const handleBackToUpload = () => {
    setStatusQueryUrl('');
    setAnalysisComplete(false);
    dispatch(clearAnalysisResults());
  };

  return (
    <Box>
      <ClientSelector />
      {!selectedClient && (
        <Alert severity="info">
          Please select a client to continue with document upload and analysis.
        </Alert>
      )}
      {selectedClient && !statusQueryUrl && (
        <DocumentUpload
          selectedClient={selectedClient as string}
          onAnalysisStarted={handleAnalysisStarted}
        />
      )}
      {statusQueryUrl && (
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleBackToUpload}
            sx={{ mb: 2 }}
          >
            Back to Upload
          </Button>
          <AnalysisStatus
            statusQueryUrl={statusQueryUrl}
            onAnalysisComplete={handleAnalysisComplete}
          />
        </Box>
      )}
      {analysisComplete && (
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleBackToUpload}
            sx={{ mb: 2 }}
          >
            Back to Upload
          </Button>
          <Alert severity="success" className={styles.successAlert}>
            Analysis completed successfully! You can now view the extracted statements.
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default UploadPage; 