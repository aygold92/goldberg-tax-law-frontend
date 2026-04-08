import React, { useState } from 'react';
import { Box, Button, Card, CardContent, CardHeader, Alert, CircularProgress } from '@mui/material';
import { ClassifyDocumentResponse } from '../types/api';
import apiService from '../services/api';

interface ClassifyDocumentButtonProps {
  clientName: string;
  filename: string;
  onClassified: () => void;
}

const ClassifyDocumentButton: React.FC<ClassifyDocumentButtonProps> = ({
  clientName,
  filename,
  onClassified,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassifyDocumentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClassify = async () => {
    setLoading(true);
    setError(null);
    try {
      const requestId = crypto.randomUUID();
      const res = await apiService.classifyDocument(requestId, clientName, filename);
      setResult(res);
      onClassified();
    } catch (e: any) {
      setError(e.userMessage || e.message || 'Classification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Classify Document"
        titleTypographyProps={{ variant: 'h6' }}
      />
      <CardContent>
        <Button
          variant="contained"
          onClick={handleClassify}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {loading ? 'Classifying...' : 'Classify Document'}
        </Button>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box
            component="pre"
            sx={{
              mt: 2,
              p: 1.5,
              bgcolor: 'grey.100',
              borderRadius: 1,
              fontSize: '0.75rem',
              overflow: 'auto',
              maxHeight: 300,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {JSON.stringify(result, null, 2)}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ClassifyDocumentButton;
