import React from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Snackbar,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import { PlayArrow, SelectAll, Clear } from '@mui/icons-material';

// Import existing hooks from DocumentClassificationEditor
import { useDocumentClassifications } from '../DocumentClassificationEditor/hooks/useDocumentClassifications';
import { useAnalyzePage } from '../DocumentClassificationEditor/hooks/useAnalyzePage';
import { useSnackbar } from '../DocumentClassificationEditor/hooks/useSnackbar';

// Import new selection hook
import { useSelection } from './hooks/useSelection';
import { useDocumentDataModel } from './hooks/useDocumentDataModel';

// Import components
import SelectionBadge from './components/SelectionBadge';
import AnalyzePageResult from '../DocumentClassificationEditor/components/AnalyzePageResult';
import DocumentDataModelResult from './components/DocumentDataModelResult';
import styles from './AnalyzePagesSelector.module.css';

interface AnalyzePagesSelectorProps {
  clientName: string;
  filename: string;
  onAnalysisComplete?: (result: any) => void;
}

/**
 * AnalyzePagesSelector - A component for selecting and analyzing document classifications
 * 
 * Features:
 * - Load existing classifications from API
 * - Select/deselect classifications by clicking
 * - Analyze selected classifications via AnalyzePage API
 * - Display analysis results
 * - Snackbar notifications for user feedback
 */
const AnalyzePagesSelector: React.FC<AnalyzePagesSelectorProps> = ({
  clientName,
  filename,
  onAnalysisComplete,
}) => {
  // Custom hooks
  const {
    classifications,
    loading,
    error,
  } = useDocumentClassifications(clientName, filename);

  const {
    selectedClassifications,
    selectionCount,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
  } = useSelection();

  const {
    analyzePageResult,
    analyzePageLoading,
    error: analyzeError,
    analyzePages,
    clearResults,
  } = useAnalyzePage();

  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSnackbar,
    closeSnackbar,
  } = useSnackbar();

  const {
    dataModelResult,
    loading: dataModelLoading,
    error: dataModelError,
    getDocumentDataModel,
    clearResults: clearDataModelResults,
  } = useDocumentDataModel();

  // Handle analyzing selected classifications
  const handleAnalyze = async () => {
    if (selectedClassifications.length === 0) {
      showSnackbar('Please select at least one classification to analyze', 'error');
      return;
    }

    clearResults();
    const success = await analyzePages(selectedClassifications, clientName);
    
    if (success) {
      showSnackbar('Page analysis completed successfully!', 'success');
      if (onAnalysisComplete) {
        onAnalysisComplete(analyzePageResult);
      }
    } else {
      showSnackbar('Failed to analyze pages', 'error');
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    selectAll(classifications);
  };

  // Handle clear selection
  const handleClearSelection = () => {
    clearSelection();
  };

  // Handle fetching document data model for a classification
  const handleFetchDataModel = async (classification: any) => {
    clearDataModelResults();
    const success = await getDocumentDataModel(
      clientName,
      filename,
      classification.pages
    );
    
    if (success) {
      showSnackbar('Document data model loaded successfully!', 'success');
    } else {
      showSnackbar('Failed to load document data model', 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card className={styles.card}>
      <CardHeader
        title="Analyze Pages Selector"
        subheader={`File: ${filename}`}
        action={
          <Box className={styles.headerActions}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SelectAll />}
              onClick={handleSelectAll}
              disabled={classifications.length === 0}
            >
              Select All
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Clear />}
              onClick={handleClearSelection}
              disabled={selectionCount === 0}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              startIcon={analyzePageLoading ? <CircularProgress size={16} /> : <PlayArrow />}
              onClick={handleAnalyze}
              disabled={analyzePageLoading || selectionCount === 0}
              size="small"
            >
              {analyzePageLoading ? 'Analyzing...' : `Analyze (${selectionCount})`}
            </Button>
          </Box>
        }
        className={styles.cardHeader}
      />
      
      <CardContent className={styles.cardContent}>

      {/* Error messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 1, py: 0.5 }}>
          {error}
        </Alert>
      )}

      {/* Selection info */}
      {selectionCount > 0 && (
        <Alert severity="info" sx={{ mb: 1, py: 0.5 }}>
          {selectionCount} classification{selectionCount !== 1 ? 's' : ''} selected for analysis
        </Alert>
      )}

      {/* Classifications list */}
      {classifications.length > 0 ? (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            Classifications ({classifications.length}):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {classifications.map((classification, index) => (
              <SelectionBadge
                key={`classification-${index}`}
                classification={classification}
                isSelected={isSelected(classification)}
                onToggle={() => toggleSelection(classification)}
                onFetchDataModel={handleFetchDataModel}
              />
            ))}
          </Box>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
          No classifications found
        </Typography>
      )}

      {/* AnalyzePage result display */}
      <AnalyzePageResult
        result={analyzePageResult}
        loading={analyzePageLoading}
        error={analyzeError}
      />

      {/* Document Data Model result display */}
      <DocumentDataModelResult
        result={dataModelResult}
        loading={dataModelLoading}
        error={dataModelError}
      />

      {/* Snackbar notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={closeSnackbar} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      </CardContent>
    </Card>
  );
};

export default AnalyzePagesSelector;
