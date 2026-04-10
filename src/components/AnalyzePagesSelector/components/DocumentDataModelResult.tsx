import React from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Edit } from '@mui/icons-material';

interface DocumentDataModelResultProps {
  result: any;
  loading: boolean;
  error: string | null;
  onEdit?: () => void;
}

const DocumentDataModelResult: React.FC<DocumentDataModelResultProps> = ({
  result,
  loading,
  error,
  onEdit,
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">
          Loading document data model...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 1 }}>
        {error}
      </Alert>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          Document Data Model:
        </Typography>
        {onEdit && (
          <Tooltip title="Edit data model" placement="top">
            <IconButton size="small" onClick={onEdit}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          backgroundColor: 'grey.50',
          maxHeight: 300,
          overflow: 'auto',
        }}
      >
        <pre style={{
          margin: 0,
          fontSize: '0.8rem',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </Paper>
    </Box>
  );
};

export default DocumentDataModelResult;
