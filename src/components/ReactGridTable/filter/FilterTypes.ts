/**
 * Filter-related types for data-first filtering.
 * 
 * This file contains the types needed for filtering functionality
 * that works with raw data objects instead of ReactGrid Row objects.
 */

// Generic filter criteria that works with any data type
export interface FilterCriteria {
  columnId: string; // Always string for consistency
  comparison: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'null';
  value?: string | number | Date;
}

// Generic filter state that works with any table
export interface FilterState {
  searchText: string;
  columnFilters: FilterCriteria[];
  customFilters: Record<string, boolean>; // For custom quick filters like "suspicious", "new", etc.
}

// Helper type for quick filter functions that work with data items
export type CustomFilterFunction<T> = (item: T) => boolean;

// Configuration for quick filter buttons
export interface CustomFilterConfig<T> {
  key: string;
  label?: string; // Optional, defaults to capitalized key
  filterFunction: CustomFilterFunction<T>; // The actual filter logic
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  tooltip?: string;
}