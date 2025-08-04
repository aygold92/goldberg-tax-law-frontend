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
import { TableChart, Delete, Download, Edit, Search, ContentCopy, CheckCircle, Warning, Error, AccountBalance, CreditCard } from '@mui/icons-material';
import { DataGrid, GridColDef, GridRowSelectionModel, GridToolbar } from '@mui/x-data-grid';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectStatements, selectStatementsLoading, selectStatementsError, selectSpreadsheetResult, selectSpreadsheetLoading, selectSpreadsheetError } from '../redux/features/statementsList/statementsListSelectors';
import { fetchStatements, deleteStatements, createSpreadsheet, clearSpreadsheetResult } from '../redux/features/statementsList/statementsListSlice';
import { selectSelectedClient } from '../redux/features/client/clientSelectors';
import { BankStatementKey, BankStatementMetadata } from '../types/api';
import ClientSelector from '../components/ClientSelector';

const StatementsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedClient = useAppSelector(selectSelectedClient);
  const statements = useAppSelector(selectStatements) || [];
  const loading = useAppSelector(selectStatementsLoading);
  const error = useAppSelector(selectStatementsError);
  const spreadsheetResult = useAppSelector(selectSpreadsheetResult);
  const spreadsheetLoading = useAppSelector(selectSpreadsheetLoading);
  const spreadsheetError = useAppSelector(selectSpreadsheetError);

  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [searchText, setSearchText] = useState('');
  const [filenamePopover, setFilenamePopover] = useState<{ anchorEl: HTMLElement | null; filename: string }>({ anchorEl: null, filename: '' });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (selectedClient) {
      dispatch(fetchStatements({ clientName: selectedClient }));
    }
  }, [dispatch, selectedClient]);

  useEffect(() => {
    if (spreadsheetResult && spreadsheetResult.status === 'success') {
      setSnackbarMsg('Spreadsheet created successfully!');
      setSnackbarOpen(true);
      // TODO: handle spreadsheetResult (download links, etc.)
      dispatch(clearSpreadsheetResult());
    }
    if (spreadsheetError) {
      setSnackbarMsg(spreadsheetError);
      setSnackbarOpen(true);
    }
  }, [spreadsheetResult, spreadsheetError, dispatch]);

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

  const selectedKeys: BankStatementKey[] = selectionModel.map((id) => {
    const stmt = statements.find((s) => s.metadata.md5 === id);
    return stmt ? stmt.key : null;
  }).filter(Boolean) as BankStatementKey[];

  const handleDelete = () => {
    if (selectedKeys.length > 0) {
      dispatch(deleteStatements({ clientName: selectedClient, keys: selectedKeys }));
      setSelectionModel([]);
    }
  };

  const handleCreateSpreadsheet = () => {
    if (selectedKeys.length > 0) {
      dispatch(createSpreadsheet({ clientName: selectedClient, keys: selectedKeys, outputDirectory: '' }));
    }
  };

  const handleEditStatement = (key: BankStatementKey) => {
    const params = new URLSearchParams({
      clientName: selectedClient,
      accountNumber: key.accountNumber,
      classification: key.classification,
      date: key.date,
    });
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

  const columns: GridColDef[] = [
    {
      field: 'status',
      headerName: '',
      width: 50,
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
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 0.5,
            height: '100%',
            width: '100%'
          }}>
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
      width: 50,
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
            onClick={() => handleEditStatement(params.row.key)}
            sx={{ minWidth: 'auto', p: 0.5 }}
          >
            <Edit fontSize="small" />
          </Button>
        </Tooltip>
      )
    },
    { 
      field: 'accountNumber', 
      headerName: 'Account #', 
      width: 120,
      cellClassName: 'account-cell'
    },
    { 
      field: 'classification', 
      headerName: 'Classification', 
      width: 140,
      cellClassName: 'classification-cell',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
      width: 110,
      cellClassName: 'date-cell'
    },
    { 
      field: 'bankType', 
      headerName: 'Bank Type', 
      width: 150,
      cellClassName: 'bank-type-cell'
    },
    { 
      field: 'filename', 
      headerName: 'Filename', 
      width: 280,
      cellClassName: 'filename-cell',
      renderCell: (params) => {
        const pageRange = params.row.pageRange;
        const pageRangeText = pageRange && pageRange.first && pageRange.second ? `[${pageRange.first}-${pageRange.second}]` : '';
        const fullText = `${params.value}${pageRangeText}`;
        
        return (
          <Box
            sx={{
              cursor: 'pointer',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            onDoubleClick={(e) => handleFilenameClick(e, params.value)}
          >
            {fullText}
          </Box>
        );
      }
    },
    { 
      field: 'numTransactions', 
      headerName: '# Txns', 
      width: 90,
      cellClassName: 'transactions-cell'
    },
    { 
      field: 'totalSpending', 
      headerName: 'Spending', 
      width: 120,
      cellClassName: 'spending-cell',
      valueFormatter: (value: any) => {
        return value !== undefined && value !== null ? `$${Number(value).toLocaleString()}` : '$0.00';
      }
    },
    { 
      field: 'totalIncomeCredits', 
      headerName: 'Income', 
      width: 120,
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
    <Box sx={{ width: '100vw', maxWidth: 'none' }}>
      <ClientSelector />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <TableChart sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4">View Statements</Typography>
      </Box>
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3, width: '100%' }}>
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<Delete />}
            disabled={selectedKeys.length === 0 || loading}
            onClick={handleDelete}
            sx={{ borderRadius: 2 }}
          >
            Delete Selected
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Download />}
            disabled={selectedKeys.length === 0 || spreadsheetLoading}
            onClick={handleCreateSpreadsheet}
            sx={{ borderRadius: 2 }}
          >
            Create Spreadsheet
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
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
            pageSizeOptions={[10, 25, 50]}
            initialState={{ 
              pagination: { paginationModel: { pageSize: 25 } },
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
            sx={{
              width: '100%',
              '& .MuiDataGrid-root': {
                border: 'none',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #e0e0e0',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f5f5f5',
                borderBottom: '2px solid #e0e0e0',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f8f9fa',
              },
              '& .MuiDataGrid-row.Mui-selected': {
                backgroundColor: '#e3f2fd',
              },
              '& .MuiDataGrid-row.Mui-selected:hover': {
                backgroundColor: '#bbdefb',
              },
            }}
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
        <Box sx={{ p: 2, maxWidth: 400 }}>
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