/**
 * FileMetadataEditor component for viewing and updating input file metadata.
 * 
 * This component provides:
 * - Display of current file metadata (numstatements, classified, analyzed, statements)
 * - Editable form for updating metadata values
 * - Clear button for statements list that removes the property entirely
 * - Save functionality with loading states and error handling
 * - Real-time validation and user feedback
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { InputFileMetadata } from '../../types/api';
import apiService from '../../services/api';
import styles from './FileMetadataEditor.module.css';

interface FileMetadataEditorProps {
  clientName: string;
  filename: string;
}

const FileMetadataEditor: React.FC<FileMetadataEditorProps> = ({
  clientName,
  filename,
}) => {
  const [metadata, setMetadata] = useState<InputFileMetadata | null>(null);
  const [editedMetadata, setEditedMetadata] = useState<InputFileMetadata>({
    classified: false,
    analyzed: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const loadMetadata = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getInputFileMetadata({
        clientName,
        filename,
      });
      
      if (response.status === 'Success' && response.metadata) {
        setMetadata(response.metadata);
        setEditedMetadata(response.metadata);
      } else {
        setError(response.message || 'Failed to load metadata');
      }
    } catch (err: any) {
      setError(err.userMessage || err.message || 'Failed to load metadata');
    } finally {
      setLoading(false);
    }
  }, [clientName, filename]);

  // Load metadata on component mount
  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  // Check for changes whenever editedMetadata changes
  useEffect(() => {
    if (metadata) {
      const hasChanges = JSON.stringify(metadata) !== JSON.stringify(editedMetadata);
      setHasChanges(hasChanges);
    }
  }, [metadata, editedMetadata]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create a clean metadata object, removing undefined properties
      const cleanMetadata: InputFileMetadata = {
        classified: editedMetadata.classified,
        analyzed: editedMetadata.analyzed,
      };

      // Only include numstatements if it has a value
      if (editedMetadata.numstatements !== undefined && editedMetadata.numstatements !== null) {
        cleanMetadata.numstatements = editedMetadata.numstatements;
      }

      // Only include statements if it has values (don't include empty array)
      if (editedMetadata.statements && editedMetadata.statements.length > 0) {
        cleanMetadata.statements = editedMetadata.statements;
      }

      const response = await apiService.updateInputFileMetadata({
        clientName,
        filename,
        metadata: cleanMetadata,
      });

      if (response.status === 'Success') {
        setSuccess('Metadata updated successfully');
        setMetadata(cleanMetadata);
        setEditedMetadata(cleanMetadata);
        setHasChanges(false);
      } else {
        setError(response.message || 'Failed to update metadata');
      }
    } catch (err: any) {
      setError(err.userMessage || err.message || 'Failed to update metadata');
    } finally {
      setSaving(false);
    }
  };

  const handleClearStatements = () => {
    setEditedMetadata(prev => {
      const newMetadata = { ...prev };
      delete newMetadata.statements;
      return newMetadata;
    });
  };

  const handleAddStatement = () => {
    setEditedMetadata(prev => ({
      ...prev,
      statements: [...(prev.statements || []), ''],
    }));
  };

  const handleStatementChange = (index: number, value: string) => {
    setEditedMetadata(prev => ({
      ...prev,
      statements: prev.statements?.map((stmt, i) => i === index ? value : stmt) || [],
    }));
  };

  const handleRemoveStatement = (index: number) => {
    setEditedMetadata(prev => ({
      ...prev,
      statements: prev.statements?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleRefresh = () => {
    loadMetadata();
  };

  if (loading) {
    return (
      <Card className={styles.card}>
        <CardContent className={styles.loadingContent}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            Loading file metadata...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <CardHeader
        title="File Metadata Editor"
        subheader={`File: ${filename}`}
        action={
          <Box className={styles.headerActions}>
            <Tooltip title="Refresh metadata">
              <IconButton onClick={handleRefresh} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={!hasChanges || saving}
              size="small"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        }
        className={styles.cardHeader}
      />
      
      <CardContent className={styles.cardContent}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Number of Statements */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Number of Statements"
              type="number"
              value={editedMetadata.numstatements || ''}
              onChange={(e) => setEditedMetadata(prev => ({
                ...prev,
                numstatements: e.target.value ? parseInt(e.target.value) : undefined,
              }))}
              fullWidth
              size="small"
              helperText="Total number of statements in the file"
            />
          </Grid>

          {/* Classified Status */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={editedMetadata.classified}
                  onChange={(e) => setEditedMetadata(prev => ({
                    ...prev,
                    classified: e.target.checked,
                  }))}
                />
              }
              label="Classified"
            />
            <Typography variant="caption" display="block" color="text.secondary">
              Document has been classified
            </Typography>
          </Grid>

          {/* Analyzed Status */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={editedMetadata.analyzed}
                  onChange={(e) => setEditedMetadata(prev => ({
                    ...prev,
                    analyzed: e.target.checked,
                  }))}
                />
              }
              label="Analyzed"
            />
            <Typography variant="caption" display="block" color="text.secondary">
              Document has been analyzed
            </Typography>
          </Grid>

          {/* Statements List */}
          <Grid item xs={12}>
            <Box className={styles.statementsSection}>
              <Box className={styles.statementsHeader}>
                <Typography variant="h6" component="h3">
                  Statements
                </Typography>
                <Box className={styles.statementsActions}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleAddStatement}
                    sx={{ mr: 1 }}
                  >
                    Add Statement
                  </Button>
                  {editedMetadata.statements && editedMetadata.statements.length > 0 && (
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      startIcon={<ClearIcon />}
                      onClick={handleClearStatements}
                    >
                      Clear All
                    </Button>
                  )}
                </Box>
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                <InfoIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                List of statement identifiers. Use "Clear All" to remove the statements property entirely.
              </Typography>

              {editedMetadata.statements && editedMetadata.statements.length > 0 ? (
                <Box className={styles.statementsList}>
                  {editedMetadata.statements.map((statement, index) => (
                    <Box key={index} className={styles.statementItem}>
                      <TextField
                        value={statement}
                        onChange={(e) => handleStatementChange(index, e.target.value)}
                        placeholder="Enter statement identifier"
                        fullWidth
                        size="small"
                        variant="outlined"
                      />
                      <IconButton
                        onClick={() => handleRemoveStatement(index)}
                        size="small"
                        color="error"
                        sx={{ ml: 1 }}
                      >
                        <ClearIcon />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No statements defined. Click "Add Statement" to add one.
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>

        {hasChanges && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              You have unsaved changes. Click "Save Changes" to update the metadata.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default FileMetadataEditor;
