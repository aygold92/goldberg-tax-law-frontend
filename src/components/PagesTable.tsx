/**
 * PagesTable component for displaying statement pages and bates stamps.
 * 
 * This component provides a sortable table showing:
 * - Page numbers from the statement
 * - Associated bates stamps for each page
 * 
 * Supports column sorting and resizing.
 */

import React, { useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { ReactGrid, Column, Row, Id, DefaultCellTypes } from '@silevis/reactgrid';
import '@silevis/reactgrid/styles.css';
import { BankStatement } from '../types/bankStatement';
import { SortableHeaderCell, sortableHeaderTemplate, handleSort, sortRows, SortCriteria, getSortDirectionForColumn, getSortOrderForColumn } from './reactgrid/SortableHeaderCell';

// Extend the default cell types to include our custom type
type CustomCellTypes = DefaultCellTypes | SortableHeaderCell;

interface PagesTableProps {
  statement: BankStatement | null;
}

const PagesTable: React.FC<PagesTableProps> = ({
  statement,
}) => {
  const headerStyle = { fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#1976d2' };

  // Column width state - self-contained
  const [columnWidths, setColumnWidths] = useState({ filePageNumber: 100, batesStamp: 150 });
  
  // Sorting state - self-contained
  const [sorting, setSorting] = useState<SortCriteria>([]);

  const columns: Column[] = [
    { columnId: 'filePageNumber', width: columnWidths.filePageNumber, resizable: true },
    { columnId: 'batesStamp', width: columnWidths.batesStamp, resizable: true },
  ];

  const rows: Row<CustomCellTypes>[] = useMemo(() => {
    if (!statement) return [];
    
    const setSortingWrapper = (newSorting: SortCriteria | ((prev: SortCriteria) => SortCriteria)) => {
      if (typeof newSorting === 'function') {
        setSorting(newSorting(sorting));
      } else {
        setSorting(newSorting);
      }
    };
    
    const headerRow = { 
      rowId: 'header', 
      cells: [ 
        { type: 'sortableHeader' as const, text: `Page #`, style: headerStyle, onSort: (columnId: string) => handleSort(columnId, sorting, setSortingWrapper), columnId: 'filePageNumber', sortDirection: getSortDirectionForColumn('filePageNumber', sorting), sortOrder: getSortOrderForColumn('filePageNumber', sorting) }, 
        { type: 'sortableHeader' as const, text: `Bates Stamp`, style: headerStyle, onSort: (columnId: string) => handleSort(columnId, sorting, setSortingWrapper), columnId: 'batesStamp', sortDirection: getSortDirectionForColumn('batesStamp', sorting), sortOrder: getSortOrderForColumn('batesStamp', sorting) } 
      ] 
    };
    
    const dataRows = statement.pageMetadata.pages.map((page) => ({
      rowId: String(page),
      cells: [
        { type: 'text' as const, text: String(page) },
        { type: 'text' as const, text: statement.batesStamps[page] || '' },
      ],
    }));
    
    // Apply sorting if needed (skip header row)
    if (sorting && sorting.length > 0) {
      const sortedDataRows = sortRows(dataRows, sorting, columns);
      return [headerRow, ...sortedDataRows];
    }
    
    return [headerRow, ...dataRows];
  }, [statement, sorting]);

  // Handle column resize - self-contained
  const handleColumnResized = (columnId: Id, width: number, selectedColIds: Id[]) => {
    setColumnWidths(prev => ({ ...prev, [String(columnId)]: width }));
  };

  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="h6" sx={{ mb: 0.5 }}>Pages Used</Typography>
      <Box>
        <ReactGrid
          columns={columns} 
          rows={rows} 
          onColumnResized={handleColumnResized}
          customCellTemplates={{ sortableHeader: sortableHeaderTemplate }}
          enableRangeSelection
          enableRowSelection
        />
      </Box>
    </Box>
  );
};

export default PagesTable; 