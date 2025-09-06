/**
 * PagesTable component for displaying statement pages and bates stamps.
 * 
 * This component provides a sortable table showing:
 * - Page numbers from the statement
 * - Associated bates stamps for each page
 * 
 * Supports column sorting, filtering, and resizing.
 * Refactored to use the new ReactGridTable component.
 */

import React, { useMemo } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Restore, Delete } from '@mui/icons-material';
import { CellChange, TextCell, NumberCell, MenuOption, SelectionMode, CellLocation } from '@silevis/reactgrid';
import { BankStatement } from '../types/bankStatement';
import { ReactGridTable, TableColumn } from './ReactGridTable';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { updateStatementField, resetPage, batchUpdatePages, addPage, deletePage } from '../redux/features/statementEditor/statementEditorSlice';
import { selectPageChanges } from '../redux/features/statementEditor/statementEditorSelectors';
import { COLORS } from '../styles/constants';
import styles from '../styles/components/PagesTable.module.css';

// Interface for the transformed page data
interface PageTableRow {
  id: string;           // page number as string (for rowId)
  pageNumber: number;   // page number
  batesStamp: string;   // bates stamp text
  isModified: boolean;  // for row styling
  isNew: boolean;       // for row styling
}

interface PagesTableProps {
  statement: BankStatement | null;
}

const PagesTable: React.FC<PagesTableProps> = ({
  statement,
}) => {
  const dispatch = useAppDispatch();
  const { modified: modifiedPages, newItems: newPages } = useAppSelector(selectPageChanges);

  // Column definitions for ReactGridTable
  const columns: TableColumn<PageTableRow>[] = [
    {
      field: 'pageNumber',
      type: 'number',
      label: 'Page #',
      columnId: 'pageNumber',
      width: 100,
      resizable: true,
      nonFilterable: true,
    },
    {
      field: 'batesStamp', 
      type: 'text',
      label: 'Bates Stamp',
      columnId: 'batesStamp',
      width: 250,
      resizable: true,
      nonFilterable: true,
    },
    {
      type: 'custom',
      field: 'id',
      label: '',
      columnId: 'actions',
      width: 75,
      resizable: false,
      nonFilterable: true,
      nonSortable: true,
      render: (rowId, item, rowIndex) => (
        <Box className={styles.actionsContainer}>
          {item.isModified && (
            <Tooltip title='Reset Page'>
              <IconButton size="small" onClick={() => handleResetPage(item.pageNumber)}>
                <Restore />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title='Delete Page'>
            <IconButton size="small" onClick={() => handleDeletePage(item.pageNumber)}>
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  // Transform statement data to PageTableRow format
  const data: PageTableRow[] = useMemo(() => {
    if (!statement) return [];
    
    return statement.pageMetadata.pages.map(page => ({
      id: String(page),
      pageNumber: page,
      batesStamp: statement.batesStamps[page] || '',
      isModified: modifiedPages.includes(page),
      isNew: newPages.includes(page)
    }));
  }, [statement, modifiedPages, newPages]);

  // Row styles for new and modified pages
  const rowStyle = useMemo(() => {
    const rowStyles: Record<string, any> = {};
    
    // Apply styles to modified pages
    modifiedPages.forEach(page => {
      rowStyles[String(page)] = { background: COLORS.status.modified }; // Light yellow for modified
    });
    
    // Apply styles to new pages (override modified if both)
    newPages.forEach(page => {
      rowStyles[String(page)] = { background: COLORS.status.new }; // Light green for new
    });
    
    return rowStyles;
  }, [modifiedPages, newPages]);

  // Helper function to handle reset page
  const handleResetPage = (pageNumber: number) => {
    dispatch(resetPage(pageNumber));
  };

  // Handle row add for ReactGridTable
  const handleRowAdd = (row: Partial<PageTableRow>) => {
    if (statement && row.pageNumber) {
      // Add the page with the specified number
      dispatch(addPage(row.pageNumber));
      
      // If there's a bates stamp, we need to update it separately
      if (row.batesStamp) {
        // We need to update the bates stamps after adding the page
        const updatedBatesStamps = { ...statement.batesStamps };
        updatedBatesStamps[row.pageNumber] = row.batesStamp;
        dispatch(updateStatementField({ field: 'batesStamps', value: updatedBatesStamps }));
      }
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

  // Handle cell changes for ReactGridTable
  const handleCellsChanged = (changes: CellChange[]) => {
    // Group changes by page number
    const groupedChanges: { [key: string]: CellChange[] } = {};
    changes.forEach(change => {
      const rowId = change.rowId;
      if (rowId === 'header' || rowId === 'add-row') return; // Skip header and add row changes
      
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
        } else if (change.type === 'number' && change.columnId === 'pageNumber') {
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

  // Handle context menu for ReactGridTable
  const handleContextMenu = (
    selectedRowIds: any[],
    selectedColIds: any[],
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
        // Auto-increment page number
        if (statement) {
          const maxPage = Math.max(...statement.pageMetadata.pages, 0);
          const newPageNumber = maxPage + 1;
          dispatch(addPage(newPageNumber));
        }
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

  return (
    <Box className={styles.wrapper}>
      <ReactGridTable
        columns={columns}
        data={data}
        handleRowAdd={handleRowAdd}
        onCellsChanged={handleCellsChanged}
        onContextMenu={handleContextMenu}
        enableRangeSelection
        initialTableSize="unbounded"
        rowStyle={rowStyle}
      />
    </Box>
  );
};

export default PagesTable; 