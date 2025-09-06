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
import { SortDirection } from '../ReactGridTable/hooks/useTableSorting';
import styles from '../../styles/components/SortableHeaderCell.module.css';

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
  filterable?: boolean; // Add this to indicate if column is filterable
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
    
    const filterable = getOptionalCellProperty<SortableHeaderCell['filterable']>(uncertainCell, 'filterable', 'boolean') || false;
    
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
      filterable,
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
      <Box 
        className={styles.headerContainer}
        style={cell.style as React.CSSProperties || {}}
      >
        <Box className={styles.headerLeft}>
          <span>{cell.text}</span>
          <IconButton 
            size="small" 
            onClick={() => cell.onSort(cell.columnId)}
            className={styles.sortButton}
          >
            {getSortIcon()}
          </IconButton>
          {cell.sortOrder > 0 && cell.sortDirection !== SortDirection.NONE && (
            <Box className={styles.sortOrder}>
              {cell.sortOrder}
            </Box>
          )}
        </Box>
        
        {/* Filter Icon */}
        {cell.onFilter && cell.filterable && (
          <Tooltip title="Filter column">
            <IconButton
              size="small"
              onClick={(e) => cell.onFilter!(cell.columnId, e)}
              className={`${styles.filterButton} ${cell.hasFilter ? styles.filterButtonActive : styles.filterButtonInactive}`}
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

export const sortableHeaderTemplate = new SortableHeaderTemplate(); 