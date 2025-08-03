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
    <Box sx={{ mb: 4 }}>
      {/* Main Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 3, 
        mb: 2,
        flexWrap: 'wrap'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 2,
            backgroundColor: '#dbeafe',
            color: '#1d4ed8'
          }}>
            <Edit sx={{ fontSize: 24 }} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                color: '#1e293b',
                lineHeight: 1.2,
                mb: 0.5
              }}
            >
              {heading}
            </Typography>
            {filename && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontFamily: 'monospace',
                  backgroundColor: '#f1f5f9',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  display: 'inline-block'
                }}
              >
                {filename}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Status Indicators */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {hasUnsavedChanges && (
            <Slide direction="left" in={hasUnsavedChanges} mountOnEnter unmountOnExit>
              <Chip
                icon={<WarningIcon />}
                label="Unsaved Changes"
                color="warning"
                variant="outlined"
                sx={{
                  borderColor: '#f59e0b',
                  color: '#92400e',
                  backgroundColor: '#fef3c7',
                  fontWeight: 500,
                  '& .MuiChip-icon': {
                    color: '#f59e0b'
                  }
                }}
              />
            </Slide>
          )}
          
          {saveLoading && (
            <Chip
              icon={<CheckCircleIcon />}
              label="Saving..."
              color="info"
              variant="outlined"
              sx={{
                borderColor: '#3b82f6',
                color: '#1e40af',
                backgroundColor: '#eff6ff',
                fontWeight: 500,
                '& .MuiChip-icon': {
                  color: '#3b82f6'
                }
              }}
            />
          )}
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Undo />}
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            size="large"
            sx={{
              borderColor: '#d1d5db',
              color: '#374151',
              '&:hover': {
                borderColor: '#9ca3af',
                backgroundColor: '#f9fafb',
              },
              '&:disabled': {
                borderColor: '#e5e7eb',
                color: '#9ca3af',
              }
            }}
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
            sx={{
              borderColor: '#d1d5db',
              color: '#374151',
              '&:hover': {
                borderColor: '#9ca3af',
                backgroundColor: '#f9fafb',
              },
              '&:disabled': {
                borderColor: '#e5e7eb',
                color: '#9ca3af',
              }
            }}
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
          sx={{
            backgroundColor: '#10b981',
            '&:hover': {
              backgroundColor: '#059669',
            },
            '&:disabled': {
              backgroundColor: '#d1d5db',
              color: '#9ca3af',
            }
          }}
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
            sx={{ 
              borderRadius: 2,
              backgroundColor: '#fef2f2',
              border: '1px solid #f87171',
              color: '#991b1b',
              '& .MuiAlert-icon': {
                color: '#ef4444'
              }
            }}
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