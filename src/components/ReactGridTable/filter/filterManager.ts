/**
 * Filter manager hook for ReactGrid table filtering.
 * 
 * This hook provides a clean API for managing filter state and operations.
 * It encapsulates all filter-related state management and provides methods
 * for filter operations while delegating the actual filtering logic to
 * pure functions in filterOperations.ts.
 * 
 * Dependencies:
 * - filterOperations.ts for pure filtering functions
 * - FilterTypes for type definitions
 * - TableColumn types for column definitions
 */

import { useState, useMemo } from 'react';
import { FilterState, FilterCriteria, CustomFilterConfig } from './FilterTypes';
import { TableColumn, CompatibleData } from '../types';
import { 
  applyFilters, 
  getActiveFilterCount 
} from './filterOperations';

/**
 * Filter manager object that provides a clean API for filter operations.
 */
export interface FilterManager<T extends CompatibleData> {
  // State access
  getState: () => FilterState;
  
  // Filter operations
  setSearchText: (text: string) => void;
  toggleCustomFilter: (filterKey: string) => void;
  clearAllFilters: () => void;
  addColumnFilter: (filter: FilterCriteria) => void;
  removeColumnFilter: (filterToRemove: FilterCriteria) => void;
  removeCustomFilter: (filterKey: string) => void;
  clearSearch: () => void;
  
  // Computed values
  getFilteredData: () => T[];
  getActiveFilterCount: () => number;
}

/**
 * Hook that provides a filter manager for ReactGrid table filtering.
 * 
 * @param data - The data to filter
 * @param columns - Column definitions
 * @param customFilters - Custom filter configurations
 * @returns FilterManager object with filter operations
 */
export const useFilterManager = <T extends CompatibleData>(
  data: T[],
  columns: TableColumn<T>[],
  customFilters: CustomFilterConfig<T>[] = []
): FilterManager<T> => {
  const [filterState, setFilterState] = useState<FilterState>({
    searchText: '',
    columnFilters: [],
    customFilters: {}
  });

  const filterManager = useMemo((): FilterManager<T> => ({
    // State access
    getState: () => filterState,
    
    // Filter operations
    setSearchText: (text: string) => {
      setFilterState(prev => ({ ...prev, searchText: text }));
    },
    
    toggleCustomFilter: (filterKey: string) => {
      setFilterState(prev => ({
        ...prev,
        customFilters: {
          ...prev.customFilters,
          [filterKey]: !prev.customFilters[filterKey]
        }
      }));
    },
    
    clearAllFilters: () => {
      setFilterState({
        searchText: '',
        columnFilters: [],
        customFilters: {}
      });
    },
    
    addColumnFilter: (filter: FilterCriteria) => {
      setFilterState(prev => ({
        ...prev,
        columnFilters: [
          ...prev.columnFilters.filter(f => f.columnId !== filter.columnId),
          filter
        ]
      }));
    },
    
    removeColumnFilter: (filterToRemove: FilterCriteria) => {
      setFilterState(prev => ({
        ...prev,
        columnFilters: prev.columnFilters.filter(
          filter => !(filter.columnId === filterToRemove.columnId && 
                      filter.comparison === filterToRemove.comparison && 
                      filter.value === filterToRemove.value)
        )
      }));
    },
    
    removeCustomFilter: (filterKey: string) => {
      setFilterState(prev => {
        const newCustomFilters = { ...prev.customFilters };
        delete newCustomFilters[filterKey];
        return { ...prev, customFilters: newCustomFilters };
      });
    },
    
    clearSearch: () => {
      setFilterState(prev => ({ ...prev, searchText: '' }));
    },
    
    // Computed values
    getFilteredData: () => {
      return applyFilters(data, filterState, columns, customFilters);
    },
    
    getActiveFilterCount: () => {
      return getActiveFilterCount(filterState);
    }
  }), [filterState, data, columns, customFilters]);

  return filterManager;
};
