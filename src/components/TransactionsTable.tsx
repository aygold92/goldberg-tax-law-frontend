/**
 * TransactionsTable component for editing bank statement transactions.
 * 
 * This component provides an editable table for transaction data:
 * - Transaction date, description, amount, page number
 * - Check information for BANK type statements
 * - Suspicious reasons indicators
 * - Action buttons for each transaction
 * 
 * Supports cell editing, sorting, and validation.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { Box, IconButton, Tooltip, Typography, ToggleButton, ToggleButtonGroup, Chip } from '@mui/material';
import { ViewCompact, ViewModule, ViewList, ViewStream, Restore, Warning, Add, TrendingUp, TrendingDown } from '@mui/icons-material';
import { ReactGrid, Row, CellChange, Id, DefaultCellTypes, DateCell, NumberCell, DropdownCell, TextCell, MenuOption, SelectionMode, CellLocation } from '@silevis/reactgrid';
import '@silevis/reactgrid/styles.css';
import { BankStatement } from '../types/bankStatement';
import { SortableHeaderCell, sortableHeaderTemplate, handleSort, sortRows, SortCriteria, getSortDirectionForColumn, getSortOrderForColumn } from './reactgrid/SortableHeaderCell';
import { calculateTransactionSuspiciousReasons } from '../utils/validation';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { addTransaction, deleteTransaction, duplicateTransaction, invertTransactionAmount, resetTransaction, batchUpdateMultipleTransactions } from '../redux/features/statementEditor/statementEditorSlice';
import { selectTransactionChanges } from '../redux/features/statementEditor/statementEditorSelectors';
import { TransactionHistoryRecord } from '../types/bankStatement';
import { customCellTemplate } from './reactgrid/CustomCell';
import { GridDeleteIcon } from '@mui/x-data-grid';
import { FileCopySharp, Iso } from '@mui/icons-material';
import { GenericFilter, GenericFilterPopover, FilterableColumn, GenericFilterState, GenericFilterCriteria, applyGenericFilters, QuickFilterConfig } from './reactgrid';

// Extend the default cell types to include our custom type
type CellTypes = DefaultCellTypes | SortableHeaderCell;

interface TransactionsTableProps {
  statement: BankStatement | null;
  isCreditCard: boolean;
  isSideBySide?: boolean;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  statement,
  isCreditCard,
  isSideBySide = false,
}) => {
  const dispatch = useAppDispatch();
  const { modified: modifiedTransactions, newItems: newTransactions } = useAppSelector(selectTransactionChanges);
  const headerStyle = { fontWeight: 'bold', background: '#f5f5f5', color: '#1976d2' };

  // Column width state - self-contained
  const [columnWidths, setColumnWidths] = useState({
    suspiciousReasons: 20,
    date: 110,
    description: 200,
    amount: 110,
    filePageNumber: 80,
    checkNumber: 90,
    checkFilename: 120,
    checkFilePage: 90,
    actions: 130,
  });

  // Sorting state - self-contained
  const [sorting, setSorting] = useState<SortCriteria>([]);
  
  // Table size state
  const [tableSize, setTableSize] = useState<'small' | 'medium' | 'large' | 'unbounded'>('medium');

  // Filter state
  const [filters, setFilters] = useState<GenericFilterState>({
    searchText: '',
    advancedFilters: [],
    quickFilters: {}
  });

  // Filter popover state
  const [filterPopover, setFilterPopover] = useState<{
    anchorEl: HTMLElement | null;
    columnId: string;
  } | null>(null);

  // Add row state
  const [addRowValues, setAddRowValues] = useState({
    date: null as Date | null,
    description: null as string | null,
    amount: null as number | null,
    filePageNumber: null as number | null,
    checkNumber: null as number | null,
    checkFilename: null as string | null,
    checkFilePage: null as number | null,
  });

  // Helper function to get row style based on change status
  const getRowStyle = (transactionId: string) => {
    if (newTransactions.includes(transactionId)) {
      return { background: 'rgba(76, 175, 79, 0.1)' }; // Light green for new
    } else if (modifiedTransactions.includes(transactionId)) {
      return { background: 'rgba(255, 235, 59, 0.1)' }; // Light yellow for modified
    }
    return {};
  };

  // Helper function to handle reset transaction
  const handleResetTransaction = (transactionId: string) => {
    dispatch(resetTransaction(transactionId));
  };

  // Quick filter configuration
  const quickFilterConfig: QuickFilterConfig[] = [
    {
      key: 'suspicious',
      icon: <Warning />,
      color: 'warning',
      tooltip: 'Show suspicious transactions',
      filterFunction: (rowId) => {
        const transaction = statement?.transactions.find(t => t.id === rowId);
        if (!transaction) return false;
        const reasons = calculateTransactionSuspiciousReasons(transaction, statement!);
        return reasons.length > 0;
      }
    },
    {
      key: 'new',
      icon: <Add />,
      color: 'primary',
      tooltip: 'Show new transactions',
      filterFunction: (rowId) => {
        const transaction = statement?.transactions.find(t => t.id === rowId);
        return newTransactions.includes(transaction?.id || '');
      }
    },
    {
      key: 'income',
      icon: <TrendingUp />,
      color: 'success',
      tooltip: 'Show income transactions',
      filterFunction: (rowId) => {
        const transaction = statement?.transactions.find(t => t.id === rowId);
        return (transaction?.amount || 0) > 0;
      }
    },
    {
      key: 'expenses',
      icon: <TrendingDown />,
      color: 'error',
      tooltip: 'Show expense transactions',
      filterFunction: (rowId) => {
        const transaction = statement?.transactions.find(t => t.id === rowId);
        return (transaction?.amount || 0) < 0;
      }
    }
  ];

  // Filter handlers
  const handleFilterClick = (columnId: string, event: React.MouseEvent) => {
    setFilterPopover({
      anchorEl: event.currentTarget as HTMLElement,
      columnId
    });
  };

  const handleApplyFilter = (filter: GenericFilterCriteria | null) => {
    if (filter) {
      // Remove existing filter for this column
      const existingFilters = filters.advancedFilters.filter(f => f.columnId !== filter.columnId);
      // Add new filter
      setFilters(prev => ({
        ...prev,
        advancedFilters: [...existingFilters, filter]
      }));
    } else {
      // Remove filter for this column
      setFilters(prev => ({
        ...prev,
        advancedFilters: prev.advancedFilters.filter(f => f.columnId !== filterPopover?.columnId)
      }));
    }
  };

  const handleCloseFilterPopover = () => {
    setFilterPopover(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        // Focus the search input - we'll need to add a ref to the search input
        const searchInput = document.querySelector('input[placeholder*="Search transactions"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const columns: FilterableColumn[] = useMemo(() => {
    const baseCols: FilterableColumn[] = [
      {
        columnId: 'suspiciousReasons',
        width: columnWidths.suspiciousReasons,
        resizable: false,
        reorderable: false,
        filterable: false, // No filtering for this column
        nonSearchable: true, // Not included in search
      },
      { 
        columnId: 'date', 
        width: columnWidths.date, 
        resizable: true,
        filterable: true,
        filterType: 'date',
        filterLabel: 'Date',
        nonSearchable: false, // Include in search
      },
      { 
        columnId: 'description', 
        width: columnWidths.description, 
        resizable: true,
        filterable: true,
        filterType: 'text',
        filterLabel: 'Description',
        nonSearchable: false, // Include in search
      },
      { 
        columnId: 'amount', 
        width: columnWidths.amount, 
        resizable: true,
        filterable: true,
        filterType: 'number',
        filterLabel: 'Amount',
        nonSearchable: false, // Include in search
      },
      { 
        columnId: 'filePageNumber', 
        width: columnWidths.filePageNumber, 
        resizable: true,
        filterable: true,
        filterType: 'number',
        filterLabel: 'Page #',
        nonSearchable: false, // Include in search
      },
    ];
    if (!isCreditCard) { // Only show check columns for BANK type
      baseCols.push(
        { 
          columnId: 'checkNumber', 
          width: columnWidths.checkNumber, 
          resizable: true,
          filterable: true,
          filterType: 'number',
          filterLabel: 'Check #',
          nonSearchable: false, // Include in search
        },
        { 
          columnId: 'checkFilename', 
          width: columnWidths.checkFilename, 
          resizable: true,
          filterable: true,
          filterType: 'text',
          filterLabel: 'Check File',
          nonSearchable: false, // Include in search
        },
        { 
          columnId: 'checkFilePage', 
          width: columnWidths.checkFilePage, 
          resizable: true,
          filterable: true,
          filterType: 'number',
          filterLabel: 'Check Pg',
          nonSearchable: false, // Include in search
        },
      );
    }
    baseCols.push({
      columnId: 'actions',
      width: columnWidths.actions,
      resizable: false,
      reorderable: false,
      filterable: false, // No filtering for this column
      nonSearchable: true, // Not included in search
    });
    return baseCols;
  }, [columnWidths, isCreditCard]);

  // Create header row
  const headerRow = useMemo(() => {
    const setSortingWrapper = (newSorting: SortCriteria | ((prev: SortCriteria) => SortCriteria)) => {
      if (typeof newSorting === 'function') {
        setSorting(newSorting(sorting));
      } else {
        setSorting(newSorting);
      }
    };

    const headerCells: any[] = [
      { columnId: 'suspiciousReasons', type: 'header' as const, text: '', nonEditable: true }, // suspiciousReasons - no header
      { columnId: 'date', type: 'sortableHeader' as const, text: `Date`, style: headerStyle, onSort: (columnId: string) => handleSort(columnId, sorting, setSortingWrapper), sortDirection: getSortDirectionForColumn('date', sorting), sortOrder: getSortOrderForColumn('date', sorting), onFilter: handleFilterClick, hasFilter: filters.advancedFilters.some(f => f.columnId === 'date'), filterable: true },
      { columnId: 'description', type: 'sortableHeader' as const, text: `Description`, style: headerStyle, onSort: (columnId: string) => handleSort(columnId, sorting, setSortingWrapper), sortDirection: getSortDirectionForColumn('description', sorting), sortOrder: getSortOrderForColumn('description', sorting), onFilter: handleFilterClick, hasFilter: filters.advancedFilters.some(f => f.columnId === 'description'), filterable: true },
      { columnId: 'amount', type: 'sortableHeader' as const, text: `Amount`, style: headerStyle, onSort: (columnId: string) => handleSort(columnId, sorting, setSortingWrapper), sortDirection: getSortDirectionForColumn('amount', sorting), sortOrder: getSortOrderForColumn('amount', sorting), onFilter: handleFilterClick, hasFilter: filters.advancedFilters.some(f => f.columnId === 'amount'), filterable: true },
      { columnId: 'filePageNumber', type: 'sortableHeader' as const, text: `Page #`, style: headerStyle, onSort: (columnId: string) => handleSort(columnId, sorting, setSortingWrapper), sortDirection: getSortDirectionForColumn('filePageNumber', sorting), sortOrder: getSortOrderForColumn('filePageNumber', sorting), onFilter: handleFilterClick, hasFilter: filters.advancedFilters.some(f => f.columnId === 'filePageNumber'), filterable: true },
    ];
    if (!isCreditCard) { // Only show check columns for BANK type
      headerCells.push(
        { columnId: 'checkNumber', type: 'sortableHeader' as const, text: `Check #`, style: headerStyle, onSort: (columnId: string) => handleSort(columnId, sorting, setSortingWrapper), sortDirection: getSortDirectionForColumn('checkNumber', sorting), sortOrder: getSortOrderForColumn('checkNumber', sorting), onFilter: handleFilterClick, hasFilter: filters.advancedFilters.some(f => f.columnId === 'checkNumber'), filterable: true },
        { columnId: 'checkFilename', type: 'sortableHeader' as const, text: `Check File`, style: headerStyle, onSort: (columnId: string) => handleSort(columnId, sorting, setSortingWrapper), sortDirection: getSortDirectionForColumn('checkFilename', sorting), sortOrder: getSortOrderForColumn('checkFilename', sorting), onFilter: handleFilterClick, hasFilter: filters.advancedFilters.some(f => f.columnId === 'checkFilename'), filterable: true },
        { columnId: 'checkFilePage', type: 'sortableHeader' as const, text: `Check Pg`, style: headerStyle, onSort: (columnId: string) => handleSort(columnId, sorting, setSortingWrapper), sortDirection: getSortDirectionForColumn('checkFilePage', sorting), sortOrder: getSortOrderForColumn('checkFilePage', sorting), onFilter: handleFilterClick, hasFilter: filters.advancedFilters.some(f => f.columnId === 'checkFilePage'), filterable: true },
      );
    }
    headerCells.push({ type: 'header' as const, text: '' }); // actions - no header
    
    return { rowId: 'header', cells: headerCells };
  }, [sorting, filters, isCreditCard]);

  // Create data rows from transactions
  const dataRows = useMemo(() => {
    if (!statement) return [];
    
    return statement.transactions.map((txn) => {
      const suspiciousReasons = calculateTransactionSuspiciousReasons(txn, statement);
      const cells: CellTypes[] = [
        {
          type: 'text' as const, text: suspiciousReasons.length > 0 ? '⚠️' : '', nonEditable: true,
          renderer: (text: string) => (
              <Tooltip title={
                <div>
                  {suspiciousReasons.map((reason, index) => (<div key={index}>* {reason}</div>))}
                </div>
              }>
                  <span>{text}</span>
              </Tooltip>
          ),
        },
        { type: 'date' as const, date: txn.date ? new Date(txn.date) : undefined },
        { type: 'text' as const, text: txn.description || '' },
        { type: 'number' as const, value: txn.amount?.toString() ? txn.amount : NaN, format: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }) },
        { type: 'number' as const, value: txn.filePageNumber || NaN, validator: (value: number) => value > 0 },
        ...(isCreditCard ? [] : [
              { type: 'number' as const, value: txn.checkNumber || NaN, validator: (value: number) => value > 0 },
              { type: 'text' as const, text: txn.checkDataModel?.description || '' },
              { type: 'text' as const, text: txn.checkDataModel?.to || '' },
            ]
          ),
        {
          type: 'text' as const, text: txn.id, nonEditable: true,
          renderer: (id: string) => (
            <div style={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              {modifiedTransactions.includes(id) && (
                <Tooltip title='Reset Transaction'>
                  <IconButton style={{ cursor: 'pointer' }} onClick={() => handleResetTransaction(id)}>
                    <Restore />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title='Invert Transaction'>
                <IconButton style={{ cursor: 'pointer' }} onClick={() => handleInvertTransaction(id)}>
                  <Iso />
                </IconButton>
              </Tooltip>
              <Tooltip title='Duplicate Transaction'>
                <IconButton style={{ cursor: 'pointer' }} onClick={() => handleDuplicateTransaction(id)}>
                  <FileCopySharp />
                </IconButton>
              </Tooltip>
              <Tooltip title='Delete Transaction'>
                <IconButton style={{ cursor: 'pointer' }} onClick={() => handleDeleteTransaction(id)} color='error'>
                  <GridDeleteIcon />
                </IconButton>
              </Tooltip>
            </div>
          ),
        },
      ];
      return { rowId: txn.id, cells: cells.map(c => ({...c, style: getRowStyle(txn.id)})) };
    });
  }, [statement, isCreditCard, modifiedTransactions]);

  // Create add row
  const addRow = useMemo(() => {
    const addRowCells: CellTypes[] = [
      { type: 'text' as const, text: '', nonEditable: true },
      { type: 'date' as const, date: addRowValues.date || undefined },
      { type: 'text' as const, text: addRowValues.description || '' },
      { type: 'number' as const, value: addRowValues.amount || NaN, format: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }) },
      { type: 'number' as const, value: addRowValues.filePageNumber || NaN, validator: (value: number) => value > 0 },
      ...(!isCreditCard
        ? [
            { type: 'number' as const, value: addRowValues.checkNumber || NaN, validator: (value: number) => value > 0 },
            { type: 'text' as const, text: addRowValues.checkFilename || '' },
            { type: 'date' as const, date: addRowValues.checkFilePage ? new Date(addRowValues.checkFilePage.toString()) : undefined },
          ]
        : []
      ),
      {
        type: 'text' as const,
        text: '',
        renderer: () => (
          <Tooltip title='Add Transaction'>
            <IconButton size="small" onClick={handleAddTransaction}>
              <Typography variant="h6" sx={{ fontSize: '1rem', lineHeight: 1 }}>+</Typography>
            </IconButton>
          </Tooltip>
        ),
        nonEditable: true,
      }
    ];
    
    return { rowId: 'add-row', cells: addRowCells };
  }, [addRowValues, isCreditCard]);

  // Apply row-based filtering to data rows only
  const filteredDataRows = useMemo(() => {
    if (!statement) return [];
    return applyGenericFilters(
      dataRows,
      filters,
      columns,
      quickFilterConfig
    );
  }, [dataRows, filters, columns, quickFilterConfig]);

  // Apply sorting to filtered data rows only
  const sortedDataRows = useMemo(() => {
    return sortRows(filteredDataRows, sorting, columns);
  }, [filteredDataRows, sorting, columns]);

  // Combine header, sorted data rows, and add row (add row always at bottom)
  const finalRows = useMemo(() => {
    return [headerRow, ...sortedDataRows, addRow];
  }, [headerRow, sortedDataRows, addRow]);

  // a change is a delete if all previous values are empty and all new values are empty
  const shouldDeleteTransactions = (changes: CellChange[]): boolean => {
    const anyPreviousValuesNotEmpty = changes.some(change => {
      if (change.type === 'text') {
        return (change.previousCell as TextCell).text !== '';
      } else if (change.type === 'number') {
        return !Number.isNaN((change.previousCell as NumberCell).value);
      } else if (change.type === 'date') {
        return !Number.isNaN((change.previousCell as DateCell).date?.valueOf() || NaN);
      }
      return false;
    });
    if (anyPreviousValuesNotEmpty) return false;
    
    const allChangesAreEmpty = changes.every(change => {
      if (change.type === 'text') {
        return (change.newCell as TextCell).text === '';
      } else if (change.type === 'number') {
        return Number.isNaN((change.newCell as NumberCell).value);
      } else if (change.type === 'date') {
        return Number.isNaN((change.newCell as DateCell).date?.valueOf() || NaN);
      }
      return false;
    });
    if (!allChangesAreEmpty) return false;

    // Credit Card: date, description, amount, filePageNumber
    // Bank: date, description, amount, filePageNumber, checkNumber, checkFilename, checkFilePage
    const editableColumnsCount = isCreditCard ? 4 : 7;
    const uniqueRowIds = Array.from(new Set(changes.map(change => change.rowId)));
    const isEntireRowOperation = uniqueRowIds.some(rowId => {
      if (rowId === 'add-row' || rowId === 'header') return false;
      
      // Count how many cells are being changed for this row
      const changesForThisRow = changes.filter(change => change.rowId === rowId);
      
      // If we're changing all editable columns, it's an entire row operation
      return changesForThisRow.length >= editableColumnsCount;
    });
    if (!isEntireRowOperation) return false;

    return true
  }

  // Handle cell changes for transactions
  const handleCellsChanged = (changes: CellChange[]) => {
    if (shouldDeleteTransactions(changes)) {
      const rowIdsToDelete = Array.from(new Set(changes.map(change => change.rowId)));
      rowIdsToDelete.forEach(rowId => {
        if (rowId !== 'add-row') {
          dispatch(deleteTransaction(String(rowId)));
        }
      });
      return;
    }

    // Group changes by transaction ID
    const groupedChanges: { [key: string]: CellChange[] } = {};
    changes.forEach(change => {
      const rowId = change.rowId;
      if (rowId === 'add-row') {
        // Track add row values instead of automatically adding
        const { columnId, newCell } = change;
        console.log('Add row change detected:', columnId, newCell);
        if (change.type === 'date') {
          setAddRowValues(prev => ({ ...prev, [columnId]: (newCell as DateCell).date || null }));
        } else if (change.type === 'text') {
          setAddRowValues(prev => ({ ...prev, [columnId]: (newCell as TextCell).text }));
        } else if (change.type === 'number') {
          setAddRowValues(prev => ({ ...prev, [columnId]: Number.isNaN((newCell as NumberCell).value) ? null : (newCell as NumberCell).value }));
        } 
        return; // Skip add row changes
      } else {
        if (!groupedChanges[rowId]) {
          groupedChanges[rowId] = [];
        }
        groupedChanges[rowId].push(change); 
      }
    });

    // Process all changes as a single batch operation
    const allUpdates: { transactionId: string; changes: Array<{field: string, value: any}> }[] = [];

    Object.entries(groupedChanges).forEach(([transactionId, changesForTransaction]) => {
      const changes: { field: string; value: any }[] = [];

      changesForTransaction.forEach(change => {
        if (change.type === 'text') {
          changes.push({ field: String(change.columnId), value: (change.newCell as TextCell).text });
        } else if (change.type === 'number') {
          changes.push({ field: String(change.columnId), value: (change.newCell as NumberCell).value });
        } else if (change.type === 'date') {
          changes.push({ field: String(change.columnId), value: Number.isNaN((change.newCell as DateCell).date?.valueOf()) ? null : (change.newCell as DateCell).date?.toLocaleDateString() });
        } else if (change.type === 'dropdown') {
          changes.push({ field: String(change.columnId), value: (change.newCell as DropdownCell).selectedValue });
        }
      });

      if (changes.length > 0) {
        allUpdates.push({ transactionId: String(transactionId), changes });
      }
    });

    // Dispatch all updates as a single batch operation
    if (allUpdates.length > 0) {
      dispatch(batchUpdateMultipleTransactions(allUpdates));
    }
  };  

        

  // Handle transaction actions
  const handleDuplicateTransaction = (transactionId: Id) => {
    dispatch(duplicateTransaction(String(transactionId)));
  };

  const handleDeleteTransaction = (transactionId: Id) => {
    dispatch(deleteTransaction(String(transactionId)));
  };

  const handleInvertTransaction = (transactionId: Id) => {
    dispatch(invertTransactionAmount(String(transactionId)));
  };

  const handleAddTransaction = () => {
    if (statement) {
      const newTransaction: TransactionHistoryRecord = {
        id: crypto.randomUUID(),
        date: addRowValues.date ? addRowValues.date.toLocaleDateString() : null,
        description: addRowValues.description || null,
        amount: addRowValues.amount,
        filePageNumber: addRowValues.filePageNumber,
        checkNumber: addRowValues.checkNumber,
        checkDataModel: addRowValues.checkFilename || addRowValues.checkFilePage ? {
          accountNumber: '',
          checkNumber: addRowValues.checkNumber || 0,
          to: '',
          description: addRowValues.checkFilename || '',
          date: addRowValues.checkFilePage ? String(addRowValues.checkFilePage) : '',
          amount: 0,
        } : null,
        suspiciousReasons: [],
      };
      dispatch(addTransaction(newTransaction));
      
      // Clear add row values
      setAddRowValues({
        date: null,
        description: null,
        amount: null,
        filePageNumber: null,
        checkNumber: null,
        checkFilename: null,
        checkFilePage: null,
      });
    }
  };

  // Context menu handler
  const handleContextMenu = (
    selectedRowIds: Id[],
    selectedColIds: Id[],
    selectionMode: SelectionMode,
    menuOptions: MenuOption[],
    selectedRanges: Array<CellLocation[]>
  ): MenuOption[] => {
    
    // Get unique row IDs, excluding the add row
    const filteredRowIds = Array.from(new Set(selectedRanges[0]?.map(cell => cell.rowId).filter(id => id !== 'add-row')) || []);
    
    if (filteredRowIds.length > 0) {
      menuOptions = [
        ...menuOptions,
        {
          id: 'addTransaction',
          label: `Add ${filteredRowIds.length} Transaction${filteredRowIds.length > 1 ? 's' : ''}`,
          handler: () => {
            for (let i = 0; i < filteredRowIds.length; i++) {
              handleAddTransaction();
            }
          }
        },
        {
          id: 'duplicateTransactions',
          label: `Duplicate ${filteredRowIds.length} Transaction${filteredRowIds.length > 1 ? 's' : ''}`,
          handler: () => {
            filteredRowIds.forEach(id => {
              dispatch(duplicateTransaction(String(id)));
            });
          }
        },
        {
          id: 'deleteTransactions',
          label: `Delete ${filteredRowIds.length} Transaction${filteredRowIds.length > 1 ? 's' : ''}`,
          handler: () => {
            filteredRowIds.forEach(id => {
              dispatch(deleteTransaction(String(id)));
            });
          }
        }
      ];
    }
    
    return menuOptions;
  };

  // Handle column resize - self-contained
  const handleColumnResized = (columnId: Id, width: number, selectedColIds: Id[]) => {
    setColumnWidths(prev => ({ ...prev, [String(columnId)]: width }));
  };

  // Handle table size change
  const handleTableSizeChange = (
    event: React.MouseEvent<HTMLElement>,
    newSize: 'small' | 'medium' | 'large' | 'unbounded' | null,
  ) => {
    if (newSize !== null) {
      setTableSize(newSize);
    }
  };

  // Calculate table height based on size
  const getTableHeight = () => {
    if (tableSize === 'unbounded') return 'auto';
    if (isSideBySide) {
      switch (tableSize) {
        case 'small': return '400px';
        case 'medium': return '600px';
        case 'large': return '800px';
        default: return '600px';
      }
    } else {
      switch (tableSize) {
        case 'small': return '300px';
        case 'medium': return '500px';
        case 'large': return '700px';
        default: return '500px';
      }
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Filter */}
      <Box sx={{ mb: 2 }}>
        <GenericFilter
          filters={filters}
          onFiltersChange={setFilters}
          totalCount={statement?.transactions.length || 0}
          filteredCount={finalRows.length - 2} // Subtract header and add row
          columns={columns}
          quickFilters={quickFilterConfig}
          searchPlaceholder="Search transactions..."
        />
      </Box>
      
      {/* Table Controls */}
      <Box sx={{ 
        mb: 2, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label={`${finalRows.length - 2} of ${statement?.transactions.length || 0} transactions`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{
              borderColor: '#d1d5db',
              color: '#374151',
              fontWeight: 500,
              backgroundColor: '#f8fafc'
            }}
          />
        </Box>
        
        <ToggleButtonGroup
          value={tableSize}
          exclusive
          onChange={handleTableSizeChange}
          aria-label="table size"
          size="small"
        >
          <ToggleButton value="small" aria-label="small">
            <ViewCompact />
          </ToggleButton>
          <ToggleButton value="medium" aria-label="medium">
            <ViewModule />
          </ToggleButton>
          <ToggleButton value="large" aria-label="large">
            <ViewList />
          </ToggleButton>
          <ToggleButton value="unbounded" aria-label="unbounded">
            <ViewStream />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      {/* Table Container */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0, // Important for flex child
        border: '1px solid #e2e8f0',
        borderRadius: 2,
        backgroundColor: '#ffffff',
        height: tableSize === 'unbounded' ? 'auto' : getTableHeight()
      }}>
        <Box sx={{ 
          flex: 1,
          overflow: 'auto',
          minHeight: 0 // Important for flex child
        }}>
          <ReactGrid 
            columns={columns} 
            rows={finalRows} 
            onColumnResized={handleColumnResized}
            onCellsChanged={handleCellsChanged}
            onContextMenu={handleContextMenu}
            customCellTemplates={{ sortableHeader: sortableHeaderTemplate, custom: customCellTemplate }}
            enableRangeSelection
            enableRowSelection
            enableFillHandle
          />
        </Box>
      </Box>
      
      {/* Filter Popover */}
      {filterPopover && (() => {
        const column = columns.find(col => col.columnId === filterPopover.columnId);
        if (!column) return null;
        
                 return (
           <GenericFilterPopover
             anchorEl={filterPopover.anchorEl}
             onClose={handleCloseFilterPopover}
             column={column}
             currentFilter={filters.advancedFilters.find(f => f.columnId === filterPopover.columnId) || null}
             onApplyFilter={handleApplyFilter}
           />
         );
      })()}
    </Box>
  );
};

export default TransactionsTable; 