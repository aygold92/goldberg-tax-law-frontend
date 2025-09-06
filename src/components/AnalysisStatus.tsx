/**
 * Analysis Status component for monitoring document analysis progress.
 * 
 * This component provides real-time monitoring of document analysis workflows:
 * - Polls analysis status from the backend API
 * - Displays overall progress and individual document status
 * - Shows runtime status (Running, Completed, Failed)
 * - Tracks statement processing progress
 * - Provides visual indicators for different status types
 * 
 * Features include:
 * - Automatic polling every 5 seconds during analysis
 * - Progress bars for overall and per-document progress
 * - Status icons and color-coded chips
 * - Timestamp display for start and update times
 * - Error handling and loading states
 * - Automatic completion detection and callback
 * 
 * Used to provide users with real-time feedback during document processing.
 * Uses Redux for centralized state management.
 */

import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
} from '@mui/material';
import { CheckCircle, Error, Pending, CloudUpload } from '@mui/icons-material';
import { COLORS } from '../styles/constants';
import styles from '../styles/components/AnalysisStatus.module.css';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { 
  selectCurrentStatus, 
  selectIsPolling, 
  selectPollingError,
  selectStatusQueryUrl,
  selectIsAnalysisComplete,
  selectIsAnalysisSuccessful,
  selectAnalysisProgress,
  selectAnalysisRuntimeStatus,
  selectAnalysisCustomStatus,
  selectAnalysisOutput
} from '../redux/features/analysis/analysisSelectors';
import { pollAnalysisStatus, setPolling } from '../redux/features/analysis/analysisSlice';

interface AnalysisStatusProps {
  statusQueryUrl: string;
  onAnalysisComplete: () => void;
}

const AnalysisStatus: React.FC<AnalysisStatusProps> = ({ statusQueryUrl, onAnalysisComplete }) => {
  const dispatch = useAppDispatch();
  
  // Redux state
  const currentStatus = useAppSelector(selectCurrentStatus);
  const isPolling = useAppSelector(selectIsPolling);
  const pollingError = useAppSelector(selectPollingError);
  const isComplete = useAppSelector(selectIsAnalysisComplete);
  const isSuccessful = useAppSelector(selectIsAnalysisSuccessful);
  const progress = useAppSelector(selectAnalysisProgress);
  const runtimeStatus = useAppSelector(selectAnalysisRuntimeStatus);
  const customStatus = useAppSelector(selectAnalysisCustomStatus);
  const output = useAppSelector(selectAnalysisOutput);

  useEffect(() => {
    startPolling();
    return () => {
      dispatch(setPolling(false));
    };
  }, [statusQueryUrl, dispatch]);

  useEffect(() => {
    // Check if analysis is complete and call callback
    if (isComplete && isSuccessful) {
      onAnalysisComplete();
    }
  }, [isComplete, isSuccessful, onAnalysisComplete]);

  const startPolling = () => {
    // Poll immediately
    pollStatus();
    
    // Then poll every 5 seconds
    const interval = setInterval(() => {
      if (!isComplete) {
        pollStatus();
      } else {
        clearInterval(interval);
        dispatch(setPolling(false));
      }
    }, 5000);

    // Cleanup interval on unmount
    return () => {
      clearInterval(interval);
      dispatch(setPolling(false));
    };
  };

  const pollStatus = async () => {
    try {
      await dispatch(pollAnalysisStatus(statusQueryUrl)).unwrap();
    } catch (error) {
      console.error('Status polling error:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle color="success" />;
      case 'Failed':
        return <Error color="error" />;
      case 'Running':
        return <CircularProgress size={20} />;
      default:
        return <Pending color="warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'Failed':
        return 'error';
      case 'Running':
        return 'primary';
      default:
        return 'warning';
    }
  };

  if (isPolling && !currentStatus) {
    return (
      <Box className={styles.loadingContainer}>
        <CircularProgress />
      </Box>
    );
  }

  if (pollingError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {pollingError}
      </Alert>
    );
  }

  if (!currentStatus) {
    return null;
  }

  return (
    <Box className={styles.container}>
      <Typography variant="h4" gutterBottom>
        Analysis Status
      </Typography>

      {/* Overall Status */}
      <Paper className={styles.statusPaper}>
        <Box className={styles.statusHeader}>
          {getStatusIcon(runtimeStatus || 'Pending')}
          <Typography variant="h6">
            {runtimeStatus || 'Pending'}
          </Typography>
          <Chip
            label={runtimeStatus || 'Pending'}
            color={getStatusColor(runtimeStatus || 'Pending') as any}
            size="small"
          />
        </Box>

        {customStatus && (
          <Box className={styles.progressContainer}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Stage: {customStatus.stage}
            </Typography>
            <Box className={styles.progressRow}>
              <Typography variant="body2">
                Progress: {customStatus.statementsCompleted} / {customStatus.totalStatements} statements
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progress}
                className={styles.progressBar}
              />
              <Typography variant="body2">
                {Math.round(progress)}%
              </Typography>
            </Box>
          </Box>
        )}

        <Typography variant="body2" color="text.secondary">
          Started: {new Date(currentStatus.createdTime).toLocaleString()}
        </Typography>
        {currentStatus.lastUpdatedTime && (
          <Typography variant="body2" color="text.secondary">
            Last Updated: {new Date(currentStatus.lastUpdatedTime).toLocaleString()}
          </Typography>
        )}
      </Paper>

      {/* Document Details */}
      {customStatus && Object.keys(customStatus.documents).length > 0 && (
        <Paper className={styles.detailsPaper}>
          <Typography variant="h6" gutterBottom>
            Document Details
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(customStatus.documents).map(([filename, docStatus]) => (
              <Grid item xs={12} md={6} key={filename}>
                <Card variant="outlined">
                  <CardContent>
                    <Box className={styles.documentHeader}>
                      <CloudUpload />
                      <Typography variant="subtitle2" noWrap>
                        {filename}
                      </Typography>
                    </Box>
                    <Box className={styles.documentFooter}>
                      <Typography variant="body2" color="text.secondary">
                        Statements: {docStatus.statementsCompleted} / {docStatus.numStatements}
                      </Typography>
                      <Chip
                        label={docStatus.classified ? 'Classified' : 'Pending'}
                        color={docStatus.classified ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Error Output */}
      {output?.errorMessage && (
        <Alert severity="error" className={styles.errorAlert}>
          <Typography variant="subtitle2" gutterBottom>
            Analysis Error:
          </Typography>
          <Typography variant="body2">
            {output.errorMessage}
          </Typography>
        </Alert>
      )}

      {/* Success Output */}
      {output?.result && runtimeStatus === 'Completed' && (
        <Alert severity="success" className={styles.successAlert}>
          <Typography variant="subtitle2" gutterBottom>
            Analysis Complete:
          </Typography>
          <Typography variant="body2">
            Documents have been successfully analyzed and processed.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default AnalysisStatus; 