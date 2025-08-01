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

import React, { useMemo, useState } from 'react';
import { Box, IconButton, Tooltip, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { ViewCompact, ViewModule, ViewList, ViewStream, Restore } from '@mui/icons-material';
import { ReactGrid, Column, Row, CellChange, Id, DefaultCellTypes, DateCell, NumberCell, DropdownCell, TextCell, MenuOption, SelectionMode, CellLocation } from '@silevis/reactgrid';
import '@silevis/reactgrid/styles.css';
import { BankStatement } from '../types/bankStatement';
import { SortableHeaderCell, sortableHeaderTemplate, handleSort, sortRows, SortCriteria, getSortDirectionForColumn, getSortOrderForColumn } from './reactgrid/SortableHeaderCell';
import { calculateTransactionSuspiciousReasons } from '../utils/validation';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { updateTransaction, addTransaction, deleteTransaction, duplicateTransaction, invertTransactionAmount, resetTransaction, batchUpdateTransaction, batchUpdateMultipleTransactions } from '../redux/features/statements/statementsSlice';
import { selectTransactionChanges } from '../redux/features/statements/statementsSelectors';
import { TransactionHistoryRecord } from '../types/bankStatement';
import { CustomCell, customCellTemplate } from './reactgrid/CustomCell';
import { GridDeleteIcon } from '@mui/x-data-grid';
import { FileCopySharp, Iso } from '@mui/icons-material';

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

  const columns: Column[] = useMemo(() => {
    const baseCols: Column[] = [
      {
        columnId: 'suspiciousReasons',
        width: columnWidths.suspiciousReasons,
        resizable: false,
        reorderable: false,
      },
      { columnId: 'date', width: columnWidths.date, resizable: true },
      { columnId: 'description', width: columnWidths.description, resizable: true },
      { columnId: 'amount', width: columnWidths.amount, resizable: true },
      { columnId: 'filePageNumber', width: columnWidths.filePageNumber, resizable: true },
    ];
    if (!isCreditCard) { // Only show check columns for BANK type
      baseCols.push(
        { columnId: 'checkNumber', width: columnWidths.checkNumber, resizable: true },
        { columnId: 'checkFilename', width: columnWidths.checkFilename, resizable: true },
        { columnId: 'checkFilePage', width: columnWidths.checkFilePage, resizable: true },
      );
    }
    baseCols.push({
      columnId: 'actions',
      width: columnWidths.actions,
      resizable: false,
      reorderable: false,
    });
    return baseCols;
  }, [columnWidths, isCreditCard]);

  const rows: Row<CellTypes>[] = useMemo(() => {
    if (!statement) return [];
    
    const setSortingWrapper = (newSorting: SortCriteria | ((prev: SortCriteria) => SortCriteria)) => {
      if (typeof newSorting === 'function') {
        setSorting(newSorting(sorting));
      } else {
        setSorting(newSorting);
      }
    };

    const headerCells: any[] = [
      { columnId: 'suspiciousReasons', type: 'header' as const, text: '', nonEditable: true }, // suspiciousReasons - no header
      { columnId: 'date', type: 'sortableHeader' as const, text: `Date`, style: headerStyle, onSort: (columnId: string) => handleSort(columnId, sorting, setSortingWrapper), sortDirection: getSortDirectionForColumn('date', sorting), sortOrder: getSortOrderForColumn('date', sorting) },
      { columnId: 'description', type: 'sortableHeader' as const, text: `Description`, style: headerStyle, onSort: (columnId: string) => handleSort(columnId, sorting, setSortingWrapper), sortDirection: getSortDirectionForColumn('description', sorting), sortOrder: getSortOrderForColumn('description', sorting) },
      { columnId: 'amount', type: 'sortableHeader' as const, text: `Amount`, style: headerStyle, onSort: (columnId: string) => handleSort(columnId, sorting, setSortingWrapper), sortDirection: getSortDirectionForColumn('amount', sorting), sortOrder: getSortOrderForColumn('amount', sorting) },
      { columnId: 'filePageNumber', type: 'sortableHeader' as const, text: `Page #`, style: headerStyle, onSort: (columnId: string) => handleSort(columnId, sorting, setSortingWrapper), sortDirection: getSortDirectionForColumn('filePageNumber', sorting), sortOrder: getSortOrderForColumn('filePageNumber', sorting) },
    ];
    if (!isCreditCard) { // Only show check columns for BANK type
      headerCells.push(
        { type: 'text' as const, text: `Check #`, nonEditable: true, style: headerStyle },
        { type: 'text' as const, text: `Check File`, nonEditable: true, style: headerStyle },
        { type: 'text' as const, text: `Check Pg`, nonEditable: true, style: headerStyle },
      );
    }
    headerCells.push({ type: 'header' as const, text: '' }); // actions - no header
    
    const headerRow = { rowId: 'header', cells: headerCells };
    
    const dataRows = statement.transactions.map((txn, idx) => {
      const suspiciousReasons = calculateTransactionSuspiciousReasons(txn, statement);
      const cells: CellTypes[] = [];
      cells.push({
        type: 'text' as const,
        text: suspiciousReasons.length > 0 ? '⚠️' : '',
        renderer: (text: string) => (
            <Tooltip title={
              <div>
                {suspiciousReasons.map((reason, index) => (
                  <div key={index}>* {reason}</div>
                ))}
              </div>
            }>
                <span>{text}</span>
            </Tooltip>
        ),
        nonEditable: true,
      });
      cells.push({ type: 'date' as const, date: txn.date ? new Date(txn.date) : undefined });
      cells.push({ type: 'text' as const, text: txn.description || '' });
      cells.push({ type: 'number' as const, hideZero: false, nanToZero: false, value: txn.amount?.toString() ? txn.amount : NaN, format: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }) });
      cells.push({ type: 'number' as const, value: txn.filePageNumber || NaN, validator: (value: number) => value > 0 });
      if (!isCreditCard) { // Only show check columns for BANK type
        cells.push({ type: 'number' as const, value: txn.checkNumber || NaN, validator: (value: number) => value > 0 });
        cells.push({ type: 'text' as const, text: txn.checkDataModel?.description || '' });
        cells.push({ type: 'text' as const, text: txn.checkDataModel?.to || '' });
      }
      cells.push({
        type: 'text' as const,
        renderer: (id: string) => (
            <div style={{display: 'flex', gap: 1, justifyContent: 'center'}}>
                {modifiedTransactions.includes(id) && (
                  <Tooltip title='Reset Transaction'>
                    <IconButton style={{cursor: 'pointer'}} onClick={() => handleResetTransaction(id)}>
                        <Restore />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title='Invert Transaction'>
                    <IconButton style={{cursor: 'pointer'}} onClick={() => handleInvertTransaction(id)}>
                        <Iso />
                    </IconButton>
                </Tooltip>
                <Tooltip title='Duplicate Transaction'>
                    <IconButton style={{cursor: 'pointer'}} onClick={() => handleDuplicateTransaction(id)}>
                        <FileCopySharp />
                    </IconButton>
                </Tooltip>
                <Tooltip title='Delete Transaction'>
                    <IconButton style={{cursor: 'pointer'}} onClick={() => handleDeleteTransaction(id)} color='error'>
                        <GridDeleteIcon />
                    </IconButton>
                </Tooltip>
            </div>
        ),
        text: txn.id,
        nonEditable: true,
      });
      return { rowId: txn.id, cells: cells.map(c => ({...c, style: getRowStyle(txn.id)})) };
    });
    
    // Apply sorting if needed (skip header row)
    let finalDataRows: Row<CellTypes>[] = dataRows;
    if (sorting && sorting.length > 0) {
      finalDataRows = sortRows(dataRows, sorting, columns);
    }
    
    // Create sticky add row at the bottom
    const addRowCells: CellTypes[] = [];
    addRowCells.push({
      type: 'text' as const,
      text: '',
      nonEditable: true,
    });
    addRowCells.push({ type: 'date' as const, date: addRowValues.date || undefined });
    addRowCells.push({ type: 'text' as const, text: addRowValues.description || '' });
    addRowCells.push({ type: 'number' as const, hideZero: false, nanToZero: false, value: addRowValues.amount || NaN, format: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }) });
    addRowCells.push({ type: 'number' as const, value: addRowValues.filePageNumber || NaN, validator: (value: number) => value > 0 });
    if (!isCreditCard) { // Only show check columns for BANK type
      addRowCells.push({ type: 'number' as const, value: addRowValues.checkNumber || NaN, validator: (value: number) => value > 0 });
      addRowCells.push({ type: 'text' as const, text: addRowValues.checkFilename || '' });
      addRowCells.push({ type: 'date' as const, date: addRowValues.checkFilePage ? new Date(addRowValues.checkFilePage.toString()) : undefined });
    }
    addRowCells.push({
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
    });
    
    const addRow = { rowId: 'add-row', cells: addRowCells };
    
    return [headerRow, ...finalDataRows, addRow];
  }, [statement, isCreditCard, sorting, addRowValues]);

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

  // Check if a transaction is empty (all fields except ID are null/empty)
  const isTransactionEmpty = (transaction: TransactionHistoryRecord): boolean => {
    return (
      transaction.date === null &&
      transaction.description === null &&
      transaction.amount === null &&
      transaction.filePageNumber === null &&
      transaction.checkNumber === null &&
      transaction.checkDataModel === null
    );
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
    <Box sx={{ mb: 1, height: isSideBySide ? '100%' : 'auto' }}>
      <Typography variant="h6" sx={{ mb: 0.5 }}>Transactions</Typography>
      
      {/* Table Controls */}
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'flex-start' }}>
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
      
      <Box sx={{ 
        height: getTableHeight(),
        overflow: tableSize === 'unbounded' ? 'visible' : 'auto',
        minHeight: isSideBySide ? '400px' : 'auto'
      }}>
        <ReactGrid 
          columns={columns} 
          rows={rows} 
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
  );
};

export default TransactionsTable; 