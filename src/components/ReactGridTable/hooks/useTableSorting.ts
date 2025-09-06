/**
 * useTableSorting hook - Provides reusable sorting functionality for table data.
 * 
 * This hook manages sorting state and provides sorted data for any table component.
 * It's designed to work with ReactGridTable and can be used by any component that
 * needs to sort tabular data.
 * 
 * Features:
 * - Multi-column sorting support
 * - Type-safe sorting for text, number, and date columns
 * - Automatic direction cycling (asc -> desc -> none)
 * - Generic implementation that works with any data type
 * 
 * Usage:
 * ```tsx
 * const { sorting, setSorting, sortedData, handleSort } = useTableSorting(data, columns);
 * ```
 */

import { useState, useMemo, useCallback } from 'react';
import { CompatibleData } from '../types';

export interface SortCriteria {
  columnId: string;
  direction: SortDirection;
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
  NONE = 'none'
}

export interface TableColumn {
  columnId: string | number;
  field: string | number | symbol;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'custom';
  nonSortable?: boolean;
}

/**
 * Custom hook for table sorting functionality
 * 
 * @param data - Array of data items to sort
 * @param columns - Array of column definitions
 * @returns Object containing sorting state and utilities
 */
export function useTableSorting<T extends CompatibleData>(
  data: T[],
  columns: TableColumn[]
) {
  const [sortingState, setSortingState] = useState<SortCriteria[]>([]);

  // Sort the data based on current sorting criteria
  const sortedData = useMemo(() => {
    if (sortingState.length === 0) return data;
    
    return [...data].sort((a, b) => {
      for (const sort of sortingState) {
        const column = columns.find(col => String(col.columnId) === sort.columnId);
        if (!column || column.nonSortable) continue;
        
        const aValue = a[column.field as keyof T];
        const bValue = b[column.field as keyof T];
        
        let comparison = 0;
        
        switch (column.type) {
          case 'text':
            comparison = String(aValue || '').localeCompare(String(bValue || ''));
            break;
          case 'number':
            comparison = (Number(aValue) || 0) - (Number(bValue) || 0);
            break;
          case 'date':
            const aDate = aValue ? new Date(aValue) : new Date(0);
            const bDate = bValue ? new Date(bValue) : new Date(0);
            // Handle invalid dates - use new Date(0) for invalid dates like the original implementation
            const aTime = !isNaN(aDate.getTime()) ? aDate.getTime() : new Date(0).getTime();
            const bTime = !isNaN(bDate.getTime()) ? bDate.getTime() : new Date(0).getTime();
            comparison = aTime - bTime;
            break;
          default:
            comparison = String(aValue || '').localeCompare(String(bValue || ''));
        }
        
        if (comparison !== 0) {
          return sort.direction === SortDirection.ASC ? comparison : -comparison;
        }
      }
      return 0;
    });
  }, [data, sortingState, columns]);

  // Handle sort column click - cycles through asc -> desc -> none
  const handleChangeSortState = useCallback((columnId: string) => {
    setSortingState(prev => {
      // Check if column exists and is sortable
      const column = columns.find(col => String(col.columnId) === columnId);
      if (!column || column.nonSortable) {
        return prev; // Don't change sorting state for non-existent or non-sortable columns
      }

      const currentSort = prev.find(s => s.columnId === columnId);
      let newSorting = [...prev];
      
      if (currentSort?.direction === SortDirection.ASC) {
        // Change to desc
        newSorting = newSorting.map(s => 
          s.columnId === columnId ? { ...s, direction: SortDirection.DESC } : s
        );
      } else if (currentSort?.direction === SortDirection.DESC) {
        // Remove from sorting
        newSorting = newSorting.filter(s => s.columnId !== columnId);
      } else {
        // Add new sort column
        newSorting.push({ columnId, direction: SortDirection.ASC });
      }
      
      return newSorting;
    });
  }, [columns]);

  // Get sort direction for a specific column
  const getColumnSortDirection = useCallback((columnId: string): SortDirection => {
    const sort = sortingState.find(s => s.columnId === columnId);
    return sort?.direction ?? SortDirection.NONE;
  }, [sortingState]);

  // Get sort order for a specific column (1-based index)
  const getColumnSortOrder = useCallback((columnId: string): number => {
    const index = sortingState.findIndex(s => s.columnId === columnId);
    return index >= 0 ? index + 1 : 0;
  }, [sortingState]);

  // Clear all sorting
  const clearSorting = useCallback(() => {
    setSortingState([]);
  }, []);

  return {
    sortedData,
    handleChangeSortState,
    getColumnSortDirection,
    getColumnSortOrder,
    sortingState,
    clearSorting
  };
}
