/**
 * StatementDetailsTable component for editing bank statement details.
 * 
 * This component provides an editable table for statement-level information:
 * - Statement Date
 * - Account Number
 * - Classification
 * - Beginning Balance
 * - Ending Balance
 * - Interest Charged
 * - Fees Charged
 * 
 * Supports cell editing and validation.
 */

import React, { useMemo, useState } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Restore } from '@mui/icons-material';
import { ReactGrid, Column, Row, CellChange, Id, DropdownCell, NumberCell, TextCell, DateCell } from '@silevis/reactgrid';
import '@silevis/reactgrid/styles.css';
import { BankStatement, ClassificationType } from '../types/bankStatement';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { updateStatementField, resetStatementField } from '../redux/features/statements/statementsSlice';
import { selectStatementFieldChanges } from '../redux/features/statements/statementsSelectors';

interface StatementDetailsTableProps {
  statement: BankStatement | null;
}

const StatementDetailsTable: React.FC<StatementDetailsTableProps> = ({
  statement,
}) => {
  const dispatch = useAppDispatch();
  const modifiedFields = useAppSelector(selectStatementFieldChanges);
  const headerStyle = { fontWeight: 'bold', background: '#f5f5f5', color: '#1976d2' };

  // Column width state - self-contained
  const [columnWidths, setColumnWidths] = useState({ key: 180, value: 220, actions: 50 });

  const columns: Column[] = [
    { columnId: 'key', width: columnWidths.key, resizable: true },
    { columnId: 'value', width: columnWidths.value, resizable: true },
    { columnId: 'actions', width: columnWidths.actions, resizable: false },
  ];

  const [classificationDropdownOpen, setClassificationDropdownOpen] = useState(false);

  // Helper function to get row style based on change status
  const getRowStyle = (fieldName: string) => {
    if (modifiedFields.includes(fieldName)) {
      return { background: 'rgba(255, 235, 59, 0.3)' }; // Light yellow for modified
    }
    return {};
  };

  // Helper function to handle reset field
  const handleResetField = (fieldName: string) => {
    dispatch(resetStatementField(fieldName));
  };

  const rows: Row<any>[] = useMemo(() => {
    if (!statement) return [];
    
    const ret = [
      { 
        rowId: 'date', 
        cells: [ 
          { type: 'header' as const, text: `Statement Date`, nonEditable: true, style: headerStyle }, 
          { type: 'date' as const, date: statement.date ? new Date(statement.date) : undefined, style: getRowStyle('date') },
          { type: 'text' as const, text: '', renderer: () => (
            modifiedFields.includes('date') ? (
              <Tooltip title='Reset Field'>
                <IconButton size="small" onClick={() => handleResetField('date')}>
                  <Restore />
                </IconButton>
              </Tooltip>
            ) : null
          ), nonEditable: true, style: getRowStyle('date') }
        ]
      },
      { 
        rowId: 'accountNumber', 
        cells: [ 
          { type: 'header' as const, text: `Account Number`, nonEditable: true, style: headerStyle }, 
          { type: 'text' as const, text: statement.accountNumber || '', validator: (value: string) => value.length > 0 && /^\d+$/.test(value), style: getRowStyle('accountNumber') },
          { type: 'text' as const, text: '', renderer: () => (
            modifiedFields.includes('accountNumber') ? (
              <Tooltip title='Reset Field'>
                <IconButton size="small" onClick={() => handleResetField('accountNumber')}>
                  <Restore />
                </IconButton>
              </Tooltip>
            ) : null
          ), nonEditable: true, style: getRowStyle('accountNumber') }
        ]
      },
      { 
        rowId: 'classification', 
        cells: [ 
          { type: 'header' as const, text: `Classification`, nonEditable: true, style: headerStyle }, 
          { type: 'dropdown' as const, isDisabled: false, isOpen: classificationDropdownOpen, selectedValue: statement.pageMetadata.classification || '', values: Object.values(ClassificationType).map(value => ({ label: value, value })), style: getRowStyle('classification') } as DropdownCell,
          { type: 'text' as const, text: '', renderer: () => (
            modifiedFields.includes('classification') ? (
              <Tooltip title='Reset Field'>
                <IconButton size="small" onClick={() => handleResetField('classification')}>
                  <Restore />
                </IconButton>
              </Tooltip>
            ) : null
          ), nonEditable: true, style: getRowStyle('classification') }
        ]
      },
      { 
        rowId: 'beginningBalance', 
        cells: [ 
          { type: 'header' as const, text: `Beginning Balance`, nonEditable: true, style: headerStyle }, 
          { type: 'number' as const, value: statement.beginningBalance?.toString() ? statement.beginningBalance : NaN, format: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }), style: getRowStyle('beginningBalance') },
          { type: 'text' as const, text: '', renderer: () => (
            modifiedFields.includes('beginningBalance') ? (
              <Tooltip title='Reset Field'>
                <IconButton size="small" onClick={() => handleResetField('beginningBalance')}>
                  <Restore />
                </IconButton>
              </Tooltip>
            ) : null
          ), nonEditable: true, style: getRowStyle('beginningBalance') }
        ]
      },
      { 
        rowId: 'endingBalance', 
        cells: [ 
          { type: 'header' as const, text: `Ending Balance`, nonEditable: true, style: headerStyle }, 
          { type: 'number' as const, value: statement.endingBalance?.toString() ? statement.endingBalance : NaN, format: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }), style: getRowStyle('endingBalance') },
          { type: 'text' as const, text: '', renderer: () => (
            modifiedFields.includes('endingBalance') ? (
              <Tooltip title='Reset Field'>
                <IconButton size="small" onClick={() => handleResetField('endingBalance')}>
                  <Restore />
                </IconButton>
              </Tooltip>
            ) : null
          ), nonEditable: true, style: getRowStyle('endingBalance') }
        ]
      },
      { 
        rowId: 'interest', 
        cells: [ 
          { type: 'header' as const, text: `Interest Charged`, nonEditable: true, style: headerStyle }, 
          { type: 'number' as const, value: statement.interestCharged?.toString() ? statement.interestCharged : NaN, format: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }), style: getRowStyle('interestCharged') },
          { type: 'text' as const, text: '', renderer: () => (
            modifiedFields.includes('interestCharged') ? (
              <Tooltip title='Reset Field'>
                <IconButton size="small" onClick={() => handleResetField('interestCharged')}>
                  <Restore />
                </IconButton>
              </Tooltip>
            ) : null
          ), nonEditable: true, style: getRowStyle('interestCharged') }
        ]
      },
      { 
        rowId: 'fees', 
        cells: [ 
          { type: 'header' as const, text: `Fees Charged`, nonEditable: true, style: headerStyle }, 
          { type: 'number' as const, value: statement.feesCharged?.toString() ? statement.feesCharged : NaN, format: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }), style: getRowStyle('feesCharged') },
          { type: 'text' as const, text: '', renderer: () => (
            modifiedFields.includes('feesCharged') ? (
              <Tooltip title='Reset Field'>
                <IconButton size="small" onClick={() => handleResetField('feesCharged')}>
                  <Restore />
                </IconButton>
              </Tooltip>
            ) : null
          ), nonEditable: true, style: getRowStyle('feesCharged') }
        ]
      }
    ];
    return ret
  }, [statement, classificationDropdownOpen, modifiedFields]);

  // Handle cell changes for statement details
  const handleCellsChanged = (changes: CellChange[]) => {
    changes.forEach(change => {
        const { rowId, columnId, newCell } = change;
        if (change.type === 'text') {
            dispatch(updateStatementField({ field: String(rowId), value: (newCell as TextCell).text}))
        } else if (change.type === 'number') {
            dispatch(updateStatementField({ field: String(rowId), value: (newCell as NumberCell).value}))
        } else if (change.type === 'date') {
            dispatch(updateStatementField({ field: String(rowId), value: (newCell as DateCell).date?.toLocaleDateString() || null}))
        } else if (change.type === 'dropdown') {
            // for some reason, this is how reactgrid handles dropdowns
            if (change.previousCell.isOpen !== change.newCell.isOpen) {
                setClassificationDropdownOpen(change.newCell.isOpen ?? false);
            }
            if (change.previousCell.selectedValue !== change.newCell.selectedValue) {
                dispatch(updateStatementField({ field: String(rowId), value: (newCell as DropdownCell).selectedValue}))
            }
        }
    });
  };

  // Handle column resize - self-contained
  const handleColumnResized = (columnId: Id, width: number, selectedColIds: Id[]) => {
    setColumnWidths(prev => ({ ...prev, [String(columnId)]: width }));
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        border: '1px solid #e2e8f0',
        borderRadius: 2,
        backgroundColor: '#ffffff',
        overflow: 'hidden'
      }}>
        <ReactGrid
          columns={columns} 
          rows={rows} 
          onColumnResized={handleColumnResized}
          onCellsChanged={handleCellsChanged}
        />
      </Box>
    </Box>
  );
};

export default StatementDetailsTable; 