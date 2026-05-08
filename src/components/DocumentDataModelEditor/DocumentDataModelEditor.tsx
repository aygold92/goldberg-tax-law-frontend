import React, { useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Button,
  Box,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import { CheckCircle, Cancel, Warning } from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { useModelEditor } from './hooks/useModelEditor';

interface DocumentDataModelEditorProps {
  onCancel: () => void;
  onSaved?: () => void;
  classificationId: string;
  classification: string;
  initialModel: any;
}

const DocumentDataModelEditor: React.FC<DocumentDataModelEditorProps> = ({
  onCancel,
  onSaved,
  classificationId,
  classification,
  initialModel,
}) => {
  const {
    editedJson,
    setEditedJson,
    validationError,
    isValid,
    warnings,
    showDiff,
    submitLoading,
    submitError,
    submitSuccess,
    handleShowDiff,
    handleBackToEditor,
    handleAccept,
  } = useModelEditor({ classificationId, classification, initialModel });

  useEffect(() => {
    if (submitSuccess) {
      if (onSaved) onSaved();
      else onCancel();
    }
  }, [submitSuccess, onCancel, onSaved]);

  const originalJson = JSON.stringify(initialModel, null, 2);

  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardHeader
        title={!showDiff
          ? `Edit Data Model — ${classification}`
          : `Review Changes — ${classification}`
        }
        titleTypographyProps={{ variant: 'subtitle2', fontWeight: 'bold' }}
      />

      <CardContent sx={{ pt: 0 }}>
        {!showDiff ? (
          <Box>
            <Editor
              language="json"
              height="400px"
              value={editedJson}
              onChange={v => setEditedJson(v ?? '')}
              options={{
                tabSize: 2,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
              }}
            />
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {isValid ? (
                  <>
                    <CheckCircle sx={{ color: 'success.main', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: 'success.main' }}>Valid</Typography>
                  </>
                ) : (
                  <>
                    <Cancel sx={{ color: 'error.main', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: 'error.main' }}>{validationError}</Typography>
                  </>
                )}
              </Box>
              {isValid && warnings.length > 0 && (
                <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                  {warnings.map((w, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Warning sx={{ color: 'warning.main', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ color: 'warning.main' }}>{w}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          <Box>
            <Box sx={{ overflow: 'auto' }}>
              <ReactDiffViewer
                oldValue={originalJson}
                newValue={editedJson}
                splitView={true}
                leftTitle="Original"
                rightTitle="Edited"
              />
            </Box>
            {submitError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {submitError}
              </Alert>
            )}
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        {!showDiff ? (
          <>
            <Button size="small" onClick={onCancel}>Cancel</Button>
            <Button size="small" variant="contained" onClick={handleShowDiff} disabled={!isValid}>
              Preview Diff →
            </Button>
          </>
        ) : (
          <>
            <Button size="small" onClick={handleBackToEditor} disabled={submitLoading}>
              ← Back to Editor
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleAccept}
              disabled={submitLoading}
              startIcon={submitLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {submitLoading ? 'Saving...' : 'Accept & Save'}
            </Button>
          </>
        )}
      </CardActions>
    </Card>
  );
};

export default DocumentDataModelEditor;
