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
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { Restore, Delete } from '@mui/icons-material';
import { ReactGrid, Column, Row, CellChange, Id, DefaultCellTypes, TextCell, NumberCell, MenuOption, SelectionMode, CellLocation } from '@silevis/reactgrid';
import '@silevis/reactgrid/styles.css';
import { BankStatement } from '../types/bankStatement';
import { SortableHeaderCell, sortableHeaderTemplate, handleSort, sortRows, SortCriteria, getSortDirectionForColumn, getSortOrderForColumn } from './reactgrid/SortableHeaderCell';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { updateStatementField, resetPage, batchUpdatePages, addPage, deletePage } from '../redux/features/statements/statementsSlice';
import { selectPageChanges } from '../redux/features/statements/statementsSelectors';

// Extend the default cell types to include our custom type
type CustomCellTypes = DefaultCellTypes | SortableHeaderCell;

interface PagesTableProps {
  statement: BankStatement | null;
}

const PagesTable: React.FC<PagesTableProps> = ({
  statement,
}) => {
  const dispatch = useAppDispatch();
  const { modified: modifiedPages, newItems: newPages } = useAppSelector(selectPageChanges);
  const headerStyle = { fontWeight: 'bold', background: '#f5f5f5', color: '#1976d2' };

  // Column width state - self-contained
  const [columnWidths, setColumnWidths] = useState({ filePageNumber: 100, batesStamp: 150, actions: 50 });
  
  // Sorting state - self-contained
  const [sorting, setSorting] = useState<SortCriteria>([]);

  // Add row state
  const [addRowValues, setAddRowValues] = useState({
    pageNumber: null as number | null,
    batesStamp: '',
  });

  const columns: Column[] = [
    { columnId: 'filePageNumber', width: columnWidths.filePageNumber, resizable: true },
    { columnId: 'batesStamp', width: columnWidths.batesStamp, resizable: true },
    { columnId: 'actions', width: columnWidths.actions, resizable: false },
  ];

  // Helper function to get row style based on change status
  const getRowStyle = (pageNumber: number) => {
    if (newPages.includes(pageNumber)) {
      return { background: 'rgba(76, 175, 80, 0.1)' }; // Light green for new
    } else if (modifiedPages.includes(pageNumber)) {
      return { background: 'rgba(255, 235, 59, 0.1)' }; // Light yellow for modified
    }
    return {};
  };

  // Helper function to handle reset page
  const handleResetPage = (pageNumber: number) => {
    dispatch(resetPage(pageNumber));
  };

  // Handle page management
  const handleAddPage = () => {
    if (statement && addRowValues.pageNumber) {
      // Add the page with the specified number
      dispatch(addPage(addRowValues.pageNumber));
      
      // If there's a bates stamp, we need to update it separately
      if (addRowValues.batesStamp) {
        // We need to update the bates stamps after adding the page
        const updatedBatesStamps = { ...statement.batesStamps };
        updatedBatesStamps[addRowValues.pageNumber] = addRowValues.batesStamp;
        dispatch(updateStatementField({ field: 'batesStamps', value: updatedBatesStamps }));
      }
      
      // Clear add row values
      setAddRowValues({
        pageNumber: null,
        batesStamp: '',
      });
    } else if (statement) {
      // Fallback to auto-increment if no page number specified
      const maxPage = Math.max(...statement.pageMetadata.pages, 0);
      const newPageNumber = maxPage + 1;
      dispatch(addPage(newPageNumber));
    }
  };

  const handleDeletePage = (pageNumber: number) => {
    dispatch(deletePage(pageNumber));
  };

  // Handle cell changes
  const handleCellsChanged = (changes: CellChange[]) => {
    // Group changes by page number
    const groupedChanges: { [key: string]: CellChange[] } = {};
    changes.forEach(change => {
      const rowId = change.rowId;
      if (rowId === 'header') return; // Skip header changes
      
      if (rowId === 'add-row') {
        // Track add row values instead of automatically adding
        const { columnId, newCell } = change;
        if (change.type === 'number' && columnId === 'filePageNumber') {
          const newPageNumber = (newCell as NumberCell).value;
          if (!isNaN(newPageNumber) && newPageNumber > 0) {
            setAddRowValues(prev => ({ ...prev, pageNumber: newPageNumber }));
          }
        } else if (change.type === 'text' && columnId === 'batesStamp') {
          setAddRowValues(prev => ({ ...prev, batesStamp: (newCell as TextCell).text }));
        }
        return; // Skip add row changes
      }
      
      if (!groupedChanges[rowId]) {
        groupedChanges[rowId] = [];
      }
      groupedChanges[rowId].push(change);
    });

    // Process all changes as a single batch operation
    const allUpdates: { pageNumber: number; changes: Array<{field: string, value: any}> }[] = [];

    Object.entries(groupedChanges).forEach(([pageId, changesForPage]) => {
      const pageNumber = parseInt(pageId);
      const changes: { field: string; value: any }[] = [];

      changesForPage.forEach(change => {
        if (change.type === 'text' && change.columnId === 'batesStamp') {
          changes.push({ field: 'batesStamp', value: (change.newCell as TextCell).text });
        } else if (change.type === 'number' && change.columnId === 'filePageNumber') {
          const newPageNumber = (change.newCell as NumberCell).value;
          if (!isNaN(newPageNumber)) {
            changes.push({ field: 'pageNumber', value: newPageNumber });
          }
        }
      });

      if (changes.length > 0) {
        allUpdates.push({ pageNumber, changes });
      }
    });

    // Dispatch all updates as a single batch operation
    if (allUpdates.length > 0) {
      dispatch(batchUpdatePages(allUpdates));
    }
  };

  // Handle context menu
  const handleContextMenu = (
    selectedRowIds: Id[],
    selectedColIds: Id[],
    selectionMode: SelectionMode,
    menuOptions: MenuOption[],
    selectedRanges: Array<CellLocation[]>
  ): MenuOption[] => {
    const newMenuOptions: MenuOption[] = [];

    // Add "Add Page" option
    newMenuOptions.push({
      id: 'add-page',
      label: 'Add Page',
      handler: () => {
        handleAddPage();
      },
    });

    const filteredPages = Array.from(new Set(selectedRanges[0]?.map(cell => cell.rowId).filter(id => id !== 'add-row')) || []);
    // Add "Delete Page" option if pages are selected
    if (filteredPages.length > 0) {
      newMenuOptions.push({
        id: 'delete-page',
        label: `Delete ${filteredPages.length > 1 ? 'Pages' : 'Page'}`,
        handler: () => {
          filteredPages.forEach(page => {
            handleDeletePage(parseInt(String(page)));
          });
        },
      });
    }

    return [...newMenuOptions, ...menuOptions];
  };

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
        { type: 'sortableHeader' as const, text: `Bates Stamp`, style: headerStyle, onSort: (columnId: string) => handleSort(columnId, sorting, setSortingWrapper), columnId: 'batesStamp', sortDirection: getSortDirectionForColumn('batesStamp', sorting), sortOrder: getSortOrderForColumn('batesStamp', sorting) },
        { type: 'header' as const, text: '', nonEditable: true }, // actions - no header
      ] 
    };
    
    const dataRows = statement.pageMetadata.pages.map((page) => ({
      rowId: String(page),
      cells: [
        { type: 'number' as const, value: page, validator: (value: number) => value > 0, style: getRowStyle(page) },
        { type: 'text' as const, text: statement.batesStamps[page] || '', style: getRowStyle(page) },
        { type: 'text' as const, text: '', renderer: () => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {modifiedPages.includes(page) && (
              <Tooltip title='Reset Page'>
                <IconButton size="small" onClick={() => handleResetPage(page)}>
                  <Restore />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title='Delete Page'>
              <IconButton size="small" onClick={() => handleDeletePage(page)}>
                <Delete />
              </IconButton>
            </Tooltip>
          </Box>
        ), nonEditable: true, style: getRowStyle(page) },
      ]
    }));

    // Add sticky add row
    const addRow = {
      rowId: 'add-row',
      cells: [
        { type: 'number' as const, value: addRowValues.pageNumber || NaN, validator: (value: number) => value > 0 },
        { type: 'text' as const, text: addRowValues.batesStamp },
        { type: 'text' as const, text: '', renderer: () => (
          <Tooltip title='Add Page'>
            <IconButton size="small" onClick={handleAddPage}>
              <Typography variant="h6" sx={{ fontSize: '1rem', lineHeight: 1 }}>+</Typography>
            </IconButton>
          </Tooltip>
        ), nonEditable: true },
      ]
    };
    
    // Apply sorting if needed (skip header row)
    if (sorting && sorting.length > 0) {
      const sortedDataRows = sortRows(dataRows, sorting, columns);
      return [headerRow, addRow, ...sortedDataRows];
    }
    
    return [headerRow, addRow, ...dataRows];
  }, [statement, sorting, modifiedPages, addRowValues]);

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
          onCellsChanged={handleCellsChanged}
          onContextMenu={handleContextMenu}
          customCellTemplates={{ sortableHeader: sortableHeaderTemplate }}
          enableRangeSelection
        />
      </Box>
    </Box>
  );
};

export default PagesTable; 