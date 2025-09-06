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

import { 
  Box, 
  Typography, 
  Alert, 
  Button, 
  Chip,
  Divider,
  Slide
} from '@mui/material';
import { 
  Edit, 
  Save, 
  Undo, 
  Redo, 
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { BankStatement } from '../types/bankStatement';
import { useUndoRedo } from '../redux/hooks/useUndoRedo';
import { COLORS } from '../styles/constants';
import styles from '../styles/components/EditPageHeader.module.css';

interface EditPageHeaderProps {
  statement: BankStatement | null;
  hasUnsavedChanges: boolean;
  saveLoading: boolean;
  saveError: string | null;
  onSave: () => void;
}

const EditPageHeader: React.FC<EditPageHeaderProps> = ({
  statement,
  hasUnsavedChanges,
  saveLoading,
  saveError,
  onSave,
}) => {
  const { canUndo, canRedo, undo, redo } = useUndoRedo();

  // Generate heading and metadata
  const heading = statement
    ? `Edit Statement ${statement.pageMetadata.classification}-${statement.accountNumber}: ${statement.date}`
    : 'Edit Statement';
  const filename = statement?.pageMetadata.filename;

  return (
    <Box className={styles.headerContainer}>
      {/* Main Header */}
      <Box className={styles.mainHeader}>
        <Box className={styles.headerLeft}>
          <Box className={styles.iconContainer}>
            <Edit sx={{ fontSize: 24 }} />
          </Box>
          <Box className={styles.headerContent}>
            <Typography 
              variant="h4" 
              className={styles.headerTitle}
            >
              {heading}
            </Typography>
            {filename && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                className={styles.filenameChip}
              >
                {filename}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Status Indicators */}
        <Box className={styles.statusIndicators}>
          {hasUnsavedChanges && (
            <Slide direction="left" in={hasUnsavedChanges} mountOnEnter unmountOnExit>
              <Chip
                icon={<WarningIcon />}
                label="Unsaved Changes"
                color="warning"
                variant="outlined"
                className={styles.unsavedChip}
              />
            </Slide>
          )}
          
          {saveLoading && (
            <Chip
              icon={<CheckCircleIcon />}
              label="Saving..."
              color="info"
              variant="outlined"
              className={styles.savingChip}
            />
          )}
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box className={styles.actionsContainer}>
        <Box className={styles.undoRedoContainer}>
          <Button
            variant="outlined"
            startIcon={<Undo />}
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            size="large"
            className={styles.undoRedoButton}
          >
            Undo
          </Button>
          <Button
            variant="outlined"
            startIcon={<Redo />}
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            size="large"
            className={styles.undoRedoButton}
          >
            Redo
          </Button>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ height: 40 }} />

        <Button
          variant="contained"
          startIcon={saveLoading ? <CheckCircleIcon /> : <Save />}
          onClick={onSave}
          disabled={saveLoading || !hasUnsavedChanges}
          size="large"
          className={styles.saveButton}
        >
          {saveLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      {/* Save Error */}
      <Slide direction="down" in={!!saveError} mountOnEnter unmountOnExit>
        <Box sx={{ mb: 2 }}>
          <Alert 
            severity="error" 
            icon={<ErrorIcon />}
            className={styles.errorAlert}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              Save Error
            </Typography>
            <Typography variant="body2">
              {saveError}
            </Typography>
          </Alert>
        </Box>
      </Slide>
    </Box>
  );
};

export default EditPageHeader; 