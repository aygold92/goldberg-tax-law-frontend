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
  Checkbox,
  FormControlLabel,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { Refresh, Save, PlayArrow, SelectAll, Clear, Transform, HelpOutline } from '@mui/icons-material';
import { ClassificationType } from '../../types/bankStatement';
import { ClassificationInfo } from '../../types/api';

import { useDocumentClassifications } from '../DocumentClassificationEditor/hooks/useDocumentClassifications';
import { useAnalyzePage } from '../DocumentClassificationEditor/hooks/useAnalyzePage';
import { useSnackbar } from '../DocumentClassificationEditor/hooks/useSnackbar';
import { useValidation } from '../DocumentClassificationEditor/hooks/useValidation';
import { useSelection } from '../AnalyzePagesSelector/hooks/useSelection';
import { useDocumentDataModel } from '../AnalyzePagesSelector/hooks/useDocumentDataModel';
import { useConvertToStatement } from '../AnalyzePagesSelector/hooks/useConvertToStatement';

import ClassificationInput from '../DocumentClassificationEditor/components/ClassificationInput';
import AnalyzePageResult from '../DocumentClassificationEditor/components/AnalyzePageResult';
import ReloadConfirmationDialog from '../DocumentClassificationEditor/components/ReloadConfirmationDialog';
import DocumentDataModelResult from '../AnalyzePagesSelector/components/DocumentDataModelResult';
import ConvertToStatementResult from '../AnalyzePagesSelector/components/ConvertToStatementResult';
import { DocumentDataModelEditor } from '../DocumentDataModelEditor';
import UnifiedClassificationBadge from './components/UnifiedClassificationBadge';

interface DocumentClassificationPanelProps {
  fileId: string;
  clientId: string;
  readOnly?: boolean;
  onAnalysisComplete?: (result: any) => void;
}

const DocumentClassificationPanel: React.FC<DocumentClassificationPanelProps> = ({
  fileId,
  clientId,
  readOnly = false,
  onAnalysisComplete,
}) => {
  const [showReloadDialog, setShowReloadDialog] = useState(false);
  const [accumulatedConvertResults, setAccumulatedConvertResults] = useState<any[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorClassification, setEditorClassification] = useState<ClassificationInfo | null>(null);
  const [forceReanalysis, setForceReanalysis] = useState(false);
  const [forceRecreate, setForceRecreate] = useState(false);
  const [replaceOnRecreate, setReplaceOnRecreate] = useState(false);

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
    clearResults: clearAnalyzeResults,
  } = useAnalyzePage();

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

  const { snackbarOpen, snackbarMessage, snackbarSeverity, showSnackbar, closeSnackbar } = useSnackbar();
  const { validationErrors, validateInput, clearValidationErrors } = useValidation();

  const defaultClassification = useMemo(() => {
    const nonChecks = classifications.filter(c => !c.classificationType.startsWith('Checks'));
    const pool = nonChecks.length > 0 ? nonChecks : classifications;
    if (pool.length === 0) return ClassificationType.AMEX_CC;
    const counts: Record<string, number> = {};
    pool.forEach(c => { counts[c.classificationType] = (counts[c.classificationType] || 0) + 1; });
    return Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0];
  }, [classifications]);

  const isAddedClassification = (c: ClassificationInfo): boolean =>
    !c.classificationId || addedClassifications.some(a => a.classificationId === c.classificationId);

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
    const processingOptions = (forceReanalysis || forceRecreate || replaceOnRecreate)
      ? { forceReanalysis, forceRecreate, replaceOnRecreate }
      : undefined;
    const success = await analyzePages(selectedClassifications, processingOptions);
    if (success) {
      showSnackbar('Page analysis completed successfully!', 'success');
      if (onAnalysisComplete) onAnalysisComplete(analyzePageResult);
    } else {
      showSnackbar('Failed to analyze pages', 'error');
    }
  };

  const handleConvertToStatement = async () => {
    clearConvertResults();
    setAccumulatedConvertResults([]);
    try {
      const result = await convertToStatementHook(clientId);
      setAccumulatedConvertResults([result]);
      const matchCount = result.length;
      if (matchCount > 0) {
        showSnackbar(`Successfully matched ${matchCount} transaction${matchCount !== 1 ? 's' : ''} to checks!`, 'success');
      } else {
        showSnackbar('No matches found', 'error');
      }
    } catch {
      showSnackbar('Failed to process classifications', 'error');
    }
  };

  const handleFetchDataModel = async (c: ClassificationInfo) => {
    if (!c.classificationId) {
      showSnackbar('Save classifications before loading data model', 'error');
      return;
    }
    clearDataModelResults();
    setEditorClassification(c);
    const success = await getDocumentDataModel(c.classificationId);
    if (!success) showSnackbar('Failed to load document data model', 'error');
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
        subheader={`File ID: ${fileId}`}
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
            disabled={convertLoading}
          >
            {convertLoading ? 'Converting...' : 'Convert to Statement'}
          </Button>
        </Box>

        {!readOnly && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1, alignItems: 'center' }}>
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
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 1, py: 0.5 }}>
            {error}
          </Alert>
        )}

        {selectionCount > 0 && (
          <Alert severity="info" sx={{ mb: 1, py: 0.5 }}>
            {selectionCount} classification{selectionCount !== 1 ? 's' : ''} selected
          </Alert>
        )}

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

        {(classifications.length > 0 || deletedClassifications.length > 0) ? (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Classifications ({classifications.length}):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {classifications.map((c, i) => (
                <UnifiedClassificationBadge
                  key={`active-${c.classificationId || i}`}
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
                  key={`deleted-${c.classificationId || i}`}
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

        <AnalyzePageResult
          result={analyzePageResult}
          loading={analyzePageLoading}
          error={analyzeError}
        />

        {!editorOpen && (
          <DocumentDataModelResult
            result={dataModelResult}
            loading={dataModelLoading}
            error={dataModelError}
            onEdit={dataModelResult ? () => setEditorOpen(true) : undefined}
          />
        )}
        {editorOpen && editorClassification && dataModelResult && (
          <DocumentDataModelEditor
            onCancel={() => setEditorOpen(false)}
            onSaved={() => {
              setEditorOpen(false);
              if (editorClassification.classificationId) {
                getDocumentDataModel(editorClassification.classificationId);
              }
            }}
            classificationId={editorClassification.classificationId}
            classification={editorClassification.classificationType}
            initialModel={dataModelResult}
          />
        )}

        <ConvertToStatementResult
          result={accumulatedConvertResults.length > 0 ? accumulatedConvertResults : convertResult}
          loading={convertLoading}
          error={convertError}
        />

        <ReloadConfirmationDialog
          open={showReloadDialog}
          onClose={() => setShowReloadDialog(false)}
          onConfirm={() => { setShowReloadDialog(false); reloadClassifications(); }}
        />

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
