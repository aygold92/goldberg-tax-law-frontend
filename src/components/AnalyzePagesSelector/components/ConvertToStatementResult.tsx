import React from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';

interface ConvertToStatementResultProps {
  result: any;
  loading: boolean;
  error: string | null;
}

const ConvertToStatementResult: React.FC<ConvertToStatementResultProps> = ({
  result,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">
          Converting to statement...
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
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
        Convert to Statement Result:
      </Typography>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          backgroundColor: 'grey.50',
          maxHeight: 400,
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

export default ConvertToStatementResult;



