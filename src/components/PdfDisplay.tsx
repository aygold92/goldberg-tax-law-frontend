/**
 * PdfDisplay component for showing statement PDFs.
 *
 * This component displays the statement PDF in a draggable and resizable iframe:
 * - Loads PDF from Azure blob storage using SAS token
 * - Draggable and resizable display
 * - Loading and error states
 * - Automatic positioning and sizing
 *
 * Supports real-time updates as PDF URL changes.
 */

import React, { useEffect, useState, useRef } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import apiService from '../services/api';
import { COLORS } from '../styles/constants';
import styles from '../styles/components/PdfDisplay.module.css';

interface PdfDisplayProps {
  clientName: string;
  filename: string;
  pages?: number[];
}

const PdfDisplay: React.FC<PdfDisplayProps> = ({
  clientName,
  filename,
  pages,
}) => {
  // PDF SAS token state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Cache the PDF URL to prevent re-fetching
  const pdfUrlRef = useRef<string | null>(null);

  // Fetch PDF SAS token and construct URL
  useEffect(() => {
    const fetchSas = async () => {
      if (!clientName || !filename) return;
      setPdfLoading(true);
      setPdfError(null);
      try {
        const storageAccountName = process.env.REACT_APP_AZURE_STORAGE_ACCOUNT || 'yourstorageaccount';
        const action = 'input';
        const sasResp = await apiService.requestSASToken(clientName, action);
        const url = `https://${storageAccountName}.blob.core.windows.net/${clientName}-input/${filename}?${sasResp.token}#page=${pages?.[0] ?? 1}`;
        setPdfUrl(url);
        pdfUrlRef.current = url;
      } catch (e: any) {
        console.error('PDF loading error:', e);
        setPdfError(e.message || 'Failed to load PDF');
      } finally {
        setPdfLoading(false);
      }
    };

    if (!clientName || !filename) return;

    // Check if we already have a cached URL for this filename
    if (pdfUrlRef.current && pdfUrlRef.current.includes(filename)) {
      setPdfUrl(pdfUrlRef.current);
      setPdfLoading(false);
      setPdfError(null);
    } else {
      fetchSas();
    }
  }, [clientName, filename]);

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
