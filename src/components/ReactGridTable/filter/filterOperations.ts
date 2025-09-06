/**
 * Pure filtering operations for ReactGrid table data.
 * 
 * This module contains all the core filtering logic as pure functions.
 * These functions are stateless and can be easily tested and reused.
 * 
 * Dependencies:
 * - FilterTypes for type definitions
 * - TableColumn types for column definitions
 */

import { FilterState, FilterCriteria, CustomFilterConfig } from './FilterTypes';
import { TableColumn, CompatibleData } from '../types';

/**
 * Apply all filters to the data and return filtered results.
 */
export const applyFilters = <T extends CompatibleData>(
  data: T[],
  filterState: FilterState,
  columns: TableColumn<T>[],
  customFilters: CustomFilterConfig<T>[] = []
): T[] => {
  let result = data;

  // Apply search filter
  if (filterState.searchText.trim()) {
    result = applySearchFilter(result, filterState.searchText, columns);
  }

  // Apply column filters
  if (filterState.columnFilters.length > 0) {
    result = applyColumnFilters(result, filterState.columnFilters, columns);
  }

  // Apply custom filters
  if (Object.keys(filterState.customFilters).length > 0) {
    result = applyCustomFilters(result, filterState.customFilters, customFilters);
  }

  return result;
};

/**
 * Apply text search filter across searchable columns.
 */
export const applySearchFilter = <T extends CompatibleData>(
  data: T[],
  searchText: string,
  columns: TableColumn<T>[]
): T[] => {
  if (!searchText.trim()) return data;

  const searchTerms = searchText.toLowerCase().split(/\s+/).filter(term => term.length > 0);
  const searchableColumns = columns.filter(col => !col.nonSearchable);

  return data.filter(item => {
    return searchTerms.every(term => {
      return searchableColumns.some(column => {
        const value = item[column.field as keyof T];
        const stringValue = String(value || '').toLowerCase();
        return stringValue.includes(term);
      });
    });
  });
};

/**
 * Apply column-specific filters.
 */
export const applyColumnFilters = <T extends CompatibleData>(
  data: T[],
  columnFilters: FilterCriteria[],
  columns: TableColumn<T>[]
): T[] => {
  if (columnFilters.length === 0) return data;

  return data.filter(item => {
    return columnFilters.every(filter => {
      const column = columns.find(col => col.columnId === filter.columnId);
      if (!column) return true;

      const value = item[column.field as keyof T];
      return compareValues(value, filter.value, filter.comparison, column.type);
    });
  });
};

/**
 * Apply custom filters.
 */
export const applyCustomFilters = <T extends CompatibleData>(
  data: T[],
  customFilters: Record<string, boolean>,
  customFilterConfigs: CustomFilterConfig<T>[]
): T[] => {
  const activeCustomFilters = customFilterConfigs.filter(config => 
    customFilters[config.key] === true
  );

  if (activeCustomFilters.length === 0) return data;

  return data.filter(item => {
    return activeCustomFilters.every(filterConfig => {
      return filterConfig.filterFunction(item);
    });
  });
};

/**
 * Compare two values based on the comparison operator and column type.
 */
export const compareValues = (
  itemValue: any,
  filterValue: string | number | Date | undefined,
  comparison: string,
  columnType: string
): boolean => {
  const convertedFilterValue = convertFilterValue(filterValue, columnType);
  const convertedItemValue = convertFilterValue(itemValue, columnType);

  switch (comparison) {
    case 'equals':
      if (columnType === 'date') {
        return convertedItemValue instanceof Date && convertedFilterValue instanceof Date && 
               convertedItemValue.getTime() === convertedFilterValue.getTime();
      }
      return convertedItemValue === convertedFilterValue;
    case 'not_equals':
      if (columnType === 'date') {
        return !(convertedItemValue instanceof Date && convertedFilterValue instanceof Date && 
                 convertedItemValue.getTime() === convertedFilterValue.getTime());
      }
      return convertedItemValue !== convertedFilterValue;
    case 'greater_than':
      if (columnType === 'date') {
        return convertedItemValue instanceof Date && convertedFilterValue instanceof Date && 
               convertedItemValue.getTime() > convertedFilterValue.getTime();
      }
      return convertedItemValue > convertedFilterValue;
    case 'less_than':
      if (columnType === 'date') {
        return convertedItemValue instanceof Date && convertedFilterValue instanceof Date && 
               convertedItemValue.getTime() < convertedFilterValue.getTime();
      }
      return convertedItemValue < convertedFilterValue;
    case 'greater_than_or_equal':
      if (columnType === 'date') {
        return convertedItemValue instanceof Date && convertedFilterValue instanceof Date && 
               convertedItemValue.getTime() >= convertedFilterValue.getTime();
      }
      return convertedItemValue >= convertedFilterValue;
    case 'less_than_or_equal':
      if (columnType === 'date') {
        return convertedItemValue instanceof Date && convertedFilterValue instanceof Date && 
               convertedItemValue.getTime() <= convertedFilterValue.getTime();
      }
      return convertedItemValue <= convertedFilterValue;
    case 'contains':
      return String(convertedItemValue).toLowerCase().includes(String(convertedFilterValue).toLowerCase());
    case 'not_contains':
      return !String(convertedItemValue).toLowerCase().includes(String(convertedFilterValue).toLowerCase());
    case 'starts_with':
      return String(convertedItemValue).toLowerCase().startsWith(String(convertedFilterValue).toLowerCase());
    case 'ends_with':
      return String(convertedItemValue).toLowerCase().endsWith(String(convertedFilterValue).toLowerCase());
    default:
      return false;
  }
};

/**
 * Convert a value to the appropriate type for comparison.
 */
export const convertFilterValue = (value: any, columnType: string): any => {
  if (value === null || value === undefined) return null;

  switch (columnType) {
    case 'number':
      return Number(value);
    case 'date':
      return new Date(value);
    case 'text':
    case 'dropdown':
    case 'custom':
    default:
      return String(value);
  }
};

/**
 * Get the display text for a comparison operator.
 */
export const getComparisonDisplayText = (comparison: string): string => {
  const comparisonMap: Record<string, string> = {
    equals: 'equals',
    not_equals: 'not equals',
    greater_than: 'greater than',
    less_than: 'less than',
    greater_than_or_equal: 'greater than or equal',
    less_than_or_equal: 'less than or equal',
    contains: 'contains',
    not_contains: 'does not contain',
    starts_with: 'starts with',
    ends_with: 'ends with'
  };
  return comparisonMap[comparison] || comparison;
};

/**
 * Get columns that can be filtered.
 */
export const getFilterableColumns = <T extends CompatibleData>(
  columns: TableColumn<T>[]
): TableColumn<T>[] => {
  return columns.filter(col => !col.nonFilterable);
};

/**
 * Get filter options for a column based on its type.
 */
export const getColumnFilterOptions = (columnType: string): string[] => {
  const baseOptions = ['equals', 'not_equals'];
  
  switch (columnType) {
    case 'text':
    case 'dropdown':
      return [...baseOptions, 'contains', 'not_contains', 'starts_with', 'ends_with'];
    case 'number':
      return [...baseOptions, 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal', 'contains'];
    case 'date':
      return [...baseOptions, 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal'];
    default:
      return baseOptions;
  }
};

/**
 * Check if a filter value is valid for the given column type.
 */
export const isValidFilterValue = (value: string, columnType: string): boolean => {
  if (!value.trim()) return false;

  switch (columnType) {
    case 'number':
      return !isNaN(Number(value));
    case 'date':
      return !isNaN(Date.parse(value));
    default:
      return true;
  }
};

/**
 * Get the type of a filter value.
 */
export const getFilterValueType = (value: any): string => {
  if (typeof value === 'number') return 'number';
  if (value instanceof Date) return 'date';
  return 'text';
};

/**
 * Count the number of active filters.
 */
export const getActiveFilterCount = (filterState: FilterState): number => {
  let count = 0;
  if (filterState.searchText) count++;
  if (filterState.columnFilters.length > 0) count += filterState.columnFilters.length;
  count += Object.values(filterState.customFilters).filter(Boolean).length;
  return count;
};
