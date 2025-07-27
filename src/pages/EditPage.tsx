/**
 * Edit Page component for editing bank statement data.
 * 
 * This page is currently a placeholder for future implementation:
 * - Will provide an Excel-like editing experience for transaction data
 * - Will allow inline editing of extracted statement information
 * - Will support bulk operations and data manipulation
 * 
 * Planned features include:
 * - Spreadsheet-like interface with grid editing
 * - Inline editing capabilities for transaction details
 * - Bulk operations (copy, paste, delete, move)
 * - Data validation and formatting rules
 * - Save changes to backend with conflict resolution
 * - Undo/redo functionality for user actions
 * - Advanced filtering and sorting capabilities
 * 
 * Currently shows a placeholder message while functionality is being developed.
 */

import React, { useEffect, useMemo } from 'react';
import { Box, Typography, Alert, CircularProgress, Tooltip, Badge } from '@mui/material';
import { Edit, Warning } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { loadBankStatement } from '../redux/features/statements/statementsSlice';
import {
  selectCurrentStatement,
  selectCurrentStatementLoading,
  selectCurrentStatementError,
} from '../redux/features/statements/statementsSelectors';
import { ReactGrid, Column, Row, Id } from '@silevis/reactgrid';
import '@silevis/reactgrid/styles.css';
import { Rnd } from 'react-rnd';
import apiService from '../services/api';
import { useState } from 'react';

// Helper to parse query params
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const EditPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const query = useQuery();
  const clientName = query.get('clientName') || '';
  const accountNumber = query.get('accountNumber') || '';
  const classification = query.get('classification') || '';
  const date = query.get('date') || '';

  const statement = useAppSelector(selectCurrentStatement);
  const loading = useAppSelector(selectCurrentStatementLoading);
  const error = useAppSelector(selectCurrentStatementError);

  // PDF SAS token state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Column width state for resizable tables
  const [detailsColumnWidths, setDetailsColumnWidths] = useState({ key: 180, value: 220 });
  const [pagesColumnWidths, setPagesColumnWidths] = useState({ filePageNumber: 100, batesStamp: 150 });
  const [transactionColumnWidths, setTransactionColumnWidths] = useState({
    suspiciousReasons: 32,
    date: 110,
    description: 200,
    amount: 110,
    filePageNumber: 80,
    checkNumber: 90,
    checkFilename: 120,
    checkFilePage: 90,
    actions: 90,
  });

  // Load statement data
  useEffect(() => {
    if (clientName && accountNumber && classification && date) {
      console.log('Loading statement with params:', { clientName, accountNumber, classification, date });
      dispatch(loadBankStatement({ clientName, accountNumber, classification, date }));
    }
  }, [clientName, accountNumber, classification, date, dispatch]);

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
        const url = `https://${storageAccountName}.blob.core.windows.net/${clientName}-input/${sourceFilename}?${sasResp.token}`;
        console.log('PDF URL:', url);
        setPdfUrl(url);
      } catch (e: any) {
        console.error('PDF loading error:', e);
        setPdfError(e.message || 'Failed to load PDF');
      } finally {
        setPdfLoading(false);
      }
    };
    
    // Only fetch PDF if we have a statement with filename
    if (statement?.pageMetadata.filename) {
      fetchSas();
    }
  }, [clientName, accountNumber, classification, date, statement?.pageMetadata.filename]);

  // --- Suspicious Reasons ---
  const apiSuspicious = statement?.suspiciousReasons || [];
  const calcSuspicious: string[] = []; // calculated, always empty for now

  // --- Net Income Calculation ---
  let expectedValue: number | null = null;
  let actualValue: number | null = null;
  let netMatch: boolean | null = null;
  let netError: string | null = null;
  if (statement) {
    if (statement.endingBalance != null && statement.beginningBalance != null) {
      expectedValue = statement.endingBalance - statement.beginningBalance;
      actualValue = statement.transactions.reduce((sum, t) => sum + t.amount, 0);
      netMatch = expectedValue === actualValue;
    } else {
      netError = 'Must specify beginning and ending balance';
    }
  }

  // --- Statement Details Table ---
  const detailsColumns: Column[] = [
    { columnId: 'key', width: detailsColumnWidths.key, resizable: true },
    { columnId: 'value', width: detailsColumnWidths.value, resizable: true },
  ];
  const detailsRows: Row[] = useMemo(() => {
    if (!statement) return [];
    return [
      { rowId: 'date', cells: [ { type: 'text' as const, text: 'Statement Date', nonEditable: true, style: { fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#1976d2' } }, { type: 'text' as const, text: statement.date || '' } ] },
      { rowId: 'account', cells: [ { type: 'text' as const, text: 'Account Number', nonEditable: true, style: { fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#1976d2' } }, { type: 'text' as const, text: statement.accountNumber || '' } ] },
      { rowId: 'classification', cells: [ { type: 'text' as const, text: 'Classification', nonEditable: true, style: { fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#1976d2' } }, { type: 'text' as const, text: statement.pageMetadata.classification || '' } ] },
      { rowId: 'interest', cells: [ { type: 'text' as const, text: 'Interest Charged', nonEditable: true, style: { fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#1976d2' } }, { type: 'text' as const, text: statement.interestCharged?.toString() || '' } ] },
      { rowId: 'fees', cells: [ { type: 'text' as const, text: 'Fees Charged', nonEditable: true, style: { fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#1976d2' } }, { type: 'text' as const, text: statement.feesCharged?.toString() || '' } ] },
    ];
  }, [statement]);

  // --- Pages Table ---
  const pagesColumns: Column[] = [
    { columnId: 'filePageNumber', width: pagesColumnWidths.filePageNumber, resizable: true },
    { columnId: 'batesStamp', width: pagesColumnWidths.batesStamp, resizable: true },
  ];
  const pagesRows: Row[] = useMemo(() => {
    if (!statement) return [];
    return [
      { 
        rowId: 'header', 
        cells: [ 
          { type: 'text' as const, text: 'Page #', nonEditable: true, style: { fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#1976d2' } }, 
          { type: 'text' as const, text: 'Bates Stamp', nonEditable: true, style: { fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#1976d2' } } 
        ] 
      },
      ...statement.pageMetadata.pages.map((page) => ({
        rowId: String(page),
        cells: [
          { type: 'text' as const, text: String(page) },
          { type: 'text' as const, text: statement.batesStamps[page] || '' },
        ],
      })),
    ];
  }, [statement]);

  // --- Transactions Table ---
  const transactionColumns: Column[] = useMemo(() => {
    const baseCols: Column[] = [
      {
        columnId: 'suspiciousReasons',
        width: transactionColumnWidths.suspiciousReasons,
        resizable: false,
        reorderable: false,
      },
      { columnId: 'date', width: transactionColumnWidths.date, resizable: true },
      { columnId: 'description', width: transactionColumnWidths.description, resizable: true },
      { columnId: 'amount', width: transactionColumnWidths.amount, resizable: true },
      { columnId: 'filePageNumber', width: transactionColumnWidths.filePageNumber, resizable: true },
    ];
    if (true /* BANK */) {
      baseCols.push(
        { columnId: 'checkNumber', width: transactionColumnWidths.checkNumber, resizable: true },
        { columnId: 'checkFilename', width: transactionColumnWidths.checkFilename, resizable: true },
        { columnId: 'checkFilePage', width: transactionColumnWidths.checkFilePage, resizable: true },
      );
    }
    baseCols.push({
      columnId: 'actions',
      width: transactionColumnWidths.actions,
      resizable: false,
      reorderable: false,
    });
    return baseCols;
  }, [transactionColumnWidths]);
  const transactionRows: Row[] = useMemo(() => {
    if (!statement) return [];
    const headerCells: any[] = [
      { type: 'text' as const, text: '' }, // suspiciousReasons - no header
      { type: 'text' as const, text: 'Date', nonEditable: true, style: { fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#1976d2' } },
      { type: 'text' as const, text: 'Description', nonEditable: true, style: { fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#1976d2' } },
      { type: 'text' as const, text: 'Amount', nonEditable: true, style: { fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#1976d2' } },
      { type: 'text' as const, text: 'Page #', nonEditable: true, style: { fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#1976d2' } },
    ];
    if (true) {
      headerCells.push(
        { type: 'text' as const, text: 'Check #', nonEditable: true, style: { fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#1976d2' } },
        { type: 'text' as const, text: 'Check File', nonEditable: true, style: { fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#1976d2' } },
        { type: 'text' as const, text: 'Check Pg', nonEditable: true, style: { fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#1976d2' } },
      );
    }
    headerCells.push({ type: 'text' as const, text: '' }); // actions - no header
    
    return [
      { rowId: 'header', cells: headerCells },
      ...statement.transactions.map((txn, idx) => {
        const cells: any[] = [];
        cells.push({
          type: 'text' as const,
          text: (txn.suspiciousReasons && txn.suspiciousReasons.length > 0) ? '⚠️' : '',
          nonEditable: true,
        });
        cells.push({ type: 'text' as const, text: txn.date });
        cells.push({ type: 'text' as const, text: txn.description });
        cells.push({ type: 'text' as const, text: `$${txn.amount.toFixed(2)}` });
        cells.push({ type: 'text' as const, text: String(txn.filePageNumber) });
        if (true) {
          cells.push({ type: 'text' as const, text: txn.checkNumber ? String(txn.checkNumber) : '' });
          cells.push({ type: 'text' as const, text: txn.checkDataModel?.description || '' });
          cells.push({ type: 'text' as const, text: txn.checkDataModel?.date || '' });
        }
        cells.push({
          type: 'text' as const,
          text: '⭯ 📄 🗑️',
          nonEditable: true,
        });
        return { rowId: txn.id, cells };
      }),
    ];
  }, [statement]);

  // --- Heading and Layout ---
  const heading = statement
    ? `Edit Statement ${clientName} ${statement.pageMetadata.classification}-${accountNumber}: ${date}`
    : 'Edit Statement';
  const filename = statement?.pageMetadata.filename;

  return (
    <Box>
      {/* Heading */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Edit sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4">{heading}</Typography>
      </Box>
      {filename && (
        <Typography variant="subtitle1" sx={{ mb: 2, color: 'text.secondary' }}>
          Source file: <b>{filename}</b>
        </Typography>
      )}
      {/* Suspicious Reasons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {calcSuspicious.length > 0 && (
            <Tooltip title="Calculated suspicious reasons">
              <Warning color="error" />
            </Tooltip>
          )}
          {calcSuspicious.length > 0 && (
            <ul style={{ color: 'red', margin: 0 }}>
              {calcSuspicious.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {apiSuspicious.length > 0 && (
            <Tooltip title="API suspicious reasons">
              <Warning color="error" />
            </Tooltip>
          )}
          {apiSuspicious.length > 0 && (
            <ul style={{ color: 'red', margin: 0 }}>
              {apiSuspicious.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}
        </Box>
      </Box>
      {/* Details and Pages Tables */}
      <Box sx={{ display: 'flex', gap: 4, mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Statement Details</Typography>
          <Box>
            <ReactGrid 
              columns={detailsColumns} 
              rows={detailsRows} 
              onColumnResized={(columnId: any, width: number) => {
                setDetailsColumnWidths(prev => ({ ...prev, [columnId]: width }));
              }}
            />
          </Box>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Pages Used</Typography>
          <Box>
            <ReactGrid 
              columns={pagesColumns} 
              rows={pagesRows} 
              onColumnResized={(columnId: any, width: number) => {
                setPagesColumnWidths(prev => ({ ...prev, [columnId]: width }));
              }}
            />
          </Box>
        </Box>
      </Box>
      {/* Net Income Calculation */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Net Income Calculation</Typography>
        <Box sx={{ 
          p: 2,
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          backgroundColor: '#fafafa',
          fontFamily: 'monospace',
          fontSize: '16px'
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Ending Balance */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ minWidth: '160px', textAlign: 'right' }}>
                Ending Balance:
              </Typography>
              <Typography variant="body1" sx={{ minWidth: '120px', textAlign: 'right', ml: 2 }}>
                ${statement?.endingBalance?.toFixed(2) || '0.00'}
              </Typography>
            </Box>
            
            {/* Minus sign */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ minWidth: '160px', textAlign: 'right' }}></Typography>
              <Typography variant="body1" sx={{ minWidth: '120px', textAlign: 'right', ml: 2 }}>
                -
              </Typography>
            </Box>
            
            {/* Beginning Balance */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ minWidth: '160px', textAlign: 'right' }}>
                Beginning Balance:
              </Typography>
              <Typography variant="body1" sx={{ minWidth: '120px', textAlign: 'right', ml: 2 }}>
                ${statement?.beginningBalance?.toFixed(2) || '0.00'}
              </Typography>
            </Box>
            
            {/* Divider line */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ minWidth: '160px', textAlign: 'right' }}></Typography>
              <Typography variant="body1" sx={{ 
                minWidth: '120px', 
                textAlign: 'right', 
                ml: 2,
                pt: 0.5
              }}>
                ─────────
              </Typography>
            </Box>
            
            {/* Expected Value and Actual */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ minWidth: '160px', textAlign: 'right' }}>
                Expected Value:
              </Typography>
              <Typography variant="body1" sx={{ minWidth: '120px', textAlign: 'right', ml: 2 }}>
                {statement?.endingBalance && statement?.beginningBalance ? (
                  `$${(statement.endingBalance - statement.beginningBalance).toFixed(2)}`
                ) : (
                  <Tooltip title="Must specify beginning and ending balance">
                    <span>⚠️</span>
                  </Tooltip>
                )}
              </Typography>
              {actualValue !== null && (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, gap: 0.5 }}>
                  <Badge 
                    badgeContent={`Actual: $${actualValue.toFixed(2)}`}
                    color={expectedValue !== null && Math.abs(expectedValue - actualValue) < 0.01 ? 'success' : 'error'}
                    sx={{ 
                      '& .MuiBadge-badge': {
                        fontSize: '12px',
                        height: '18px',
                        minWidth: '100px',
                        // padding: '0 4px'
                      }
                    }}
                  >
                    <Box sx={{ width: '45px', height: '0px' }} />
                  </Badge>
                  <Typography variant="body1">)</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
      {/* Transactions Table */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Transactions</Typography>
        <Box>
          <ReactGrid 
            columns={transactionColumns} 
            rows={transactionRows} 
            onColumnResized={(columnId: any, width: number) => {
              setTransactionColumnWidths(prev => ({ ...prev, [columnId]: width }));
            }}
          />
        </Box>
      </Box>
      {/* PDF Display */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>PDF Display</Typography>
        {pdfLoading && <CircularProgress />}
        {pdfError && <Alert severity="error">{pdfError}</Alert>}
        {pdfUrl && (
          <Rnd
            default={{ x: 0, y: 0, width: '100%', height: 600 }}
            minWidth={300}
            minHeight={200}
            bounds="window"
            style={{ border: '1px solid #ccc', background: '#fff', zIndex: 10 }}
          >
            <iframe src={pdfUrl} title="Statement PDF" style={{ width: '100%', height: '100%', border: 'none' }} />
          </Rnd>
        )}
      </Box>
    </Box>
  );
};

export default EditPage; 