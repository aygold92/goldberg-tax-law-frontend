/**
 * Statements Page component for viewing and managing extracted bank statement data.
 *
 * This page displays all processed bank statements for the selected client, including:
 * - Statement metadata and summary information in a table
 * - Checkbox selection for bulk actions
 * - Delete and Create Spreadsheet actions for selected statements
 * - Search and filtering capabilities
 * - Edit links for individual statements
 *
 * Uses Redux for state management and MUI DataGrid for the table UI.
 *
 * Depends on:
 * - src/redux/features/statementsList/statementsListSlice
 * - src/redux/features/statementsList/statementsListSelectors
 * - src/redux/features/client/clientSelectors
 * - @mui/x-data-grid for the table
 */

import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Paper, Button, Alert, CircularProgress, Stack, Snackbar, Popover, TextField, InputAdornment, Tooltip } from '@mui/material';
import { TableChart, Delete, Download, Edit, Search, ContentCopy, CheckCircle, Warning, Error, AccountBalance, CreditCard, Refresh } from '@mui/icons-material';
import { DataGrid, GridColDef, GridRowSelectionModel, GridToolbar } from '@mui/x-data-grid';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectStatements, selectStatementsLoading, selectStatementsError } from '../redux/features/statementsList/statementsListSelectors';
import { fetchStatements, deleteStatements } from '../redux/features/statementsList/statementsListSlice';
import CsvOutputDropdown from '../components/CsvOutputDropdown';
import { selectSelectedClient } from '../redux/features/client/clientSelectors';
import { BankStatementKey, BankStatementMetadata } from '../types/api';
import ClientSelector from '../components/ClientSelector';
import { ReactGridTableExample } from '../components/ReactGridTable';
import { usePageTitle } from '../hooks/usePageTitle';
import { COLORS } from '../styles/constants';
import styles from '../styles/components/StatementsPage.module.css';
import { constructFilenameWithPages } from '../utils/filenameUtils';
import { AccountSummary } from '../components/AccountSummary';

const StatementsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedClient = useAppSelector(selectSelectedClient);
  const statements = useAppSelector(selectStatements) || [];
  const loading = useAppSelector(selectStatementsLoading);
  const error = useAppSelector(selectStatementsError);
  const { setPageTitle } = usePageTitle();

  // Set page title
  useEffect(() => {
    setPageTitle('View Statements');
  }, [setPageTitle]);

  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [searchText, setSearchText] = useState('');
  const [filenamePopover, setFilenamePopover] = useState<{ anchorEl: HTMLElement | null; filename: string }>({ anchorEl: null, filename: '' });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track column widths to persist resizing
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    status: 50,
    actions: 50,
    accountNumber: 120,
    classification: 140,
    date: 110,
    bankType: 150,
    filename: 280,
    numTransactions: 90,
    totalSpending: 120,
    totalIncomeCredits: 120,
  });

  useEffect(() => {
    if (selectedClient) {
      dispatch(fetchStatements({ clientName: selectedClient }));
    }
  }, [dispatch, selectedClient]);


  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  if (!selectedClient) {
    return (
      <Box>
        <ClientSelector />
        <Alert severity="info">Please select a client to view statements.</Alert>
      </Box>
    );
  }

  const selectedStatements: BankStatementMetadata[] = selectionModel.map((id) => {
    return statements.find((s) => s.metadata.md5 === id);
  }).filter(Boolean) as BankStatementMetadata[];

  const handleDelete = () => {
    if (selectedStatements.length > 0) {
      dispatch(deleteStatements({ clientName: selectedClient, statements: selectedStatements }));
      setSelectionModel([]);
    }
  };


  const handleRefresh = () => {
    if (selectedClient) {
      dispatch(fetchStatements({ clientName: selectedClient }));
    }
  };

  const handleEditStatement = (key: BankStatementKey, filename: string, pageRange: { first: number; second: number }) => {
    const params = new URLSearchParams({
      clientName: selectedClient,
      accountNumber: key.accountNumber,
      classification: key.classification,
      date: key.date,
    });
    
    // Add filenameWithPages if accountNumber or date is null
    if (key.accountNumber === 'null' || key.date === 'null') {
      const filenameWithPages = constructFilenameWithPages(filename, pageRange);
      params.append('filenameWithPages', filenameWithPages);
    }
    
    window.open(`/edit?${params.toString()}`, '_blank');
  };

  const handleFilenameClick = (event: React.MouseEvent<HTMLElement>, filename: string) => {
    setFilenamePopover({ anchorEl: event.currentTarget, filename });
  };

  const handleCopyFilename = () => {
    navigator.clipboard.writeText(filenamePopover.filename);
    setSnackbarMsg('Filename copied to clipboard!');
    setSnackbarOpen(true);
    setFilenamePopover({ anchorEl: null, filename: '' });
  };

  const handleColumnWidthChange = (params: { colDef: GridColDef; width: number }) => {
    const field = params.colDef.field;
    if (field) {
      setColumnWidths(prev => ({
        ...prev,
        [field]: params.width,
      }));
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'status',
      headerName: '',
      width: columnWidths.status,
      sortable: false,
      filterable: false,
      hideable: false,
      resizable: false,
      cellClassName: 'status-cell',
      disableColumnMenu: true,
      renderCell: (params) => {
        const { suspicious, missingChecks, manuallyVerified } = params.row;
        const needsAttention = suspicious; // Only show red if suspicious is true
        const hasMissingChecks = missingChecks;
        
        return (
          <Box className={styles.statusCell}>
            {needsAttention ? (
              <Tooltip title="Needs verification">
                <Error color="error" fontSize="small" />
              </Tooltip>
            ) : (
              <Tooltip title="Verified">
                <CheckCircle color="success" fontSize="small" />
              </Tooltip>
            )}
            {manuallyVerified && (
              <Tooltip title="Manually verified">
                <CheckCircle color="success" fontSize="small" />
              </Tooltip>
            )}
            {hasMissingChecks && (
              <Tooltip title="Missing checks detected">
                <Warning color="warning" fontSize="small" />
              </Tooltip>
            )}
          </Box>
        );
      }
    },
    {
      field: 'actions',
      headerName: '',
      width: columnWidths.actions,
      sortable: false,
      filterable: false,
      hideable: false,
      resizable: false,
      disableColumnMenu: true,
      cellClassName: 'actions-cell',
      renderCell: (params) => (
        <Tooltip title="Edit statement">
          <Button
            size="small"
            onClick={() => handleEditStatement(params.row.key, params.row.filename, params.row.pageRange)}
            className={styles.actionButton}
          >
            <Edit fontSize="small" />
          </Button>
        </Tooltip>
      )
    },
    { 
      field: 'accountNumber', 
      headerName: 'Account #', 
      width: columnWidths.accountNumber,
      cellClassName: 'account-cell'
    },
    { 
      field: 'classification', 
      headerName: 'Classification', 
      width: columnWidths.classification,
      cellClassName: 'classification-cell',
      renderCell: (params) => (
        <Box className={styles.classificationCell}>
          {params.row.bankType === 'BANK' ? (
            <AccountBalance fontSize="small" color="primary" />
          ) : params.row.bankType === 'CREDIT_CARD' ? (
            <CreditCard fontSize="small" color="secondary" />
          ) : null}
          <span>{params.value}</span>
        </Box>
      )
    },
    { 
      field: 'date', 
      headerName: 'Date', 
      width: columnWidths.date,
      cellClassName: 'date-cell',
      sortComparator: (v1, v2) => {
        // Handle null/undefined values
        if (!v1 && !v2) return 0;
        if (!v1) return 1;
        if (!v2) return -1;
        
        // Parse dates in mm/dd/yyyy format
        const parseDate = (dateStr: string): Date | null => {
          if (dateStr === 'null' || !dateStr) return null;
          const parts = dateStr.split('/');
          if (parts.length !== 3) return null;
          const month = parseInt(parts[0], 10) - 1; // Month is 0-indexed
          const day = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          return new Date(year, month, day);
        };
        
        const date1 = parseDate(v1);
        const date2 = parseDate(v2);
        
        if (!date1 && !date2) return 0;
        if (!date1) return 1;
        if (!date2) return -1;
        
        return date1.getTime() - date2.getTime();
      }
    },
    { 
      field: 'bankType', 
      headerName: 'Bank Type', 
      width: columnWidths.bankType,
      cellClassName: 'bank-type-cell'
    },
    { 
      field: 'filename', 
      headerName: 'Filename', 
      width: columnWidths.filename,
      cellClassName: 'filename-cell',
      valueGetter: (value, row) => {
        return constructFilenameWithPages(row.filename, row.pageRange);
      },
      renderCell: (params) => {
        const fullText = constructFilenameWithPages(params.row.filename, params.row.pageRange);
        
        return (
          <Box
            className={styles.filenameCell}
            onDoubleClick={(e) => handleFilenameClick(e, params.row.filename)}
          >
            {fullText}
          </Box>
        );
      }
    },
    { 
      field: 'numTransactions', 
      headerName: '# Txns', 
      width: columnWidths.numTransactions,
      cellClassName: 'transactions-cell'
    },
    { 
      field: 'totalSpending', 
      headerName: 'Spending', 
      width: columnWidths.totalSpending,
      cellClassName: 'spending-cell',
      valueFormatter: (value: any) => {
        return value !== undefined && value !== null ? `$${Number(value).toLocaleString()}` : '$0.00';
      }
    },
    { 
      field: 'totalIncomeCredits', 
      headerName: 'Income', 
      width: columnWidths.totalIncomeCredits,
      cellClassName: 'income-cell',
      valueFormatter: (value: any) => {
        return value !== undefined && value !== null ? `$${Number(value).toLocaleString()}` : '$0.00';
      }
    }
  ];

  const rows = statements.map((s) => ({
    id: s.metadata.md5,
    key: s.key, // Include the key for the edit action
    accountNumber: s.key.accountNumber,
    classification: s.key.classification,
    date: s.key.date,
    bankType: s.metadata.bankType,
    filename: s.metadata.filename,
    pageRange: s.metadata.pageRange,
    numTransactions: s.metadata.numTransactions,
    totalSpending: Number(s.metadata.totalSpending),
    totalIncomeCredits: Number(s.metadata.totalIncomeCredits),
    suspicious: s.metadata.suspicious,
    missingChecks: s.metadata.missingChecks,
    manuallyVerified: s.metadata.manuallyVerified,
  }));

  return (
    <Box className={styles.pageContainer}>
      <ClientSelector />
      <Box className={styles.headerContainer}>
        <TableChart className={styles.headerIcon} />
        <Typography variant="h4">View Statements</Typography>
      </Box>
      
      {/* Account Summary Component */}
      <AccountSummary statements={statements} selectedClient={selectedClient} />
      
      <Paper className={styles.paperContainer}>
        <Stack direction="row" spacing={2} className={styles.actionsContainer}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Refresh />}
            disabled={loading}
            onClick={handleRefresh}
            className={styles.actionButton}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<Delete />}
            disabled={selectedStatements.length === 0 || loading}
            onClick={handleDelete}
            className={styles.actionButton}
          >
            Delete Selected
          </Button>
          <CsvOutputDropdown
            clientName={selectedClient}
            selectedStatements={selectedStatements.map(s => s.key)}
            disabled={loading}
          />
        </Stack>

        {loading ? (
          <Box className={styles.loadingContainer}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <DataGrid
            autoHeight
            rows={rows as any[]}
            columns={columns}
            checkboxSelection
            disableRowSelectionOnClick
            rowSelectionModel={selectionModel}
            onRowSelectionModelChange={setSelectionModel}
            onColumnWidthChange={handleColumnWidthChange}
            pageSizeOptions={[25, 50, 100]}
            initialState={{ 
              pagination: { paginationModel: { pageSize: 100 } },
              filter: {
                filterModel: {
                  items: [],
                  quickFilterValues: [],
                },
              },
              columns: {
                columnVisibilityModel: {
                  bankType: false,
                },
              },
            }}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
              },
            }}
            className={styles.dataGrid}
          />
        )}
      </Paper>
      
      <Popover
        open={Boolean(filenamePopover.anchorEl)}
        anchorEl={filenamePopover.anchorEl}
        onClose={() => setFilenamePopover({ anchorEl: null, filename: '' })}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box className={styles.popoverContent}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {filenamePopover.filename}
          </Typography>
          <Button
            size="small"
            startIcon={<ContentCopy />}
            onClick={handleCopyFilename}
          >
            Copy
          </Button>
        </Box>
      </Popover>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMsg}
      />
    </Box>
  );
};

export default StatementsPage; 