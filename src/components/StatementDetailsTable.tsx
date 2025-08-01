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
import { Box, Typography } from '@mui/material';
import { ReactGrid, Column, Row, CellChange, Id, DropdownCell, NumberCell, TextCell, DateCell } from '@silevis/reactgrid';
import '@silevis/reactgrid/styles.css';
import { BankStatement, ClassificationType } from '../types/bankStatement';
import { useAppDispatch } from '../redux/hooks';
import { updateStatementField } from '../redux/features/statements/statementsSlice';

interface StatementDetailsTableProps {
  statement: BankStatement | null;
}

const StatementDetailsTable: React.FC<StatementDetailsTableProps> = ({
  statement,
}) => {
  const dispatch = useAppDispatch();
  const headerStyle = { fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#1976d2' };

  // Column width state - self-contained
  const [columnWidths, setColumnWidths] = useState({ key: 180, value: 220 });

  const columns: Column[] = [
    { columnId: 'key', width: columnWidths.key, resizable: true },
    { columnId: 'value', width: columnWidths.value, resizable: true },
  ];

  const [classificationDropdownOpen, setClassificationDropdownOpen] = useState(false);
  

  const rows: Row<any>[] = useMemo(() => {
    if (!statement) return [];
    
    const ret = [
      { rowId: 'date', cells: [ { type: 'header' as const, text: `Statement Date`, nonEditable: true, style: headerStyle }, 
        { type: 'date' as const, date: statement.date ? new Date(statement.date) : undefined } ] },
      { rowId: 'accountNumber', cells: [ { type: 'header' as const, text: `Account Number`, nonEditable: true, style: headerStyle }, 
        { type: 'text' as const, text: statement.accountNumber || '', validator: (value: string) => value.length > 0 && /^\d+$/.test(value) } ] },
      { rowId: 'classification', cells: [ { type: 'header' as const, text: `Classification`, nonEditable: true, style: headerStyle }, 
        { type: 'dropdown' as const, isDisabled: false, isOpen: classificationDropdownOpen, selectedValue: statement.pageMetadata.classification || '', values: Object.values(ClassificationType).map(value => ({ label: value, value })) } as DropdownCell ] },
      { rowId: 'beginningBalance', cells: [ { type: 'header' as const, text: `Beginning Balance`, nonEditable: true, style: headerStyle }, 
        { type: 'number' as const, value: statement.beginningBalance?.toString() ? statement.beginningBalance : NaN, format: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }) } ] },  
      { rowId: 'endingBalance', cells: [ { type: 'header' as const, text: `Ending Balance`, nonEditable: true, style: headerStyle }, 
        { type: 'number' as const, value: statement.endingBalance?.toString() ? statement.endingBalance : NaN, format: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }) } ] }, 
      { rowId: 'interest', cells: [ { type: 'header' as const, text: `Interest Charged`, nonEditable: true, style: headerStyle }, 
            { type: 'number' as const, value: statement.interestCharged?.toString() ? statement.interestCharged : NaN, format: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }) } ] },
      { rowId: 'fees', cells: [ { type: 'header' as const, text: `Fees Charged`, nonEditable: true, style: headerStyle }, 
        { type: 'number' as const, value: statement.feesCharged?.toString() ? statement.feesCharged : NaN, format: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }) } ] },
    ];
    return ret
  }, [statement, classificationDropdownOpen]);

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
    <Box sx={{ mb: 1 }}>
      <Typography variant="h6" sx={{ mb: 0.5 }}>Statement Details</Typography>
      <Box>
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