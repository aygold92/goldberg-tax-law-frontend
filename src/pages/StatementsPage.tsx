import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Paper, Button, Alert, CircularProgress, Stack, Snackbar, Popover, Tooltip } from '@mui/material';
import { TableChart, Delete, Edit, ContentCopy, CheckCircle, Warning, Error, AccountBalance, CreditCard, Refresh } from '@mui/icons-material';
import { DataGrid, GridColDef, GridRowSelectionModel, GridToolbar } from '@mui/x-data-grid';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectStatements, selectStatementsLoading, selectStatementsError } from '../redux/features/statementsList/statementsListSelectors';
import { fetchStatements, deleteStatements } from '../redux/features/statementsList/statementsListSlice';
import { selectSelectedClient, selectSelectedClientId, selectSelectedClientName } from '../redux/features/client/clientSelectors';
import { StatementSummary } from '../types/api';
import ClientSelector from '../components/ClientSelector';
import { AccountSummary } from '../components/AccountSummary';
import { usePageTitle } from '../hooks/usePageTitle';
import styles from '../styles/components/StatementsPage.module.css';

const formatPages = (pages: number[]): string => {
  if (!pages || pages.length === 0) return '';
  const sorted = [...pages].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0], end = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) { end = sorted[i]; }
    else { ranges.push(start === end ? `${start}` : `${start}-${end}`); start = end = sorted[i]; }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return `[${ranges.join(',')}]`;
};

const StatementsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedClient = useAppSelector(selectSelectedClient);
  const selectedClientId = useAppSelector(selectSelectedClientId);
  const selectedClientName = useAppSelector(selectSelectedClientName);
  const statements = useAppSelector(selectStatements) as StatementSummary[];
  const loading = useAppSelector(selectStatementsLoading);
  const error = useAppSelector(selectStatementsError);
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle('View Statements');
  }, [setPageTitle]);

  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [filenamePopover, setFilenamePopover] = useState<{ anchorEl: HTMLElement | null; filename: string }>({ anchorEl: null, filename: '' });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    status: 50,
    actions: 50,
    accountNumber: 120,
    classification: 140,
    date: 110,
    filename: 280,
    numTransactions: 90,
    totalSpending: 120,
    totalIncomeCredits: 120,
  });

  useEffect(() => {
    if (selectedClientId) {
      dispatch(fetchStatements({ clientId: selectedClientId }));
    }
  }, [dispatch, selectedClientId]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
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

  const selectedIds = selectionModel as string[];

  const handleDelete = () => {
    if (selectedIds.length > 0) {
      dispatch(deleteStatements({ statementIds: selectedIds }));
      setSelectionModel([]);
    }
  };

  const handleRefresh = () => {
    if (selectedClientId) {
      dispatch(fetchStatements({ clientId: selectedClientId }));
    }
  };

  const handleEditStatement = (statementId: string) => {
    const params = new URLSearchParams({ statementId });
    if (selectedClientId) params.set('clientId', selectedClientId);
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
    if (field) setColumnWidths(prev => ({ ...prev, [field]: params.width }));
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
      disableColumnMenu: true,
      renderCell: (params) => {
        const { suspicious, missingChecks, numTransactions } = params.row;
        const warnings: string[] = [];
        if (missingChecks) warnings.push('Missing checks detected');
        if (numTransactions === 0) warnings.push('No transactions');
        return (
          <Box className={styles.statusCell}>
            {suspicious ? (
              <Tooltip title="Needs verification">
                <Error color="error" fontSize="small" />
              </Tooltip>
            ) : (
              <Tooltip title="Verified">
                <CheckCircle color="success" fontSize="small" />
              </Tooltip>
            )}
            {warnings.length > 0 && (
              <Tooltip title={warnings.join(', ')}>
                <Warning color="warning" fontSize="small" />
              </Tooltip>
            )}
          </Box>
        );
      },
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
      renderCell: (params) => (
        <Tooltip title="Edit statement">
          <Button
            size="small"
            onClick={() => handleEditStatement(params.row.statementId)}
            className={styles.actionButton}
          >
            <Edit fontSize="small" />
          </Button>
        </Tooltip>
      ),
    },
    { field: 'accountNumber', headerName: 'Account #', width: columnWidths.accountNumber },
    {
      field: 'classification',
      headerName: 'Classification',
      width: columnWidths.classification,
      renderCell: (params) => {
        const isCreditCard = params.value?.includes(' CC');
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isCreditCard
              ? <CreditCard fontSize="small" color="secondary" />
              : <AccountBalance fontSize="small" color="primary" />}
            <span>{params.value}</span>
          </Box>
        );
      },
    },
    {
      field: 'date',
      headerName: 'Date',
      width: columnWidths.date,
      sortComparator: (v1, v2) => {
        if (!v1 && !v2) return 0;
        if (!v1) return 1;
        if (!v2) return -1;
        const parse = (d: string) => {
          const p = d.split('/');
          if (p.length !== 3) return null;
          return new Date(parseInt(p[2]), parseInt(p[0]) - 1, parseInt(p[1]));
        };
        const d1 = parse(v1), d2 = parse(v2);
        if (!d1 && !d2) return 0;
        if (!d1) return 1;
        if (!d2) return -1;
        return d1.getTime() - d2.getTime();
      },
    },
    {
      field: 'filename',
      headerName: 'Filename',
      width: columnWidths.filename,
      renderCell: (params) => (
        <Box className={styles.filenameCell} onDoubleClick={(e) => handleFilenameClick(e, params.row.filename)}>
          {params.row.filename} {formatPages(params.row.pages)}
        </Box>
      ),
    },
    { field: 'numTransactions', headerName: '# Txns', width: columnWidths.numTransactions },
    {
      field: 'totalSpending',
      headerName: 'Spending',
      width: columnWidths.totalSpending,
      valueFormatter: (value: any) => value != null ? `$${Number(value).toLocaleString()}` : '$0.00',
    },
    {
      field: 'totalIncomeCredits',
      headerName: 'Income',
      width: columnWidths.totalIncomeCredits,
      valueFormatter: (value: any) => value != null ? `$${Number(value).toLocaleString()}` : '$0.00',
    },
  ];

  const rows = statements.map((s: StatementSummary) => ({
    id: s.statementDetails.statementId,
    statementId: s.statementDetails.statementId,
    accountNumber: s.statementDetails.accountNumber,
    classification: s.classification.info.classificationType,
    date: s.statementDetails.date,
    filename: s.classification.inputFile.info.fileName,
    pages: s.classification.info.pages,
    numTransactions: s.numTransactions,
    totalSpending: s.totalSpending,
    totalIncomeCredits: s.totalIncomeCredits,
    suspicious: s.suspiciousReasons.length > 0,
    missingChecks: s.missingChecks.length > 0,
    manuallyVerified: s.manuallyVerified,
  }));

  return (
    <Box className={styles.pageContainer}>
      <ClientSelector />
      <Box className={styles.headerContainer}>
        <TableChart className={styles.headerIcon} />
        <Typography variant="h4">View Statements</Typography>
        {selectedClientName && (
          <Typography variant="subtitle1" color="text.secondary">
            — {selectedClientName}
          </Typography>
        )}
      </Box>

      <AccountSummary statements={statements} selectedClientId={selectedClientId ?? undefined} />

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
            disabled={selectedIds.length === 0 || loading}
            onClick={handleDelete}
            className={styles.actionButton}
          >
            Delete Selected
          </Button>
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
            rows={rows}
            columns={columns}
            checkboxSelection
            disableRowSelectionOnClick
            rowSelectionModel={selectionModel}
            onRowSelectionModelChange={setSelectionModel}
            onColumnWidthChange={handleColumnWidthChange}
            pageSizeOptions={[25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 100 } },
            }}
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true } }}
            className={styles.dataGrid}
          />
        )}
      </Paper>

      <Popover
        open={Boolean(filenamePopover.anchorEl)}
        anchorEl={filenamePopover.anchorEl}
        onClose={() => setFilenamePopover({ anchorEl: null, filename: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box className={styles.popoverContent}>
          <Typography variant="body2" sx={{ mb: 1 }}>{filenamePopover.filename}</Typography>
          <Button size="small" startIcon={<ContentCopy />} onClick={handleCopyFilename}>Copy</Button>
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
