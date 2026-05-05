import React, { useEffect, useState, useRef } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import apiService from '../services/api';
import { COLORS } from '../styles/constants';
import styles from '../styles/components/PdfDisplay.module.css';

interface PdfDisplayProps {
  fileId: string;
  pages?: number[];
}

const PdfDisplay: React.FC<PdfDisplayProps> = ({ fileId, pages }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const cachedFileId = useRef<string | null>(null);

  useEffect(() => {
    if (!fileId) return;

    // Return cached URL if fileId hasn't changed
    if (cachedFileId.current === fileId && pdfUrl) {
      return;
    }

    const fetchSas = async () => {
      setPdfLoading(true);
      setPdfError(null);
      try {
        const storageAccountName = process.env.REACT_APP_AZURE_STORAGE_ACCOUNT || '';
        const { token, storageLocation } = await apiService.fetchReadSASToken({ fileId });
        const url = `https://${storageAccountName}.blob.core.windows.net/${storageLocation.containerName}/${storageLocation.filePath}.${storageLocation.extension.toLowerCase()}?${token}#page=${pages?.[0] ?? 1}`;
        setPdfUrl(url);
        cachedFileId.current = fileId;
      } catch (e: any) {
        console.error('PDF loading error:', e);
        setPdfError(e.userMessage || e.message || 'Failed to load PDF');
      } finally {
        setPdfLoading(false);
      }
    };

    fetchSas();
  }, [fileId]); // pages intentionally excluded — page anchor doesn't require a new token

  return (
    <Box className={styles.wrapper}>
      {pdfLoading && (
        <Box className={styles.loadingContainer}>
          <CircularProgress />
        </Box>
      )}
      {pdfError && (
        <Box className={styles.errorContainer}>
          <Alert severity="error">{pdfError}</Alert>
        </Box>
      )}
      {pdfUrl && (
        <Box className={styles.pdfContainer}>
          <iframe
            src={pdfUrl}
            title="Statement PDF"
            className={styles.pdfIframe}
          />
        </Box>
      )}
    </Box>
  );
};

export default PdfDisplay;
