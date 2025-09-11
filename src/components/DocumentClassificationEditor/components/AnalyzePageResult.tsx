import React from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';

interface AnalyzePageResultProps {
  result: any;
  loading: boolean;
  error?: string;
}

const AnalyzePageResult: React.FC<AnalyzePageResultProps> = ({
  result,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#f5f5f5' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Analyzing pages... This may take 30-60 seconds or more.
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#ffebee' }}>
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Analysis Result:
      </Typography>
      <Paper sx={{ p: 2, backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0' }}>
        <pre style={{ 
          margin: 0, 
          fontSize: '0.8rem', 
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </Paper>
    </Box>
  );
};

export default AnalyzePageResult;
