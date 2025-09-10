/**
 * Core types for ReactGridTable component.
 * 
 * This file defines the interfaces and types needed for the ReactGridTable component,
 * which extends ReactGrid with common table functionality.
 */

import { Column, Row, CellChange, Id, DefaultCellTypes, ReactGridProps } from '@silevis/reactgrid';
import { SortableHeaderCell } from '../reactgrid/SortableHeaderCell';
import React from 'react';
import { FilterState } from './filter/FilterTypes';

// Extend the default cell types to include our custom types
export type CustomCellTypes = DefaultCellTypes | SortableHeaderCell;

/**
 * Custom Column interface for ReactGridTable with custom rendering.
 * 
 * This extends the base ReactGrid Column interface to include:
 * - render: Custom render function for the column
 * - label: Display name for the column
 * - nonFilterable: Whether to exclude from filtering (default: false)
 * - nonSortable: Whether to exclude from sorting (default: false)
 * - nonSearchable: Whether column should be excluded from global search (default: false = searchable)
 */

/**
 * Data Column interface for ReactGridTable with automatic data binding.
 * 
 * This extends the base ReactGrid Column interface to include:
 * - field: The data field name for automatic row generation
 * - type: The cell type for proper rendering and validation
 * - label: Display name for the column
 * - nonFilterable: Whether to exclude from filtering (default: false)
 * - nonSortable: Whether to exclude from sorting (default: false)
 * - nonSearchable: Whether column should be excluded from global search (default: false = searchable)
 */

export type CompatibleData = { [key: string]: any | {id: string}};
export interface DataTableColumn<T extends CompatibleData> extends Column {
  /** The field name from the data type T */
  field: keyof T;
  
  /** The cell type for proper rendering and validation */
  type: 'text' | 'number' | 'date' | 'dropdown' | 'custom';
  
  /** Display name for the column */
  label: string;
  
  /** Optional formatter for the cell value */
  format?: Intl.NumberFormat | Intl.DateTimeFormat | ((value: any) => string);
  
  /** Whether to exclude from filtering (default: false = filterable) */
  nonFilterable?: boolean;
  
  /** Whether to exclude from sorting (default: false = sortable) */
  nonSortable?: boolean;
  
  /** Whether column should be excluded from global search (default: false = searchable) */
  nonSearchable?: boolean;
}

export interface CustomTableColumn<T extends CompatibleData> extends DataTableColumn<T> {
    /** Custom render function for the column */
    render: (rowId: string, item: T, rowIndex: number) => React.ReactNode;

    type: 'custom';

    field: 'id';
    
    /** Display name for the column */
    label: '';
    
    /** Whether to exclude from filtering (default: false = filterable) */
    nonFilterable?: true;
    
    /** Whether to exclude from sorting (default: false = sortable) */
    nonSortable?: true;
    
    /** Whether column should be excluded from global search (default: false = searchable) */
    nonSearchable?: true;
  }

/**
 * Union type for all column types in ReactGridTable.
 */
export type TableColumn<T extends CompatibleData> = DataTableColumn<T> | CustomTableColumn<T>;

/**
 * Type guard to check if a column is a data column.
 */
export function isDataColumn<T extends CompatibleData>(column: TableColumn<T>): column is DataTableColumn<T> {
  return !isCustomColumn(column);
}

/**
 * Type guard to check if a column is a custom column.
 */
export function isCustomColumn<T extends CompatibleData>(column: TableColumn<T>): column is CustomTableColumn<T> {
  return 'render' in column;
}

/**
 * Props interface for ReactGridTable component.
 * 
 * Extends ReactGridProps to inherit all standard ReactGrid functionality
 * while adding our custom table features.
 */
export interface ReactGridTableProps<T extends CompatibleData> extends Omit<ReactGridProps, 'rows' | 'columns'> {
  /** Array of column definitions */
  columns: TableColumn<T>[];
  
  /** Array of data objects to display */
  data: T[];
  
  /** Callback for when a row should be added (if not provided, no add-row is shown) */
  handleRowAdd?: (row: Partial<T>) => void;
  
  /** Initial table size (default: 'medium') */
  initialTableSize?: 'small' | 'medium' | 'large' | 'unbounded';
  
  /** Custom filter configurations for quick filter buttons */
  customFilters?: import('./filter/FilterTypes').CustomFilterConfig<T>[];
  
  /** Whether to disable global search functionality (default: false = searchable) */
  nonSearchable?: boolean;
  
  /** Row styles mapping rowId to sx styles for each cell in that row */
  rowStyle?: Record<string, any>;
}

/**
 * Internal state interface for the ReactGridTable component.
 */
export interface ReactGridTableState {
  /** Column widths for resizable columns */
  columnWidths: Record<string, number>;
  
  /** Current table size */
  tableSize: 'small' | 'medium' | 'large' | 'unbounded';
}

/**
 * Utility type for row generation.
 * 
 * Represents a row that can be either a header row, data row, or add row.
 */
export type TableRow<T> = 
  | { rowId: 'header'; cells: any[]; type: 'header' }
  | { rowId: 'add-row'; cells: any[]; type: 'add-row' }
  | { rowId: string; cells: any[]; type: 'data'; data: T };




