/**
 * TransactionsTable component for editing bank statement transactions.
 * 
 * This component provides an editable table for transaction data:
 * - Transaction date, description, amount, page number
 * - Check information for BANK type statements
 * - Suspicious reasons indicators
 * - Action buttons for each transaction
 * 
 * Refactored to use ReactGridTable component.
 */

import React, { useMemo, useState } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Restore, Warning, Add, TrendingUp, TrendingDown } from '@mui/icons-material';
import { CellChange, NumberCell, TextCell, DateCell, DropdownCell, MenuOption, SelectionMode, CellLocation, Id } from '@silevis/reactgrid';
import { BankStatement } from '../types/bankStatement';
import { calculateTransactionSuspiciousReasons } from '../utils/validation';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { addTransaction, deleteTransaction, duplicateTransaction, invertTransactionAmount, resetTransaction, batchUpdateMultipleTransactions } from '../redux/features/statementEditor/statementEditorSlice';
import { selectTransactionChanges } from '../redux/features/statementEditor/statementEditorSelectors';
import { TransactionHistoryRecord } from '../types/bankStatement';
import { GridDeleteIcon } from '@mui/x-data-grid';
import { FileCopySharp, Iso } from '@mui/icons-material';
import { ReactGridTable, TableColumn } from './ReactGridTable';
import { CustomFilterConfig } from './ReactGridTable/filter/FilterTypes';
import { COLORS } from '../styles/constants';
import styles from '../styles/components/TransactionsTable.module.css';

// Interface for the transformed transaction data
interface TransactionTableRow {
  id: string;                    // transaction ID
  date: Date | null;             // transaction date
  description: string;           // transaction description
  amount: number | undefined | null;    // transaction amount
  filePageNumber: number | null; // page number
  checkNumber: number | null;    // check number (for bank statements)
  checkFilename: string;         // check filename (for bank statements)
  checkFilePage: number | null;  // check file page (for bank statements)
  suspiciousReasons: string[];   // suspicious reasons for display
  isModified: boolean;           // for row styling
  isNew: boolean;                // for row styling
}

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

  // Transform statement data to TransactionTableRow format
  const data: TransactionTableRow[] = useMemo(() => {
    if (!statement) return [];
    
    return statement.transactions.map(transaction => ({
      id: transaction.id,
      date: transaction.date ? new Date(transaction.date) : null,
      description: transaction.description || '',
      amount: transaction.amount,
      filePageNumber: transaction.filePageNumber || null,
      checkNumber: transaction.checkNumber || null,
      checkFilename: transaction.checkDataModel?.description || '',
      checkFilePage: transaction.checkDataModel?.to ? parseInt(transaction.checkDataModel.to) || null : null,
      suspiciousReasons: calculateTransactionSuspiciousReasons(transaction, statement),
      isModified: modifiedTransactions.includes(transaction.id),
      isNew: newTransactions.includes(transaction.id)
    }));
  }, [statement, modifiedTransactions, newTransactions]);

  // Row styles for new and modified transactions
  const rowStyle = useMemo(() => {
    const rowStyles: Record<string, any> = {};
    
    // Apply styles to modified transactions
    modifiedTransactions.forEach(transactionId => {
      rowStyles[transactionId] = { background: COLORS.status.modified }; // Light yellow for modified
    });
    
    // Apply styles to new transactions (override modified if both)
    newTransactions.forEach(transactionId => {
      rowStyles[transactionId] = { background: COLORS.status.new }; // Light green for new
    });
    
    return rowStyles;
  }, [modifiedTransactions, newTransactions]);

  // Helper function to handle reset transaction
  const handleResetTransaction = (transactionId: string) => {
    dispatch(resetTransaction(transactionId));
  };

  // Column definitions for ReactGridTable
  const columns: TableColumn<TransactionTableRow>[] = useMemo(() => {
    const baseColumns: TableColumn<TransactionTableRow>[] = [
      {
        type: 'custom',
        field: 'id',
        label: '',
        columnId: 'suspiciousReasons',
        width: 20,
        resizable: false,
        nonFilterable: true,
        nonSortable: true,
        nonSearchable: true,
        render: (rowId, item) => (
          <Tooltip title={
            <div>
              {item.suspiciousReasons.map((reason, index) => (<div key={index}>* {reason}</div>))}
            </div>
          }>
            <span>{item.suspiciousReasons.length > 0 ? '⚠️' : ''}</span>
          </Tooltip>
        )
      },
      {
        field: 'date',
        type: 'date',
        label: 'Date',
        columnId: 'date',
        width: 110,
        resizable: true
      },
      {
        field: 'description',
        type: 'text',
        label: 'Description',
        columnId: 'description',
        width: 200,
        resizable: true
      },
      {
        field: 'amount',
        type: 'number',
        label: 'Amount',
        columnId: 'amount',
        width: 110,
        resizable: true,
        format: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
      },
      {
        field: 'filePageNumber',
        type: 'number',
        label: 'Page #',
        columnId: 'filePageNumber',
        width: 80,
        resizable: true
      }
    ];

    // Add check columns for bank statements (not credit cards)
    if (!isCreditCard) {
      baseColumns.push(
        {
          field: 'checkNumber',
          type: 'number',
          label: 'Check #',
          columnId: 'checkNumber',
          width: 90,
          resizable: true
        },
        {
          field: 'checkFilename',
          type: 'text',
          label: 'Check File',
          columnId: 'checkFilename',
          width: 120,
          resizable: true
        },
        {
          field: 'checkFilePage',
          type: 'number',
          label: 'Check Pg',
          columnId: 'checkFilePage',
          width: 90,
          resizable: true
        }
      );
    }

    // Add actions column
    baseColumns.push({
      type: 'custom',
      field: 'id',
      label: '',
      columnId: 'actions',
      width: 130,
      resizable: false,
      nonFilterable: true,
      nonSortable: true,
      nonSearchable: true,
      render: (rowId, item) => (
        <Box className={styles.actionsContainer}>
          {item.isModified && (
            <Tooltip title='Reset Transaction'>
              <IconButton size="small" onClick={() => handleResetTransaction(item.id)}>
                <Restore />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title='Invert Transaction'>
            <IconButton size="small" onClick={() => handleInvertTransaction(item.id)}>
              <Iso />
            </IconButton>
          </Tooltip>
          <Tooltip title='Duplicate Transaction'>
            <IconButton size="small" onClick={() => handleDuplicateTransaction(item.id)}>
              <FileCopySharp />
            </IconButton>
          </Tooltip>
          <Tooltip title='Delete Transaction'>
            <IconButton size="small" onClick={() => handleDeleteTransaction(item.id)} color='error'>
              <GridDeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    });

    return baseColumns;
  }, [isCreditCard]);

  // Custom filter configurations
  const customFilters: CustomFilterConfig<TransactionTableRow>[] = [
    {
      key: 'suspicious',
      label: 'Suspicious',
      filterFunction: (transaction) => transaction.suspiciousReasons.length > 0,
      icon: <Warning />,
      color: 'warning',
      tooltip: 'Show suspicious transactions'
    },
    {
      key: 'new',
      label: 'New',
      filterFunction: (transaction) => transaction.isNew,
      icon: <Add />,
      color: 'primary',
      tooltip: 'Show new transactions'
    },
    {
      key: 'income',
      label: 'Income',
      filterFunction: (transaction) => !!transaction.amount && transaction.amount > 0,
      icon: <TrendingUp />,
      color: 'success',
      tooltip: 'Show income transactions'
    },
    {
      key: 'expenses',
      label: 'Expenses',
      filterFunction: (transaction) => !!transaction.amount && transaction.amount < 0,
      icon: <TrendingDown />,
      color: 'error',
      tooltip: 'Show expense transactions'
    }
  ];


  // Handle row add for ReactGridTable
  const handleRowAdd = (row: Partial<TransactionTableRow>) => {
    if (statement) {
      // Create a new transaction with default values
      const newTransaction: TransactionHistoryRecord = {
        id: `new-${Date.now()}`, // Generate a unique ID
        date: row.date ? row.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        description: row.description || 'New Transaction',
        amount: row.amount || 0,
        filePageNumber: row.filePageNumber || 1,
        checkNumber: row.checkNumber || undefined,
        checkDataModel: row.checkFilename || row.checkFilePage ? {
          accountNumber: '',
          checkNumber: row.checkNumber || 0,
          date: row.date ? row.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          amount: row.amount || 0,
          description: row.checkFilename || '',
          to: row.checkFilePage?.toString() || ''
        } : undefined
      };
      dispatch(addTransaction(newTransaction));
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
      if (rowId === 'header') return false;
      
      // Count how many cells are being changed for this row
      const changesForThisRow = changes.filter(change => change.rowId === rowId);
      
      // If we're changing all editable columns, it's an entire row operation
      return changesForThisRow.length >= editableColumnsCount;
    });
    if (!isEntireRowOperation) return false;

    return true;
  };

  // Handle cell changes for transactions
  const handleCellsChanged = (changes: CellChange[]) => {
    if (shouldDeleteTransactions(changes)) {
      const rowIdsToDelete = Array.from(new Set(changes.map(change => change.rowId)));
      rowIdsToDelete.forEach(rowId => {
        dispatch(deleteTransaction(String(rowId)));
      });
      return;
    }

    // Group changes by transaction ID
    const groupedChanges: { [key: string]: CellChange[] } = {};
    changes.forEach(change => {
      const rowId = change.rowId;
      if (!groupedChanges[rowId]) {
        groupedChanges[rowId] = [];
      }
      groupedChanges[rowId].push(change); 
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

  // Handle context menu for ReactGridTable
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

  return (
    <Box className={styles.wrapper}>
      <ReactGridTable
        columns={columns}
        data={data}
        handleRowAdd={handleRowAdd}
        onCellsChanged={handleCellsChanged}
        onContextMenu={handleContextMenu}
        enableRangeSelection
        enableRowSelection
        enableFillHandle
        initialTableSize="large"
        customFilters={customFilters}
        rowStyle={rowStyle}
      />
    </Box>
  );
};

export default TransactionsTable;