/**
 * Unit tests for useTableSorting hook
 * 
 * These tests port the comprehensive test cases from SortableHeaderCell.test.tsx
 * to ensure the hook provides the same robust sorting functionality.
 */

import { renderHook, act } from '@testing-library/react';
import { useTableSorting, SortCriteria, TableColumn } from '../useTableSorting';
import { SortDirection } from '../useTableSorting';
import { CompatibleData } from '../../types';

// Mock data interfaces
interface TestData extends CompatibleData {
  id: string;
  text: string;
  number: number;
  date: Date;
}

describe('useTableSorting', () => {
  const INVALID_DATE = new Date('invalid');

  const mockColumns: TableColumn[] = [
    { columnId: 'text', field: 'text', type: 'text' },
    { columnId: 'number', field: 'number', type: 'number' },
    { columnId: 'date', field: 'date', type: 'date' }
  ];

  const createTestData = (id: string, text: any, number: any, date: any): TestData => ({
    id,
    text,
    number,
    date
  });

  describe('Text column sorting', () => {
    it('should handle null/undefined text values', () => {
      const data = [
        createTestData('1', 'apple', 1, new Date('2023-01-01')),
        createTestData('2', null, 2, new Date('2023-01-02')),
        createTestData('3', undefined, 3, new Date('2023-01-03')),
        createTestData('4', 'banana', 4, new Date('2023-01-04'))
      ];

      const { result } = renderHook(() => useTableSorting(data, mockColumns));

      act(() => {
        result.current.handleChangeSortState('text');
      });

      expect(result.current.sortedData).toEqual([
        createTestData('2', null, 2, new Date('2023-01-02')),
        createTestData('3', undefined, 3, new Date('2023-01-03')),
        createTestData('1', 'apple', 1, new Date('2023-01-01')),
        createTestData('4', 'banana', 4, new Date('2023-01-04'))
      ]);
    });

    it('should handle null/undefined text values in descending order', () => {
      const data = [
        createTestData('1', 'apple', 1, new Date('2023-01-01')),
        createTestData('2', null, 2, new Date('2023-01-02')),
        createTestData('3', undefined, 3, new Date('2023-01-03')),
        createTestData('4', 'banana', 4, new Date('2023-01-04'))
      ];

      const { result } = renderHook(() => useTableSorting(data, mockColumns));

      // First click: ASC
      act(() => {
        result.current.handleChangeSortState('text');
      });

      // Second click: DESC
      act(() => {
        result.current.handleChangeSortState('text');
      });

      expect(result.current.sortedData).toEqual([
        createTestData('4', 'banana', 4, new Date('2023-01-04')),
        createTestData('1', 'apple', 1, new Date('2023-01-01')),
        createTestData('2', null, 2, new Date('2023-01-02')),
        createTestData('3', undefined, 3, new Date('2023-01-03'))
      ]);
    });

    it('should handle empty strings in text sorting', () => {
      const data = [
        createTestData('1', '', 1, new Date('2023-01-01')),
        createTestData('2', 'zebra', 2, new Date('2023-01-02')),
        createTestData('3', 'apple', 3, new Date('2023-01-03'))
      ];

      const { result } = renderHook(() => useTableSorting(data, mockColumns));

      act(() => {
        result.current.handleChangeSortState('text');
      });

      expect(result.current.sortedData).toEqual([
        createTestData('1', '', 1, new Date('2023-01-01')),
        createTestData('3', 'apple', 3, new Date('2023-01-03')),
        createTestData('2', 'zebra', 2, new Date('2023-01-02'))
      ]);
    });
  });

  describe('Number column sorting', () => {
    it('should handle NaN values in number sorting', () => {
      const data = [
        createTestData('1', 'a', 5, new Date('2023-01-01')),
        createTestData('2', 'b', NaN, new Date('2023-01-02')),
        createTestData('3', 'c', 3, new Date('2023-01-03')),
        createTestData('4', 'd', undefined, new Date('2023-01-04'))
      ];

      const { result } = renderHook(() => useTableSorting(data, mockColumns));

      act(() => {
        result.current.handleChangeSortState('number');
      });

      expect(result.current.sortedData).toEqual([
        createTestData('2', 'b', NaN, new Date('2023-01-02')),
        createTestData('4', 'd', undefined, new Date('2023-01-04')),
        createTestData('3', 'c', 3, new Date('2023-01-03')),
        createTestData('1', 'a', 5, new Date('2023-01-01'))
      ]);
    });

    it('should handle null values in number sorting', () => {
      const data = [
        createTestData('1', 'a', null, new Date('2023-01-01')),
        createTestData('2', 'b', 10, new Date('2023-01-02')),
        createTestData('3', 'c', 5, new Date('2023-01-03'))
      ];

      const { result } = renderHook(() => useTableSorting(data, mockColumns));

      act(() => {
        result.current.handleChangeSortState('number');
      });

      expect(result.current.sortedData).toEqual([
        createTestData('1', 'a', null, new Date('2023-01-01')),
        createTestData('3', 'c', 5, new Date('2023-01-03')),
        createTestData('2', 'b', 10, new Date('2023-01-02'))
      ]);
    });

    it('should handle descending number sorting with invalid values', () => {
      const data = [
        createTestData('1', 'a', 15, new Date('2023-01-01')),
        createTestData('2', 'b', NaN, new Date('2023-01-02')),
        createTestData('3', 'c', 5, new Date('2023-01-03'))
      ];

      const { result } = renderHook(() => useTableSorting(data, mockColumns));

      // First click: ASC
      act(() => {
        result.current.handleChangeSortState('number');
      });

      // Second click: DESC
      act(() => {
        result.current.handleChangeSortState('number');
      });

      expect(result.current.sortedData).toEqual([
        createTestData('1', 'a', 15, new Date('2023-01-01')),
        createTestData('3', 'c', 5, new Date('2023-01-03')),
        createTestData('2', 'b', NaN, new Date('2023-01-02'))
      ]);
    });
  });

  describe('Date column sorting', () => {
    it('should handle Invalid Date values', () => {
      const data = [
        createTestData('1', 'a', 1, new Date('2023-01-01')),
        createTestData('2', 'b', 2, INVALID_DATE),
        createTestData('3', 'c', 3, new Date('2023-01-03')),
        createTestData('4', 'd', 4, undefined),
        createTestData('5', 'e', 5, INVALID_DATE)
      ];

      const { result } = renderHook(() => useTableSorting(data, mockColumns));

      act(() => {
        result.current.handleChangeSortState('date');
      });

      expect(result.current.sortedData).toEqual([
        createTestData('2', 'b', 2, INVALID_DATE),
        createTestData('4', 'd', 4, undefined),
        createTestData('5', 'e', 5, INVALID_DATE),
        createTestData('1', 'a', 1, new Date('2023-01-01')),
        createTestData('3', 'c', 3, new Date('2023-01-03'))
      ]);
    });

    it('should handle null date values', () => {
      const data = [
        createTestData('1', 'a', 1, null),
        createTestData('2', 'b', 2, new Date('2023-01-02')),
        createTestData('3', 'c', 3, new Date('2023-01-01'))
      ];

      const { result } = renderHook(() => useTableSorting(data, mockColumns));

      act(() => {
        result.current.handleChangeSortState('date');
      });

      expect(result.current.sortedData).toEqual([
        createTestData('1', 'a', 1, null),
        createTestData('3', 'c', 3, new Date('2023-01-01')),
        createTestData('2', 'b', 2, new Date('2023-01-02'))
      ]);
    });

    it('should handle descending date sorting with invalid dates', () => {
      const data = [
        createTestData('1', 'a', 1, new Date('2023-01-03')),
        createTestData('2', 'b', 2, INVALID_DATE),
        createTestData('3', 'c', 3, new Date('2023-01-01'))
      ];

      const { result } = renderHook(() => useTableSorting(data, mockColumns));

      // First click: ASC
      act(() => {
        result.current.handleChangeSortState('date');
      });

      // Second click: DESC
      act(() => {
        result.current.handleChangeSortState('date');
      });

      expect(result.current.sortedData).toEqual([
        createTestData('1', 'a', 1, new Date('2023-01-03')),
        createTestData('3', 'c', 3, new Date('2023-01-01')),
        createTestData('2', 'b', 2, INVALID_DATE)
      ]);
    });
  });

  describe('Multi-column sorting', () => {
    it('should handle invalid values in multi-column sorting', () => {
      const data = [
        createTestData('1', 'apple', 5, new Date('2023-01-01')),
        createTestData('2', 'apple', NaN, new Date('2023-01-02')),
        createTestData('3', 'banana', 3, new Date('2023-01-03')),
        createTestData('4', 'banana', 3, INVALID_DATE)
      ];

      const { result } = renderHook(() => useTableSorting(data, mockColumns));

      // Sort by text first
      act(() => {
        result.current.handleChangeSortState('text');
      });

      // Sort by number second
      act(() => {
        result.current.handleChangeSortState('number');
      });

      // Sort by date third
      act(() => {
        result.current.handleChangeSortState('date');
      });

      expect(result.current.sortedData).toEqual([
        createTestData('2', 'apple', NaN, new Date('2023-01-02')),
        createTestData('1', 'apple', 5, new Date('2023-01-01')),
        createTestData('4', 'banana', 3, INVALID_DATE),
        createTestData('3', 'banana', 3, new Date('2023-01-03'))
      ]);
    });

    it('should handle invalid values in multi-column sorting (descending)', () => {
      const data = [
        createTestData('1', 'apple', 5, new Date('2023-01-01')),
        createTestData('2', 'apple', NaN, new Date('2023-01-02')),
        createTestData('3', 'banana', 3, new Date('2023-01-03')),
        createTestData('4', 'banana', 3, INVALID_DATE)
      ];

      const { result } = renderHook(() => useTableSorting(data, mockColumns));

      // Sort by text DESC
      act(() => {
        result.current.handleChangeSortState('text');
      });
      act(() => {
        result.current.handleChangeSortState('text');
      });

      // Sort by number DESC
      act(() => {
        result.current.handleChangeSortState('number');
      });
      act(() => {
        result.current.handleChangeSortState('number');
      });

      // Sort by date DESC
      act(() => {
        result.current.handleChangeSortState('date');
      });
      act(() => {
        result.current.handleChangeSortState('date');
      });

      expect(result.current.sortedData).toEqual([
        createTestData('3', 'banana', 3, new Date('2023-01-03')),
        createTestData('4', 'banana', 3, INVALID_DATE),
        createTestData('1', 'apple', 5, new Date('2023-01-01')),
        createTestData('2', 'apple', NaN, new Date('2023-01-02'))
      ]);
    });
  });

  describe('Sort direction cycling', () => {
    it('should cycle through asc -> desc -> none when clicking the same column', () => {
      const data = [
        createTestData('1', 'z', 3, new Date('2023-01-03')),
        createTestData('2', 'a', 1, new Date('2023-01-01')),
        createTestData('3', 'm', 2, new Date('2023-01-02'))
      ];

      const { result } = renderHook(() => useTableSorting(data, mockColumns));

      // First click: ASC
      act(() => {
        result.current.handleChangeSortState('text');
      });
      expect(result.current.getColumnSortDirection('text')).toBe(SortDirection.ASC);
      expect(result.current.sortedData[0].text).toBe('a');

      // Second click: DESC
      act(() => {
        result.current.handleChangeSortState('text');
      });
      expect(result.current.getColumnSortDirection('text')).toBe(SortDirection.DESC);
      expect(result.current.sortedData[0].text).toBe('z');

      // Third click: NONE (removed from sorting)
      act(() => {
        result.current.handleChangeSortState('text');
      });
      expect(result.current.getColumnSortDirection('text')).toBe(SortDirection.NONE);
      expect(result.current.sortedData).toEqual(data); // Original order restored
    });
  });

  describe('Sort order tracking', () => {
    it('should track sort order for multiple columns', () => {
      const data = [
        createTestData('1', 'apple', 5, new Date('2023-01-01')),
        createTestData('2', 'banana', 3, new Date('2023-01-02'))
      ];

      const { result } = renderHook(() => useTableSorting(data, mockColumns));

      // Sort by text first
      act(() => {
        result.current.handleChangeSortState('text');
      });
      expect(result.current.getColumnSortOrder('text')).toBe(1);

      // Sort by number second
      act(() => {
        result.current.handleChangeSortState('number');
      });
      expect(result.current.getColumnSortOrder('text')).toBe(1);
      expect(result.current.getColumnSortOrder('number')).toBe(2);

      // Sort by date third
      act(() => {
        result.current.handleChangeSortState('date');
      });
      expect(result.current.getColumnSortOrder('text')).toBe(1);
      expect(result.current.getColumnSortOrder('number')).toBe(2);
      expect(result.current.getColumnSortOrder('date')).toBe(3);
    });

    it('should update sort order when columns are removed', () => {
      const data = [
        createTestData('1', 'apple', 5, new Date('2023-01-01')),
        createTestData('2', 'banana', 3, new Date('2023-01-02'))
      ];

      const { result } = renderHook(() => useTableSorting(data, mockColumns));

      // Sort by text, number, date
      act(() => {
        result.current.handleChangeSortState('text');
      });
      act(() => {
        result.current.handleChangeSortState('number');
      });
      act(() => {
        result.current.handleChangeSortState('date');
      });

      expect(result.current.getColumnSortOrder('text')).toBe(1);
      expect(result.current.getColumnSortOrder('number')).toBe(2);
      expect(result.current.getColumnSortOrder('date')).toBe(3);

      // Remove number column (cycle to none)
      act(() => {
        result.current.handleChangeSortState('number');
      });
      act(() => {
        result.current.handleChangeSortState('number');
      });

      expect(result.current.getColumnSortOrder('text')).toBe(1);
      expect(result.current.getColumnSortOrder('number')).toBe(0);
      expect(result.current.getColumnSortOrder('date')).toBe(2);
    });
  });

  describe('Edge cases', () => {
    it('should return original data when no sorting criteria provided', () => {
      const data = [
        createTestData('1', 'z', 3, new Date('2023-01-03')),
        createTestData('2', 'a', 1, new Date('2023-01-01')),
        createTestData('3', 'm', 2, new Date('2023-01-02'))
      ];

      const { result } = renderHook(() => useTableSorting(data, mockColumns));

      expect(result.current.sortedData).toEqual(data);
      expect(result.current.sortingState).toEqual([]);
    });

    it('should handle missing columns gracefully', () => {
      const data = [
        createTestData('1', 'apple', 5, new Date('2023-01-01')),
        createTestData('2', 'banana', 3, new Date('2023-01-02'))
      ];

      const { result } = renderHook(() => useTableSorting(data, mockColumns));

      act(() => {
        result.current.handleChangeSortState('nonexistent');
      });

      expect(result.current.sortedData).toEqual(data);
      expect(result.current.getColumnSortDirection('nonexistent')).toBe(SortDirection.NONE);
    });

    it('should handle non-sortable columns', () => {
      const columnsWithNonSortable: TableColumn[] = [
        { columnId: 'text', field: 'text', type: 'text' },
        { columnId: 'number', field: 'number', type: 'number', nonSortable: true },
        { columnId: 'date', field: 'date', type: 'date' }
      ];

      const data = [
        createTestData('1', 'apple', 5, new Date('2023-01-01')),
        createTestData('2', 'banana', 3, new Date('2023-01-02'))
      ];

      const { result } = renderHook(() => useTableSorting(data, columnsWithNonSortable));

      act(() => {
        result.current.handleChangeSortState('number');
      });

      // Should not sort by number column since it's non-sortable
      expect(result.current.sortedData).toEqual(data);
      expect(result.current.getColumnSortDirection('number')).toBe(SortDirection.NONE);
    });

    it('should handle empty data array', () => {
      const data: TestData[] = [];
      const { result } = renderHook(() => useTableSorting(data, mockColumns));

      act(() => {
        result.current.handleChangeSortState('text');
      });

      expect(result.current.sortedData).toEqual([]);
    });

    it('should handle empty columns array', () => {
      const data = [
        createTestData('1', 'apple', 5, new Date('2023-01-01')),
        createTestData('2', 'banana', 3, new Date('2023-01-02'))
      ];

      const { result } = renderHook(() => useTableSorting(data, []));

      act(() => {
        result.current.handleChangeSortState('text');
      });

      expect(result.current.sortedData).toEqual(data);
    });
  });

  describe('Clear sorting functionality', () => {
    it('should clear all sorting when clearSorting is called', () => {
      const data = [
        createTestData('1', 'apple', 5, new Date('2023-01-01')),
        createTestData('2', 'banana', 3, new Date('2023-01-02'))
      ];

      const { result } = renderHook(() => useTableSorting(data, mockColumns));

      // Add multiple sorts
      act(() => {
        result.current.handleChangeSortState('text');
      });
      act(() => {
        result.current.handleChangeSortState('number');
      });
      act(() => {
        result.current.handleChangeSortState('date');
      });

      expect(result.current.sortingState).toHaveLength(3);

      // Clear all sorting
      act(() => {
        result.current.clearSorting();
      });

      expect(result.current.sortingState).toEqual([]);
      expect(result.current.sortedData).toEqual(data);
      expect(result.current.getColumnSortDirection('text')).toBe(SortDirection.NONE);
      expect(result.current.getColumnSortDirection('number')).toBe(SortDirection.NONE);
      expect(result.current.getColumnSortDirection('date')).toBe(SortDirection.NONE);
    });
  });

  describe('Data updates', () => {
    it('should re-sort when data changes', () => {
      const initialData = [
        createTestData('1', 'apple', 5, new Date('2023-01-01')),
        createTestData('2', 'banana', 3, new Date('2023-01-02'))
      ];

      const { result, rerender } = renderHook(
        ({ data }) => useTableSorting(data, mockColumns),
        { initialProps: { data: initialData } }
      );

      // Sort by text
      act(() => {
        result.current.handleChangeSortState('text');
      });

      expect(result.current.sortedData[0].text).toBe('apple');

      // Update data with new items
      const newData = [
        createTestData('1', 'zebra', 5, new Date('2023-01-01')),
        createTestData('2', 'banana', 3, new Date('2023-01-02')),
        createTestData('3', 'apple', 1, new Date('2023-01-03'))
      ];

      rerender({ data: newData });

      // Should maintain sort order with new data
      expect(result.current.sortedData[0].text).toBe('apple');
      expect(result.current.sortedData[1].text).toBe('banana');
      expect(result.current.sortedData[2].text).toBe('zebra');
    });

    it('should re-sort when columns change', () => {
      const data = [
        createTestData('1', 'apple', 5, new Date('2023-01-01')),
        createTestData('2', 'banana', 3, new Date('2023-01-02'))
      ];

      const initialColumns: TableColumn[] = [
        { columnId: 'text', field: 'text', type: 'text' },
        { columnId: 'number', field: 'number', type: 'number' }
      ];

      const { result, rerender } = renderHook(
        ({ columns }) => useTableSorting(data, columns),
        { initialProps: { columns: initialColumns } }
      );

      // Sort by text
      act(() => {
        result.current.handleChangeSortState('text');
      });

      expect(result.current.sortedData[0].text).toBe('apple');

      // Update columns
      const newColumns: TableColumn[] = [
        { columnId: 'text', field: 'text', type: 'text' },
        { columnId: 'number', field: 'number', type: 'number' },
        { columnId: 'date', field: 'date', type: 'date' }
      ];

      rerender({ columns: newColumns });

      // Should maintain existing sort
      expect(result.current.sortedData[0].text).toBe('apple');
      expect(result.current.getColumnSortDirection('text')).toBe(SortDirection.ASC);
    });
  });

  describe('Custom column types', () => {
    it('should handle custom column types with default text sorting', () => {
      const customColumns: TableColumn[] = [
        { columnId: 'text', field: 'text', type: 'text' },
        { columnId: 'custom', field: 'customField', type: 'custom' },
        { columnId: 'dropdown', field: 'dropdownField', type: 'dropdown' }
      ];

      const data = [
        { id: '1', text: 'apple', customField: 'zebra', dropdownField: 'option1' },
        { id: '2', text: 'banana', customField: 'apple', dropdownField: 'option2' }
      ];

      const { result } = renderHook(() => useTableSorting(data, customColumns));

      // Sort by custom column
      act(() => {
        result.current.handleChangeSortState('custom');
      });

      expect(result.current.sortedData[0].customField).toBe('apple');
      expect(result.current.sortedData[1].customField).toBe('zebra');
    });
  });
});
