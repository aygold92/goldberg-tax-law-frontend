import React, { useState } from 'react';
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
import { PlayArrow, SelectAll, Clear, Transform } from '@mui/icons-material';

// Import existing hooks from DocumentClassificationEditor
import { useDocumentClassifications } from '../DocumentClassificationEditor/hooks/useDocumentClassifications';
import { useAnalyzePage } from '../DocumentClassificationEditor/hooks/useAnalyzePage';
import { useSnackbar } from '../DocumentClassificationEditor/hooks/useSnackbar';

// Import new selection hook
import { useSelection } from './hooks/useSelection';
import { useDocumentDataModel } from './hooks/useDocumentDataModel';
import { useConvertToStatement } from './hooks/useConvertToStatement';

// Import components
import SelectionBadge from './components/SelectionBadge';
import AnalyzePageResult from '../DocumentClassificationEditor/components/AnalyzePageResult';
import DocumentDataModelResult from './components/DocumentDataModelResult';
import ConvertToStatementResult from './components/ConvertToStatementResult';
import { DocumentDataModelEditor } from '../DocumentDataModelEditor';
import styles from './AnalyzePagesSelector.module.css';
import { ClassifiedPdfMetadata } from '../../types/bankStatement';

interface AnalyzePagesSelectorProps {
  fileId: string;
  clientId: string;
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
  fileId,
  clientId,
  onAnalysisComplete,
}) => {
  // Custom hooks
  const {
    classifications,
    loading,
    error,
  } = useDocumentClassifications(fileId);

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

  const {
    convertResult,
    loading: convertLoading,
    error: convertError,
    convertToStatement: convertToStatementHook,
    clearResults: clearConvertResults,
  } = useConvertToStatement();

  // Local state to store accumulated convert results
  const [accumulatedConvertResults, setAccumulatedConvertResults] = useState<any[]>([]);

  // State for the data model editor dialog
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorPdfMetadata, setEditorPdfMetadata] = useState<ClassifiedPdfMetadata | null>(null);

  // Handle analyzing selected classifications
  const handleAnalyze = async () => {
    if (selectedClassifications.length === 0) {
      showSnackbar('Please select at least one classification to analyze', 'error');
      return;
    }

    clearResults();
    const success = await analyzePages(selectedClassifications);
    
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

  // Handle fetching document data model for a classification — opens the editor on success
  const handleFetchDataModel = async (classification: any) => {
    clearDataModelResults();
    setEditorPdfMetadata({
      filename: fileId,
      pages: classification.pages,
      classification: classification.classificationType,
    });
    const success = await getDocumentDataModel(classification.classificationId);

    if (!success) {
      showSnackbar('Failed to load document data model', 'error');
    }
  };

  // Handle converting selected classifications to statements
  const handleConvertToStatement = async () => {
    if (selectedClassifications.length === 0) {
      showSnackbar('Please select at least one classification to convert', 'error');
      return;
    }

    clearConvertResults();
    setAccumulatedConvertResults([]);

    try {
      const result = await convertToStatementHook(clientId);
      setAccumulatedConvertResults([result]);
      const matchCount = Array.isArray(result) ? result.length : 0;
      if (matchCount > 0) {
        showSnackbar(`Successfully matched ${matchCount} transaction${matchCount !== 1 ? 's' : ''} to checks!`, 'success');
      } else {
        showSnackbar('No matches found', 'error');
      }
    } catch (err) {
      console.error('Error matching statements with checks:', err);
      showSnackbar('Failed to process classifications', 'error');
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
        subheader={`File ID: ${fileId}`}
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
            <Button
              variant="contained"
              color="secondary"
              startIcon={convertLoading ? <CircularProgress size={16} /> : <Transform />}
              onClick={handleConvertToStatement}
              disabled={convertLoading || selectionCount === 0}
              size="small"
            >
              {convertLoading ? 'Converting...' : `Convert to Statement (${selectionCount})`}
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

      {/* Document Data Model result display — hidden while editor is open */}
      {!editorOpen && (
        <DocumentDataModelResult
          result={dataModelResult}
          loading={dataModelLoading}
          error={dataModelError}
          onEdit={dataModelResult ? () => setEditorOpen(true) : undefined}
        />
      )}

      {/* Inline data model editor — replaces the result display when open */}
      {editorOpen && editorPdfMetadata && dataModelResult && (
        <DocumentDataModelEditor
          onCancel={() => setEditorOpen(false)}
          onSaved={() => {
            setEditorOpen(false);
            getDocumentDataModel(editorPdfMetadata.classification);
          }}
          classificationId={editorPdfMetadata.classification}
          classification={editorPdfMetadata.classification}
          initialModel={dataModelResult}
        />
      )}

      {/* Convert to Statement result display */}
      <ConvertToStatementResult
        result={accumulatedConvertResults.length > 0 ? accumulatedConvertResults : convertResult}
        loading={convertLoading}
        error={convertError}
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
