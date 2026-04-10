import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Alert,
  CircularProgress,
  Snackbar,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { Refresh, Save, PlayArrow, SelectAll, Clear, Transform, HelpOutline } from '@mui/icons-material';
import { ClassificationType } from '../../types/bankStatement';
import { ClassifiedPdfMetadata } from '../../types/bankStatement';

// Hooks
import { useDocumentClassifications } from '../DocumentClassificationEditor/hooks/useDocumentClassifications';
import { useAnalyzePage } from '../DocumentClassificationEditor/hooks/useAnalyzePage';
import { useSnackbar } from '../DocumentClassificationEditor/hooks/useSnackbar';
import { useValidation } from '../DocumentClassificationEditor/hooks/useValidation';
import { useSelection } from '../AnalyzePagesSelector/hooks/useSelection';
import { useDocumentDataModel } from '../AnalyzePagesSelector/hooks/useDocumentDataModel';
import { useConvertToStatement } from '../AnalyzePagesSelector/hooks/useConvertToStatement';

// Components
import ClassificationInput from '../DocumentClassificationEditor/components/ClassificationInput';
import AnalyzePageResult from '../DocumentClassificationEditor/components/AnalyzePageResult';
import ReloadConfirmationDialog from '../DocumentClassificationEditor/components/ReloadConfirmationDialog';
import DocumentDataModelResult from '../AnalyzePagesSelector/components/DocumentDataModelResult';
import ConvertToStatementResult from '../AnalyzePagesSelector/components/ConvertToStatementResult';
import { DocumentDataModelEditor } from '../DocumentDataModelEditor';
import UnifiedClassificationBadge from './components/UnifiedClassificationBadge';
import { DocumentClassification } from '../../types/api';

interface DocumentClassificationPanelProps {
  clientName: string;
  filename: string;
  readOnly?: boolean;
  onAnalysisComplete?: (result: any) => void;
}

const DocumentClassificationPanel: React.FC<DocumentClassificationPanelProps> = ({
  clientName,
  filename,
  readOnly = false,
  onAnalysisComplete,
}) => {
  const [showReloadDialog, setShowReloadDialog] = useState(false);
  const [accumulatedConvertResults, setAccumulatedConvertResults] = useState<any[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorPdfMetadata, setEditorPdfMetadata] = useState<ClassifiedPdfMetadata | null>(null);

  // Classification data (single source of truth)
  const {
    classifications,
    addedClassifications,
    deletedClassifications,
    loading,
    saving,
    error,
    hasUnsavedChanges,
    saveClassifications,
    addClassification,
    removeClassification,
    restoreClassification,
    reloadClassifications,
    setError,
  } = useDocumentClassifications(clientName, filename);

  // Selection
  const {
    selectedClassifications,
    selectionCount,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
  } = useSelection();

  // Analysis
  const {
    analyzePageResult,
    analyzePageLoading,
    error: analyzeError,
    analyzePages,
    clearResults: clearAnalyzeResults,
  } = useAnalyzePage();

  // Data model
  const {
    dataModelResult,
    loading: dataModelLoading,
    error: dataModelError,
    getDocumentDataModel,
    clearResults: clearDataModelResults,
  } = useDocumentDataModel();

  // Convert to statement
  const {
    convertResult,
    loading: convertLoading,
    error: convertError,
    convertToStatement: convertToStatementHook,
    clearResults: clearConvertResults,
  } = useConvertToStatement();

  // Snackbar & validation
  const { snackbarOpen, snackbarMessage, snackbarSeverity, showSnackbar, closeSnackbar } = useSnackbar();
  const { validationErrors, validateInput, clearValidationErrors } = useValidation();

  // Compute the most common non-Checks classification as the default for the Add input.
  // Falls back to AMEX_CC when no classifications exist yet.
  const defaultClassification = useMemo(() => {
    const nonChecks = classifications.filter(c => !c.classification.startsWith('Checks'));
    const pool = nonChecks.length > 0 ? nonChecks : classifications;
    if (pool.length === 0) return ClassificationType.AMEX_CC;
    const counts: Record<string, number> = {};
    pool.forEach(c => { counts[c.classification] = (counts[c.classification] || 0) + 1; });
    return Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0];
  }, [classifications]);

  // Helper: is a classification newly added (not yet saved)?
  const isAddedClassification = (classification: DocumentClassification): boolean =>
    addedClassifications.some(
      added =>
        JSON.stringify(added.pages.sort()) === JSON.stringify(classification.pages.sort()) &&
        added.classification === classification.classification
    );

  // --- Handlers ---

  const handleAddClassification = (pages: number[], classification: string) => {
    if (validateInput(pages.join(','), [])) {
      addClassification(pages, classification);
      clearValidationErrors();
    }
  };

  const handleSave = async () => {
    if (validationErrors.length > 0) {
      setError('Please fix validation errors before saving');
      return;
    }
    setError('');
    clearAnalyzeResults();

    const saveSuccess = await saveClassifications();
    if (saveSuccess) {
      showSnackbar('Classifications saved successfully!', 'success');
      // Auto-select the newly added ones so user can immediately Analyze
      selectAll(addedClassifications);
      await reloadClassifications();
    } else {
      showSnackbar('Failed to save classifications', 'error');
    }
  };

  const handleReload = () => {
    if (hasUnsavedChanges) {
      setShowReloadDialog(true);
    } else {
      reloadClassifications();
    }
  };

  const handleAnalyze = async () => {
    if (selectedClassifications.length === 0) {
      showSnackbar('Please select at least one classification to analyze', 'error');
      return;
    }
    clearAnalyzeResults();
    const success = await analyzePages(selectedClassifications, clientName);
    if (success) {
      showSnackbar('Page analysis completed successfully!', 'success');
      if (onAnalysisComplete) onAnalysisComplete(analyzePageResult);
    } else {
      showSnackbar('Failed to analyze pages', 'error');
    }
  };

  const handleConvertToStatement = async () => {
    if (selectedClassifications.length === 0) {
      showSnackbar('Please select at least one classification to convert', 'error');
      return;
    }
    clearConvertResults();
    setAccumulatedConvertResults([]);
    try {
      const result = await convertToStatementHook(clientName, selectedClassifications);
      setAccumulatedConvertResults([result]);
      const statementCount = Object.values(result.filenameStatementMap).reduce(
        (sum: number, statements: any) => sum + statements.length,
        0
      );
      if (statementCount > 0) {
        showSnackbar(
          `Successfully processed ${selectedClassifications.length} classification${selectedClassifications.length !== 1 ? 's' : ''} and created ${statementCount} statement${statementCount !== 1 ? 's' : ''}!`,
          'success'
        );
      } else {
        showSnackbar('Processed classifications but no statements were created', 'error');
      }
    } catch (err) {
      showSnackbar('Failed to process classifications', 'error');
    }
  };

  const handleFetchDataModel = async (classification: DocumentClassification) => {
    clearDataModelResults();
    const pdfMetadata: ClassifiedPdfMetadata = {
      filename,
      pages: classification.pages,
      classification: classification.classification,
    };
    setEditorPdfMetadata(pdfMetadata);
    const success = await getDocumentDataModel(clientName, filename, classification.pages);
    if (!success) {
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
    <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: 2, overflow: 'hidden' }}>
      <CardHeader
        title="Document Classifications"
        subheader={`File: ${filename}`}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Reload classifications">
              <IconButton onClick={handleReload} size="small" disabled={saving || analyzePageLoading}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={
                <Box sx={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
                  <strong>Badge interactions:</strong><br />
                  • Click — select / deselect for analysis<br />
                  • Right-click — load raw data model<br />
                  • Red badge — pending deletion, click to restore<br />
                  • Green badge — newly added, not yet saved
                </Box>
              }
              arrow
              placement="left"
            >
              <IconButton size="small" sx={{ color: 'error.main' }}>
                <HelpOutline fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        }
        sx={{
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          borderBottom: '1px solid #e0e0e0',
          '& .MuiCardHeader-title': { fontWeight: 600, color: '#333' },
          '& .MuiCardHeader-subheader': { color: '#666' },
        }}
      />

      <CardContent sx={{ p: 3 }}>
        {/* Selection / analysis actions */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<SelectAll />}
            onClick={() => selectAll(classifications)}
            disabled={classifications.length === 0}
          >
            Select All
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Clear />}
            onClick={clearSelection}
            disabled={selectionCount === 0}
          >
            Clear
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={analyzePageLoading ? <CircularProgress size={16} /> : <PlayArrow />}
            onClick={handleAnalyze}
            disabled={analyzePageLoading || selectionCount === 0}
          >
            {analyzePageLoading ? 'Analyzing...' : `Analyze (${selectionCount})`}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            startIcon={convertLoading ? <CircularProgress size={16} /> : <Transform />}
            onClick={handleConvertToStatement}
            disabled={convertLoading || selectionCount === 0}
          >
            {convertLoading ? 'Converting...' : `Convert to Statement (${selectionCount})`}
          </Button>
        </Box>

        {/* Error messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 1, py: 0.5 }}>
            {error}
          </Alert>
        )}

        {/* Selection info */}
        {selectionCount > 0 && (
          <Alert severity="info" sx={{ mb: 1, py: 0.5 }}>
            {selectionCount} classification{selectionCount !== 1 ? 's' : ''} selected
          </Alert>
        )}

        {/* Add classification input + Save button in the same row */}
        {!readOnly && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <ClassificationInput
                key={defaultClassification}
                onAdd={handleAddClassification}
                onValidate={(input) => validateInput(input, classifications)}
                validationErrors={validationErrors}
                defaultClassification={defaultClassification}
                readOnly={readOnly}
              />
            </Box>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} /> : <Save />}
              onClick={handleSave}
              disabled={saving || validationErrors.length > 0 || !hasUnsavedChanges}
              size="small"
              sx={{ mt: 0.5, whiteSpace: 'nowrap' }}
            >
              {saving ? 'Saving...' : 'Save Classifications'}
            </Button>
          </Box>
        )}

        {/* Unified badge list */}
        {(classifications.length > 0 || deletedClassifications.length > 0) ? (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Classifications ({classifications.length}):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {classifications.map((c, i) => (
                <UnifiedClassificationBadge
                  key={`active-${i}`}
                  classification={c}
                  isSelected={isSelected(c)}
                  isAdded={isAddedClassification(c)}
                  onToggle={() => toggleSelection(c)}
                  onDelete={!readOnly ? () => removeClassification(i) : undefined}
                  onFetchDataModel={handleFetchDataModel}
                  readOnly={readOnly}
                />
              ))}
              {deletedClassifications.map((c, i) => (
                <UnifiedClassificationBadge
                  key={`deleted-${i}`}
                  classification={c}
                  isDeleted={true}
                  onRestore={() => restoreClassification(c)}
                  readOnly={readOnly}
                />
              ))}
            </Box>
            {deletedClassifications.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Red badges are pending deletion — click to restore
              </Typography>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
            No classifications found
          </Typography>
        )}

        {/* Analyze result */}
        <AnalyzePageResult
          result={analyzePageResult}
          loading={analyzePageLoading}
          error={analyzeError}
        />

        {/* Data model result / editor toggle */}
        {!editorOpen && (
          <DocumentDataModelResult
            result={dataModelResult}
            loading={dataModelLoading}
            error={dataModelError}
            onEdit={dataModelResult ? () => setEditorOpen(true) : undefined}
          />
        )}
        {editorOpen && editorPdfMetadata && dataModelResult && (
          <DocumentDataModelEditor
            onCancel={() => setEditorOpen(false)}
            onSaved={() => {
              setEditorOpen(false);
              getDocumentDataModel(clientName, filename, editorPdfMetadata.pages);
            }}
            clientName={clientName}
            pdfMetadata={editorPdfMetadata}
            initialModel={dataModelResult}
          />
        )}

        {/* Convert to statement result */}
        <ConvertToStatementResult
          result={accumulatedConvertResults.length > 0 ? accumulatedConvertResults : convertResult}
          loading={convertLoading}
          error={convertError}
        />

        {/* Reload confirmation */}
        <ReloadConfirmationDialog
          open={showReloadDialog}
          onClose={() => setShowReloadDialog(false)}
          onConfirm={() => { setShowReloadDialog(false); reloadClassifications(); }}
        />

        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={closeSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={closeSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
};

export default DocumentClassificationPanel;
