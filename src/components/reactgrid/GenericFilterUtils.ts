/**
 * Generic filter utilities for ReactGrid tables.
 * 
 * This file contains generic filtering functions that work with ReactGrid Row objects:
 * - Generic filter application logic
 * - Comparison operators based on data types
 * - Input type determination
 * - Display text generation
 * 
 * Usage:
 * ```tsx
 * import { applyGenericFilters, getComparisonOperators } from './GenericFilterUtils';
 * 
 * const filteredRows = applyGenericFilters(rows, filters, columns, quickFilters);
 * ```
 */

import { Row } from '@silevis/reactgrid';
import { GenericFilterCriteria, GenericFilterState, FilterableColumn, QuickFilterConfig } from './FilterableColumn';

/**
 * Applies generic filters to ReactGrid rows
 */
export const applyGenericFilters = (
  rows: Row<any>[],
  filters: GenericFilterState,
  columns: FilterableColumn[],
  quickFilterConfigs?: QuickFilterConfig[]
): Row<any>[] => {
  return rows.filter(row => {
    // Skip header rows and add-row
    if (row.rowId === 'header' || row.rowId === 'add-row') return true;
    
    // Apply search text filter
    if (filters.searchText) {
      const searchTerms = filters.searchText.toLowerCase().split(' ').filter(term => term.trim());
      if (searchTerms.length > 0) {
        // Get searchable columns (default: true, unless explicitly set to nonSearchable: true)
        const searchableColumns = columns.filter(col => col.nonSearchable !== true);
        const rowText = searchableColumns
          .map(col => {
            const columnIndex = columns.findIndex(c => c.columnId === col.columnId);
            if (columnIndex === -1) return '';
            const cell = row.cells[columnIndex];
            return getCellText(cell) || '';
          })
          .join(' ')
          .toLowerCase();
        
        if (!searchTerms.every(term => rowText.includes(term))) {
          return false;
        }
      }
    }
    
    // Apply advanced filters
    for (const filter of filters.advancedFilters) {
      if (!matchesGenericFilter(row, filter, columns)) {
        return false;
      }
    }
    
    // Apply quick filters
    for (const [filterKey, isActive] of Object.entries(filters.quickFilters)) {
      if (isActive) {
        const config = quickFilterConfigs?.find(c => c.key === filterKey);
        if (config && !config.filterFunction(row.rowId as string)) {
          return false;
        }
      }
    }
    
    return true;
  });
};

/**
 * Gets text content from a cell for search purposes
 */
const getCellText = (cell: any): string => {
  if (!cell) return '';
  
  switch (cell.type) {
    case 'text':
      return cell.text || '';
    case 'number':
      return cell.value?.toString() || '';
    case 'date':
      return cell.date?.toISOString() || '';
    default:
      return '';
  }
};

/**
 * Checks if a row matches a specific filter criteria
 */
const matchesGenericFilter = (
  row: Row<any>, 
  filter: GenericFilterCriteria, 
  columns: FilterableColumn[]
): boolean => {
  const columnIndex = columns.findIndex(col => col.columnId === filter.columnId);
  if (columnIndex === -1) return true;
  
  const cell = row.cells[columnIndex];
  if (!cell) return filter.comparison === 'null';
  
  let value: any;
  switch (cell.type) {
    case 'text':
      value = cell.text;
      break;
    case 'number':
      value = cell.value;
      break;
    case 'date':
      value = cell.date;
      break;
    default:
      value = cell.text || cell.value;
  }
  
  switch (filter.comparison) {
    case 'equals':
      return value === filter.value;
    case 'not_equals':
      return value !== filter.value;
    case 'greater_than':
      return filter.value !== undefined && value > filter.value;
    case 'less_than':
      return filter.value !== undefined && value < filter.value;
    case 'null':
      return value === null || value === undefined || value === '';
    default:
      return true;
  }
};

/**
 * Gets the comparison operators available for a filter type
 */
export const getComparisonOperators = (filterType: FilterableColumn['filterType']): GenericFilterCriteria['comparison'][] => {
  switch (filterType) {
    case 'date':
    case 'number':
      return ['equals', 'not_equals', 'greater_than', 'less_than', 'null'];
    case 'text':
    default:
      return ['equals', 'not_equals', 'null'];
  }
};

/**
 * Gets the input type for a filter type
 */
export const getInputType = (filterType: FilterableColumn['filterType']): string => {
  switch (filterType) {
    case 'date':
      return 'date';
    case 'number':
      return 'number';
    case 'text':
    default:
      return 'text';
  }
};

/**
 * Gets the display text for a comparison operator
 */
export const getComparisonDisplayText = (comparison: GenericFilterCriteria['comparison']): string => {
  switch (comparison) {
    case 'equals': return 'Equals';
    case 'not_equals': return 'Not equals';
    case 'greater_than': return 'Greater than';
    case 'less_than': return 'Less than';
    case 'null': return 'Is null/empty';
    default: return comparison;
  }
};

/**
 * Converts a value to the appropriate type for filtering
 */
export const convertFilterValue = (
  value: string | number | Date | undefined,
  filterType: FilterableColumn['filterType']
): string | number | Date | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  
  switch (filterType) {
    case 'number':
      const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
      return isNaN(numValue) ? undefined : numValue;
    case 'date':
      if (typeof value === 'string') {
        const dateValue = new Date(value);
        return isNaN(dateValue.getTime()) ? undefined : dateValue;
      }
      return value instanceof Date ? value : undefined;
    case 'text':
    default:
      return String(value);
  }
};