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
import { ViewCompact, ViewModule, ViewList, ViewStream } from '@mui/icons-material';
import { ReactGrid, Column, Row, CellChange, Id, DefaultCellTypes, DateCell, NumberCell, DropdownCell, TextCell, MenuOption, SelectionMode, CellLocation } from '@silevis/reactgrid';
import '@silevis/reactgrid/styles.css';
import { BankStatement } from '../types/bankStatement';
import { SortableHeaderCell, sortableHeaderTemplate, handleSort, sortRows, SortCriteria, getSortDirectionForColumn, getSortOrderForColumn } from './reactgrid/SortableHeaderCell';
import { calculateTransactionSuspiciousReasons } from '../utils/validation';
import { useAppDispatch } from '../redux/hooks';
import { updateTransaction, addTransaction, deleteTransaction, duplicateTransaction, invertTransactionAmount } from '../redux/features/statements/statementsSlice';
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
  const headerStyle = { fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#1976d2' };

  // Column width state - self-contained
  const [columnWidths, setColumnWidths] = useState({
    suspiciousReasons: 32,
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
        cells.push({ type: 'date' as const, date: txn.checkDataModel?.date ? new Date(txn.checkDataModel.date) : undefined });
      }
      cells.push({
        type: 'text' as const,
        renderer: (id: string) => (
            <div style={{display: 'flex', gap: 1, justifyContent: 'center'}}>
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
      return { rowId: txn.id, cells };
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
      text: '➕',
      nonEditable: true,
    });
    addRowCells.push({ type: 'date' as const, date: undefined });
    addRowCells.push({ type: 'text' as const, text: '' });
    addRowCells.push({ type: 'number' as const, value: NaN });
    addRowCells.push({ type: 'number' as const, value: NaN });
    if (!isCreditCard) { // Only show check columns for BANK type
      addRowCells.push({ type: 'number' as const, value: NaN });
      addRowCells.push({ type: 'text' as const, text: '' });
      addRowCells.push({ type: 'date' as const, date: undefined });
    }
    addRowCells.push({
      type: 'text' as const,
      text: '',
      nonEditable: true,
    });
    
    const addRow = { rowId: 'add-row', cells: addRowCells };
    
    return [headerRow, ...finalDataRows, addRow];
  }, [statement, isCreditCard, sorting]);

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

    changes.forEach(change => {
        const { rowId, columnId, newCell } = change;
        
        // Handle add row changes
        if (rowId === 'add-row') {
          // Create a new transaction when user starts typing in the add row
          if (change.type === 'text' || change.type === 'number' || change.type === 'date') {
            const newTransaction: TransactionHistoryRecord = {
              id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              date: null,
              description: null,
              amount: null,
              filePageNumber: null,
              checkNumber: null,
              checkDataModel: null,
              suspiciousReasons: [],
            };
            dispatch(addTransaction(newTransaction));
            return; // Don't process this change further
          }
        }
        
        // Handle regular transaction changes
        if (change.type === 'text') {
            dispatch(updateTransaction({ transactionId: String(rowId), field: String(columnId), value: (newCell as TextCell).text}))
        } else if (change.type === 'number') {
            dispatch(updateTransaction({ transactionId: String(rowId), field: String(columnId), value: (newCell as NumberCell).value}))
        } else if (change.type === 'date') {
            dispatch(updateTransaction({ transactionId: String(rowId), field: String(columnId), value: Number.isNaN((newCell as DateCell).date?.valueOf()) ? null : (newCell as DateCell).date?.toLocaleDateString()}))
        } else if (change.type === 'dropdown') {
            dispatch(updateTransaction({ transactionId: String(rowId), field: String(columnId), value: (newCell as DropdownCell).selectedValue}))
        }
        //  else if (columnId === 'checkNumber') {
        //     const value = newCell.text.trim() === '' ? null : parseInt(newCell.text) || null;
        //     dispatch(updateTransaction({ transactionId: String(rowId), field: 'checkNumber', value }));
        //   } else if (columnId === 'checkFilename') {
        //     // Update checkDataModel description
        //     const updatedTransaction = { ...transaction };
        //     if (!updatedTransaction.checkDataModel) {
        //       updatedTransaction.checkDataModel = {
        //         accountNumber: '',
        //         checkNumber: 0,
        //         payee: '',
        //         description: newCell.text,
        //         date: '',
        //         amount: 0,
        //       };
        //     } else {
        //       updatedTransaction.checkDataModel.description = newCell.text;
        //     }
        //     dispatch(updateTransaction({ transactionId: String(rowId), field: 'checkDataModel', value: updatedTransaction.checkDataModel }));
        //   } else if (columnId === 'checkFilePage') {
        //     // Update checkDataModel date (using date field for file page)
        //     const updatedTransaction = { ...transaction };
        //     if (!updatedTransaction.checkDataModel) {
        //       updatedTransaction.checkDataModel = {
        //         accountNumber: '',
        //         checkNumber: 0,
        //         payee: '',
        //         description: '',
        //         date: newCell.text,
        //         amount: 0,
        //       };
        //     }
    });
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
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: null,
        description: null,
        amount: null,
        filePageNumber: null,
        checkNumber: null,
        checkDataModel: null,
        suspiciousReasons: [],
      };
      dispatch(addTransaction(newTransaction));
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
        />
      </Box>
    </Box>
  );
};

export default TransactionsTable; 