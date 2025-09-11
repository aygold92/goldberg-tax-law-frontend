import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Snackbar,
} from '@mui/material';
import { Refresh, Save } from '@mui/icons-material';
import { ClassificationType } from '../../types/bankStatement';

// Hooks
import { useDocumentClassifications } from './hooks/useDocumentClassifications';
import { useAnalyzePage } from './hooks/useAnalyzePage';
import { useSnackbar } from './hooks/useSnackbar';
import { useValidation } from './hooks/useValidation';

// Components
import ClassificationInput from './components/ClassificationInput';
import ClassificationList from './components/ClassificationList';
import AnalyzePageResult from './components/AnalyzePageResult';
import ReloadConfirmationDialog from './components/ReloadConfirmationDialog';

interface DocumentClassificationEditorProps {
  clientName: string;
  filename: string;
  defaultClassification?: string;
  readOnly?: boolean;
}

/**
 * DocumentClassificationEditor - A compact, self-contained component for managing document classifications
 * 
 * Features:
 * - Load/save document classifications via API
 * - Add/remove/restore classifications with conflict resolution
 * - Optional page analysis after saving
 * - Real-time validation and error handling
 * - Snackbar notifications for user feedback
 * - Unsaved changes warning
 * - Color coding for added/deleted items
 * - Automatic conflict resolution (removes overlapping classifications)
 */
const DocumentClassificationEditor: React.FC<DocumentClassificationEditorProps> = ({
  clientName,
  filename,
  defaultClassification = ClassificationType.AMEX_CC,
  readOnly = false,
}) => {
  // State for UI controls
  const [runAnalyzePage, setRunAnalyzePage] = useState<boolean>(true);
  const [showReloadDialog, setShowReloadDialog] = useState(false);

  // Custom hooks
  const {
    classifications,
    addedClassifications,
    deletedClassifications,
    loading,
    saving,
    error,
    success,
    hasUnsavedChanges,
    saveClassifications,
    addClassification,
    removeClassification,
    restoreClassification,
    reloadClassifications,
    setError,
    setSuccess,
  } = useDocumentClassifications(clientName, filename);

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
    validationErrors,
    validateInput,
    clearValidationErrors,
  } = useValidation();

  // Handle adding a new classification
  const handleAddClassification = (pages: number[], classification: string) => {
    // Only validate format, not overlaps (addClassification handles overlaps)
    if (validateInput(pages.join(','), [])) {
      addClassification(pages, classification);
      clearValidationErrors();
    }
  };

  // Handle saving classifications
  const handleSave = async () => {
    if (validationErrors.length > 0) {
      setError('Please fix validation errors before saving');
      return;
    }

    setError('');
    setSuccess('');
    clearResults();

    try {
      // Step 1: Save classifications
      const saveSuccess = await saveClassifications();
      if (saveSuccess) {
        showSnackbar('Classifications saved successfully!', 'success');

        // Step 2: Run AnalyzePage if checkbox is checked
        if (runAnalyzePage && addedClassifications.length > 0) {
          const analyzeSuccess = await analyzePages(addedClassifications, clientName);
          if (analyzeSuccess) {
            showSnackbar('Page analysis completed successfully!', 'success');
          } else {
            showSnackbar('Failed to analyze pages', 'error');
          }
        }

        // Step 3: Reload classifications at the very end to get fresh data
        await reloadClassifications();
      } else {
        showSnackbar('Failed to save classifications', 'error');
      }
    } catch (err: any) {
      showSnackbar('Failed to save classifications', 'error');
    }
  };

  // Handle reloading classifications
  const handleReload = () => {
    if (hasUnsavedChanges) {
      setShowReloadDialog(true);
    } else {
      reloadClassifications();
    }
  };

  // Handle confirming reload
  const handleConfirmReload = () => {
    setShowReloadDialog(false);
    reloadClassifications();
  };

  // Handle canceling reload
  const handleCancelReload = () => {
    setShowReloadDialog(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* Compact header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Classifications
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {!readOnly && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={runAnalyzePage}
                  onChange={(e) => setRunAnalyzePage(e.target.checked)}
                  size="small"
                />
              }
              label="Analyze pages"
              sx={{ mr: 1 }}
            />
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={handleReload}
            disabled={saving || analyzePageLoading}
            sx={{ minWidth: 'auto', px: 1 }}
          >
            Reload
          </Button>
          {!readOnly && (
            <Button
              variant="contained"
              size="small"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={saving || analyzePageLoading || validationErrors.length > 0 || !hasUnsavedChanges}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              {saving ? 'Saving...' : analyzePageLoading ? 'Analyzing...' : 'Save'}
            </Button>
          )}
        </Box>
      </Box>

      {/* Error/Success messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 1, py: 0.5 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 1, py: 0.5 }}>
          {success}
        </Alert>
      )}

      {/* Input section */}
      {!readOnly && (
        <ClassificationInput
          onAdd={handleAddClassification}
          onValidate={(input) => validateInput(input, classifications)}
          validationErrors={validationErrors}
          defaultClassification={defaultClassification}
          readOnly={readOnly}
        />
      )}

      {/* Classifications list */}
      <ClassificationList
        activeClassifications={classifications}
        deletedClassifications={deletedClassifications}
        addedClassifications={addedClassifications}
        onRemoveClassification={removeClassification}
        onRestoreClassification={restoreClassification}
        readOnly={readOnly}
      />

      {/* AnalyzePage result display */}
      <AnalyzePageResult
        result={analyzePageResult}
        loading={analyzePageLoading}
        error={analyzeError}
      />

      {/* Reload confirmation dialog */}
      <ReloadConfirmationDialog
        open={showReloadDialog}
        onClose={handleCancelReload}
        onConfirm={handleConfirmReload}
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
    </Box>
  );
};

export default DocumentClassificationEditor;