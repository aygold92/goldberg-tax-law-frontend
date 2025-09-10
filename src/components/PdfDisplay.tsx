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
import { BankStatement } from '../types/bankStatement';
import apiService from '../services/api';
import { COLORS } from '../styles/constants';
import styles from '../styles/components/PdfDisplay.module.css';

interface PdfDisplayProps {
  statement: BankStatement | null;
  clientName: string;
  accountNumber: string;
  classification: string;
  date: string;
}

const PdfDisplay: React.FC<PdfDisplayProps> = ({
  statement,
  clientName,
  accountNumber,
  classification,
  date,
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
      if (!clientName || !accountNumber || !classification || !date) return;
      console.log('Fetching PDF with statement:', statement);
      setPdfLoading(true);
      setPdfError(null);
      try {
        // You may need to update storageAccountName from env/config
        const storageAccountName = process.env.REACT_APP_AZURE_STORAGE_ACCOUNT || 'yourstorageaccount';
        const action = 'input';
        const sasResp = await apiService.requestSASToken(clientName, action);
        // Use sourceFilename from ClassifiedPdfMetadata
        const sourceFilename = statement?.pageMetadata.filename;
        console.log('Source filename:', sourceFilename);
        if (!sourceFilename) {
          setPdfError('No source filename available');
          return;
        }
        const url = `https://${storageAccountName}.blob.core.windows.net/${clientName}-input/${sourceFilename}?${sasResp.token}#page=${statement?.pageMetadata.pages[0]}`;
        console.log('PDF URL:', url);
        setPdfUrl(url);
        pdfUrlRef.current = url;
      } catch (e: any) {
        console.error('PDF loading error:', e);
        setPdfError(e.message || 'Failed to load PDF');
      } finally {
        setPdfLoading(false);
      }
    };
    
    // Check if we already have a cached URL for this statement
    const sourceFilename = statement?.pageMetadata.filename;
    if (pdfUrlRef.current && sourceFilename && pdfUrlRef.current.includes(sourceFilename)) {
      // Use cached URL
      setPdfUrl(pdfUrlRef.current);
      setPdfLoading(false);
      setPdfError(null);
    } else if (sourceFilename && !pdfUrl) {
      // Fetch new URL
      fetchSas();
    }
  }, [clientName, accountNumber, classification, date, statement?.pageMetadata.filename]);

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