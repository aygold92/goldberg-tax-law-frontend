/**
 * Extended Column interface for ReactGrid with filtering capabilities.
 * 
 * This extends the base ReactGrid Column interface to include filtering metadata:
 * - filterable: Whether the column supports filtering
 * - filterType: The cell type for filtering (determines available comparisons)
 * - filterLabel: Display name for the column in filter UI
 * - nonSearchable: Whether the column should be excluded from global search (default: false)
 * 
 * Usage:
 * ```tsx
 * const columns: FilterableColumn[] = [
 *   { 
 *     columnId: 'date', 
 *     width: 120, 
 *     filterable: true, 
 *     filterType: 'date',
 *     filterLabel: 'Date'
 *     // nonSearchable defaults to false, so this column will be searched
 *   },
 *   { 
 *     columnId: 'actions', 
 *     width: 80, 
 *     filterable: false,
 *     nonSearchable: true // Explicitly exclude from search
 *   }
 * ];
 * ```
 */

import { Column, Row } from '@silevis/reactgrid';

// Extended Column interface with filtering capabilities
export interface FilterableColumn extends Column {
  filterable?: boolean;
  filterType?: 'text' | 'number' | 'date';
  filterLabel?: string;
  nonSearchable?: boolean; // Default: false (column is searchable unless explicitly set to true)
}

// Generic filter criteria that works with any data type
export interface GenericFilterCriteria {
  columnId: string; // Always string for consistency
  comparison: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'null';
  value?: string | number | Date;
}

// Generic filter state that works with any table
export interface GenericFilterState {
  searchText: string;
  advancedFilters: GenericFilterCriteria[];
  quickFilters: Record<string, boolean>; // For custom quick filters like "suspicious", "new", etc.
}

// Helper type for quick filter functions that work with row IDs
export type QuickFilterFunction = (rowId: string) => boolean;

// Configuration for quick filter buttons
export interface QuickFilterConfig {
  key: string;
  label?: string; // Optional, defaults to capitalized key
  filterFunction: QuickFilterFunction; // The actual filter logic
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  tooltip?: string;
}