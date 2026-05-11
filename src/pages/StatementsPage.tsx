import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Box, Typography, Paper, Button, Alert, CircularProgress, Stack, Snackbar, Popover, Tooltip, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { TableChart, Delete, Edit, ContentCopy, CheckCircle, Warning, Error, AccountBalance, CreditCard, Refresh, FactCheck, Analytics } from '@mui/icons-material';
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
import { formatDateForDisplay } from '../utils/dateUtils';
import { useAnalyzePages } from '../hooks/useAnalyzePages';
import ProcessingOptionsCheckboxes from '../components/ProcessingOptionsCheckboxes';
import DeleteStatementConfirmDialog from '../components/DeleteStatementConfirmDialog';

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

  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [forceReanalysis, setForceReanalysis] = useState(false);
  const [forceRecreate, setForceRecreate] = useState(true);
  const [replaceOnRecreate, setReplaceOnRecreate] = useState(true);
  const { analyzePages, analyzing } = useAnalyzePages();

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    status: 90,
    actions: 50,
    accountNumber: 120,
    classification: 140,
    date: 110,
    filename: 280,
    numTransactions: 90,
    totalSpending: 120,
    totalIncomeCredits: 120,
    createdAt: 160,
    updatedAt: 160,
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

  const duplicateIds = useMemo(() => {
    const groups = new Map<string, string[]>();
    statements.forEach(s => {
      const acct = s.statementDetails.accountNumber ?? '';
      const date = s.statementDetails.date ?? '';
      if (!acct && !date) return;
      const key = `${acct}::${date}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(s.statementDetails.statementId);
    });
    const ids = new Set<string>();
    groups.forEach(idList => {
      if (idList.length > 1) idList.forEach(id => ids.add(id));
    });
    return ids;
  }, [statements]);

  const rows = useMemo(() => statements.map((s: StatementSummary) => ({
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
    suspiciousReasons: s.suspiciousReasons,
    missingChecks: s.missingChecks.length > 0,
    isDuplicate: duplicateIds.has(s.statementDetails.statementId),
    manuallyVerified: s.manuallyVerified,
    manuallyChecked: s.statementDetails.createdAt !== s.statementDetails.updatedAt,
    createdAt: s.statementDetails.createdAt,
    updatedAt: s.statementDetails.updatedAt,
    classificationId: s.classification.info.classificationId,
  })), [statements, duplicateIds]);

  const filteredRows = useMemo(() => {
    if (activeFilters.length === 0) return rows;
    return rows.filter(row =>
      (activeFilters.includes('suspicious') && row.suspicious) ||
      (activeFilters.includes('multiple') && row.isDuplicate) ||
      (activeFilters.includes('missingChecks') && row.missingChecks) ||
      (activeFilters.includes('noTransactions') && row.numTransactions === 0)
    );
  }, [rows, activeFilters]);

  if (!selectedClient) {
    return (
      <Box>
        <ClientSelector />
        <Alert severity="info">Please select a client to view statements.</Alert>
      </Box>
    );
  }

  const selectedIds = selectionModel as string[];

  const selectedManuallyReviewedCount = selectedIds.filter(
    id => rows.find(r => r.id === id)?.manuallyChecked
  ).length;

  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    if (selectedManuallyReviewedCount > 0) {
      setDeleteConfirmOpen(true);
    } else {
      confirmDelete();
    }
  };

  const confirmDelete = () => {
    dispatch(deleteStatements({ statementIds: selectedIds }));
    setSelectionModel([]);
    setDeleteConfirmOpen(false);
  };

  const handleRefresh = () => {
    if (selectedClientId) {
      dispatch(fetchStatements({ clientId: selectedClientId }));
    }
  };

  const handleAnalyzePages = async () => {
    const classificationIds = selectedIds
      .map(id => rows.find(r => r.id === id)?.classificationId)
      .filter((id): id is string => !!id);
    if (classificationIds.length === 0) return;

    const processingOptions = (forceReanalysis || forceRecreate || replaceOnRecreate)
      ? { forceReanalysis, forceRecreate, replaceOnRecreate }
      : undefined;

    const success = await analyzePages(classificationIds, processingOptions);
    setSnackbarMsg(success ? 'Analysis started successfully!' : 'Analysis failed. Please try again.');
    setSnackbarOpen(true);
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
        const { suspicious, missingChecks, numTransactions, isDuplicate } = params.row;
        const warnings: string[] = [];
        if (missingChecks) warnings.push('Missing checks detected');
        if (numTransactions === 0) warnings.push('No transactions');
        if (isDuplicate) warnings.push('Duplicate statement (same account and date)');
        return (
          <Box className={styles.statusCell}>
            {suspicious ? (
              <Tooltip title={
                <Box>
                  {(params.row.suspiciousReasons as string[]).map((r, i) => (
                    <div key={i}>{r}</div>
                  ))}
                </Box>
              }>
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
            {params.row.manuallyChecked && (
              <Tooltip title="Manually reviewed">
                <FactCheck color="info" fontSize="small" />
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
      valueFormatter: (value: any) => formatDateForDisplay(value),
      sortComparator: (v1, v2) => {
        if (!v1 && !v2) return 0;
        if (!v1) return 1;
        if (!v2) return -1;
        return new Date(v1).getTime() - new Date(v2).getTime();
      },
    },
    {
      field: 'filename',
      headerName: 'Filename',
      width: columnWidths.filename,
      valueGetter: (_value: any, row: any) => `${row.filename ?? ''}${formatPages(row.pages ?? [])}`,
      sortComparator: (v1, v2) => String(v1).localeCompare(String(v2)),
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
      valueFormatter: (value: any) => value != null ? `$${Math.abs(Number(value)).toLocaleString()}` : '$0.00',
    },
    {
      field: 'totalIncomeCredits',
      headerName: 'Income',
      width: columnWidths.totalIncomeCredits,
      valueFormatter: (value: any) => value != null ? `$${Number(value).toLocaleString()}` : '$0.00',
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: columnWidths.createdAt,
      valueFormatter: (value: any) => value > 0 ? new Date(value).toLocaleString() : '',
    },
    {
      field: 'updatedAt',
      headerName: 'Last Modified',
      width: columnWidths.updatedAt,
      valueFormatter: (value: any) => value > 0 ? new Date(value).toLocaleString() : '',
    },
  ];

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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }} className={styles.actionsContainer}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
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
            <ToggleButtonGroup
              value={activeFilters}
              onChange={(_e, newFilters) => setActiveFilters(newFilters)}
              size="small"
              sx={{ flexWrap: 'wrap', gap: 0.5 }}
            >
              <ToggleButton value="suspicious" color="error" sx={{ gap: 0.5 }}>
                <Error fontSize="small" /> Suspicious
              </ToggleButton>
              <ToggleButton value="multiple" color="warning" sx={{ gap: 0.5 }}>
                <ContentCopy fontSize="small" /> Multiple
              </ToggleButton>
              <ToggleButton value="missingChecks" color="warning" sx={{ gap: 0.5 }}>
                <FactCheck fontSize="small" /> Missing Checks
              </ToggleButton>
              <ToggleButton value="noTransactions" sx={{ gap: 0.5 }}>
                <Warning fontSize="small" /> No Transactions
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <ProcessingOptionsCheckboxes
              forceReanalysis={forceReanalysis}
              forceRecreate={forceRecreate}
              replaceOnRecreate={replaceOnRecreate}
              onChange={({ forceReanalysis: fr, forceRecreate: fc, replaceOnRecreate: rr }) => {
                setForceReanalysis(fr);
                setForceRecreate(fc);
                setReplaceOnRecreate(rr);
              }}
              disabled={analyzing}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={analyzing ? <CircularProgress size={16} color="inherit" /> : <Analytics />}
              disabled={selectedIds.length === 0 || analyzing}
              onClick={handleAnalyzePages}
              className={styles.actionButton}
            >
              {analyzing ? 'Analyzing...' : 'Analyze Pages'}
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
        </Box>

        {loading ? (
          <Box className={styles.loadingContainer}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <DataGrid
            autoHeight
            rows={filteredRows}
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

      <DeleteStatementConfirmDialog
        open={deleteConfirmOpen}
        totalCount={selectedIds.length}
        manuallyReviewedCount={selectedManuallyReviewedCount}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

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
