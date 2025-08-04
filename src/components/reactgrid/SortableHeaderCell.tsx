/**
 * SortableHeaderCell component for ReactGrid.
 * 
 * This component provides a reusable sortable header cell template that can be used
 * across multiple ReactGrid components. It includes:
 * - Sort icons (ascending, descending, unsorted)
 * - Click handlers for sorting functionality
 * - Optional action buttons
 * - Tooltip support
 * - Customizable styling
 * 
 * Features:
 * - Visual sort indicators with Material-UI icons
 * - Three-state sorting (ascending → descending → unsorted)
 * - Optional action buttons (e.g., "Edit" buttons)
 * - Tooltip support for additional information
 * - Flexible styling options
 * 
 * Usage:
 * ```tsx
 * // Basic sortable header
 * { type: 'sortableHeader', text: 'Column Name', columnId: 'columnId', onSort: handleSort }
 * 
 * // Header with button
 * { type: 'sortableHeader', text: 'Column Name', columnId: 'columnId', onSort: handleSort, buttonText: 'Edit', onButtonClick: handleEdit }
 * 
 * // Header with tooltip
 * { type: 'sortableHeader', text: 'Column Name', columnId: 'columnId', onSort: handleSort, tooltipText: 'Additional info' }
 * ```
 */

import React from 'react';
import { Box, Button, IconButton, Tooltip } from '@mui/material';
import { KeyboardArrowUp, KeyboardArrowDown, UnfoldMore, FilterList } from '@mui/icons-material';
import { Cell, CellTemplate, Column, Compatible, Row, Uncertain, UncertainCompatible, getCellProperty } from '@silevis/reactgrid';

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
  NONE = 'none'
}

// Custom cell type for sortable headers
export interface SortableHeaderCell extends Cell {
  type: "sortableHeader";
  text: string;
  columnId: string;
  sortDirection: SortDirection;
  sortOrder: number; // Position in the sort criteria array (1-based)
  onSort: (columnId: string) => void;
  onFilter?: (columnId: string, event: React.MouseEvent) => void;
  hasFilter?: boolean;
}

function getOptionalCellProperty<T>(uncertainCell: Uncertain<SortableHeaderCell>, propertyName: keyof SortableHeaderCell, propertyType: "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function"): T | undefined {
  try {
    return getCellProperty(uncertainCell, propertyName, propertyType) as T;
  } catch {
    return undefined;
  }
}

// Custom cell template for sortable headers
export class SortableHeaderTemplate implements CellTemplate<SortableHeaderCell> {
  getCompatibleCell(uncertainCell: Uncertain<SortableHeaderCell>): Compatible<SortableHeaderCell> {
    const text = getCellProperty(uncertainCell, 'text', 'string');
    const columnId = getCellProperty(uncertainCell, 'columnId', 'string');
    const sortDirection = getOptionalCellProperty<SortDirection>(uncertainCell, 'sortDirection', 'string') || SortDirection.NONE;
    const sortOrder = getOptionalCellProperty<number>(uncertainCell, 'sortOrder', 'number') || 0;
    const onSort = getOptionalCellProperty<SortableHeaderCell['onSort']>(uncertainCell, 'onSort', 'function') || (() => {});
    
    const onFilter = getOptionalCellProperty<SortableHeaderCell['onFilter']>(uncertainCell, 'onFilter', 'function') || (() => {});
    
    const hasFilter = getOptionalCellProperty<SortableHeaderCell['hasFilter']>(uncertainCell, 'hasFilter', 'boolean') || false;
    
    const style = getOptionalCellProperty<SortableHeaderCell['style']>(uncertainCell, 'style', 'object') || {};
    
    const ret =  { 
      ...uncertainCell, 
      text, 
      columnId, 
      sortDirection, 
      sortOrder, 
      onSort, 
      onFilter,
      hasFilter,
      nonEditable: true, 
      style,
      value: text 
    };
    return ret
  }

  handleKeyDown(
    cell: Compatible<SortableHeaderCell>,
    keyCode: number,
    ctrl: boolean,
    shift: boolean,
    alt: boolean
  ): { cell: Compatible<SortableHeaderCell>; enableEditMode: boolean } {
    return { cell, enableEditMode: false };
  }

  update(cell: Compatible<SortableHeaderCell>, cellToMerge: UncertainCompatible<SortableHeaderCell>): Compatible<SortableHeaderCell> {
    return this.getCompatibleCell({ ...cell, text: cellToMerge.text });
  }

  render(
    cell: Compatible<SortableHeaderCell>,
    isInEditMode: boolean,
    onCellChanged: (cell: Compatible<SortableHeaderCell>, commit: boolean) => void
  ): React.ReactNode {
    const getSortIcon = () => {
      if (cell.sortDirection === SortDirection.ASC) return <KeyboardArrowUp fontSize="small" />;
      if (cell.sortDirection === SortDirection.DESC) return <KeyboardArrowDown fontSize="small" />;
      return <UnfoldMore fontSize="small" />;
    };

    const content = (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '0 8px',
        ...(cell.style || {})
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span>{cell.text}</span>
          <IconButton 
            size="small" 
            onClick={() => cell.onSort(cell.columnId)}
            sx={{ p: 0.5 }}
          >
            {getSortIcon()}
          </IconButton>
          {cell.sortOrder > 0 && cell.sortDirection !== SortDirection.NONE && (
            <Box sx={{ 
            //   ml: 0.5, 
              fontSize: '0.75rem', 
              color: 'text.secondary',
              fontWeight: 'bold'
            }}>
              {cell.sortOrder}
            </Box>
          )}
        </Box>
        
        {/* Filter Icon */}
        {cell.onFilter && (
          <Tooltip title="Filter column">
            <IconButton
              size="small"
              onClick={(e) => cell.onFilter!(cell.columnId, e)}
              sx={{ 
                p: 0.5,
                color: cell.hasFilter ? 'primary.main' : 'text.secondary'
              }}
            >
              <FilterList fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );

    return content;
  }
}

// --- Sorting Helper Functions ---
// Type for a single sort criterion
export interface SortCriterion {
  columnId: string;
  direction: SortDirection;
}

// Type for multiple sort criteria
export type SortCriteria = SortCriterion[];

/**
 * click handler for the sortable header cell
 * updates the sorting criteria object when a column is clicked
 */
export const handleSort = (
  columnId: string, 
  currentSorting: SortCriteria,
  setSorting: React.Dispatch<React.SetStateAction<SortCriteria>>
) => {
  // Find if this column is already in the sorting criteria
  const existingIndex = currentSorting.findIndex(criterion => criterion.columnId === columnId);
  
  if (existingIndex !== -1) {
    // Column exists, cycle through directions
    const existingCriterion = currentSorting[existingIndex];
    if (existingCriterion.direction === SortDirection.ASC) {
      // Change to descending
      const newSorting = [...currentSorting];
      newSorting[existingIndex] = { ...existingCriterion, direction: SortDirection.DESC };
      setSorting(newSorting);
    } else if (existingCriterion.direction === SortDirection.DESC) {
      // Remove this column from sorting
      const newSorting = currentSorting.filter((_, index) => index !== existingIndex);
      setSorting(newSorting);
    }
  } else {
    // Add new column to sorting (at the end)
    setSorting([...currentSorting, { columnId, direction: SortDirection.ASC }]);
  }
};

/**
 * Sort rows based on sorting criteria.  
 * Null, undefined, or other invalid values like NaN or invalid dates should appear to be "less" than valid values.  
 * If two null/undefined or invalid values are compared, the sort won't change the order.
 */
export const sortRows = (
  rows: Row<any>[],
  sorting: SortCriteria,
  columns: Column[]
): Row[] => {
  if (!sorting || sorting.length === 0) return rows;
  
  return [...rows].sort((a, b) => {
    // Skip header rows
    if (a.rowId === 'header' || b.rowId === 'header') return 0;
    
    // Compare using each sort criterion in order
    for (const criterion of sorting) {
      const columnIndex = columns.findIndex(col => col.columnId === criterion.columnId);
      if (columnIndex === -1) continue;
      
      const aCell = a.cells[columnIndex];
      const bCell = b.cells[columnIndex];
      
      if (!aCell || !bCell || aCell.type !== bCell.type) continue;

      let comparisonResult;
      if (aCell.type === 'text') {
        comparisonResult = (aCell.text || '').localeCompare(bCell.text || '');
      } else if (aCell.type === 'number') {
        const aValue = !Number.isNaN(aCell.value || NaN) ? aCell.value : Number.MIN_VALUE;
        const bValue = !Number.isNaN(bCell.value || NaN) ? bCell.value : Number.MIN_VALUE;
        comparisonResult = aValue - bValue;
      } else if (aCell.type === 'date') {
        const aDate = !isNaN(aCell.date?.valueOf() || NaN) ? aCell.date : new Date(0);
        const bDate = !isNaN(bCell.date?.valueOf() || NaN) ? bCell.date : new Date(0);
        comparisonResult = aDate.getTime() - bDate.getTime();
      }

      if (comparisonResult !== 0) {
        return criterion.direction === SortDirection.ASC ? comparisonResult : -comparisonResult;
      }
    }
    
    return 0; // All criteria are equal
  });
};

// Export the template instance for easy use
// Helper function to get sort direction for a specific column
export const getSortDirectionForColumn = (
  columnId: string,
  sorting: SortCriteria
): SortDirection => {
  const criterion = sorting.find(c => c.columnId === columnId);
  return criterion ? criterion.direction : SortDirection.NONE;
};

// Helper function to get sort order for a specific column
export const getSortOrderForColumn = (
  columnId: string,
  sorting: SortCriteria
): number => {
  const index = sorting.findIndex(c => c.columnId === columnId);
  return index !== -1 ? index + 1 : 0;
};

export const sortableHeaderTemplate = new SortableHeaderTemplate(); 