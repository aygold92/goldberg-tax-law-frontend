/**
 * EditPageHeader component for the main page header and action buttons.
 * 
 * This component displays:
 * - Page title with statement information
 * - Unsaved changes indicator
 * - Undo/Redo buttons with keyboard shortcuts
 * - Save and Add Transaction buttons
 * - Save error display
 * - Source filename information
 * 
 * Supports real-time updates for save states and validation.
 */

import React from 'react';
import { Box, Typography, Alert, Badge, Button } from '@mui/material';
import { Edit, Save, Add, Undo, Redo } from '@mui/icons-material';
import { BankStatement } from '../types/bankStatement';
import { useUndoRedo } from '../redux/hooks/useUndoRedo';

interface EditPageHeaderProps {
  statement: BankStatement | null;
  clientName: string;
  accountNumber: string;
  date: string;
  hasUnsavedChanges: boolean;
  saveLoading: boolean;
  saveError: string | null;
  onSave: () => void;
}

const EditPageHeader: React.FC<EditPageHeaderProps> = ({
  statement,
  clientName,
  accountNumber,
  date,
  hasUnsavedChanges,
  saveLoading,
  saveError,
  onSave,
}) => {
  const { canUndo, canRedo, undo, redo } = useUndoRedo();

  // Generate heading
  const heading = statement
    ? `Edit Statement ${clientName} ${statement.pageMetadata.classification}-${accountNumber}: ${date}`
    : 'Edit Statement';
  const filename = statement?.pageMetadata.filename;

  return (
    <Box>
      {/* Heading */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Edit sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4">{heading}</Typography>
        {hasUnsavedChanges && (
          <Badge badgeContent="*" color="warning">
            <Typography variant="body2" color="warning.main">Unsaved Changes</Typography>
          </Badge>
        )}
      </Box>

      {/* Source filename */}
      {filename && (
        <Typography variant="subtitle1" sx={{ mb: 2, color: 'text.secondary' }}>
          Source file: <b>{filename}</b>
        </Typography>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<Undo />}
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          Undo
        </Button>
        <Button
          variant="outlined"
          startIcon={<Redo />}
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          Redo
        </Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={onSave}
          disabled={saveLoading || !hasUnsavedChanges}
        >
          {saveLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      {/* Save Error */}
      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {saveError}
        </Alert>
      )}
    </Box>
  );
};

export default EditPageHeader; 