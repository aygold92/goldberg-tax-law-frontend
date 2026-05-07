import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import apiService from '../services/api';
import styles from '../styles/components/PdfDisplay.module.css';

interface PdfDisplayProps {
  fileId: string;
  pages?: number[];
}

const PDF_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const DB_NAME = 'pdfBlobCache';
const STORE_NAME = 'blobs';

const objectUrlCache = new Map<string, string>();

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME, { keyPath: 'fileId' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getCachedBlob(fileId: string): Promise<Blob | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(fileId);
    req.onsuccess = () => {
      const entry = req.result;
      if (!entry || Date.now() - entry.fetchedAt >= PDF_CACHE_TTL_MS) resolve(null);
      else resolve(entry.blob);
    };
    req.onerror = () => reject(new Error(`PDF cache read failed: ${req.error?.message}`));
  });
}

async function setCachedBlob(fileId: string, blob: Blob): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ fileId, blob, fetchedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error(`PDF cache write failed: ${tx.error?.message}`));
  });
}

const PdfDisplay: React.FC<PdfDisplayProps> = ({ fileId, pages }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) return;

    // Tier 1: within-tab object URL cache (instant, no I/O)
    const cachedObjectUrl = objectUrlCache.get(fileId);
    if (cachedObjectUrl) {
      setPdfUrl(`${cachedObjectUrl}#page=${pages?.[0] ?? 1}`);
      return;
    }

    const load = async () => {
      setPdfLoading(true);
      setPdfError(null);
      try {
        // Tier 2: IndexedDB blob cache (cross-tab, cross-reload)
        const cachedBlob = await getCachedBlob(fileId);
        if (cachedBlob) {
          const objectUrl = URL.createObjectURL(cachedBlob);
          objectUrlCache.set(fileId, objectUrl);
          setPdfUrl(`${objectUrl}#page=${pages?.[0] ?? 1}`);
          return;
        }

        // Tier 3: fetch from Azure Blob Storage
        const storageAccountName = process.env.REACT_APP_AZURE_STORAGE_ACCOUNT || '';
        const { token, storageLocation } = await apiService.fetchReadSASToken({ fileId });
        const blobUrl = `https://${storageAccountName}.blob.core.windows.net/${storageLocation.containerName}/${storageLocation.filePath}.${storageLocation.extension.toLowerCase()}?${token}`;
        const response = await fetch(blobUrl);
        const blob = await response.blob();
        await setCachedBlob(fileId, blob);
        const objectUrl = URL.createObjectURL(blob);
        objectUrlCache.set(fileId, objectUrl);
        setPdfUrl(`${objectUrl}#page=${pages?.[0] ?? 1}`);
      } catch (e: any) {
        console.error('PDF loading error:', e);
        setPdfError(e.userMessage || e.message || 'Failed to load PDF');
      } finally {
        setPdfLoading(false);
      }
    };

    load();
  }, [fileId]); // pages intentionally excluded — page anchor doesn't require a refetch

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
