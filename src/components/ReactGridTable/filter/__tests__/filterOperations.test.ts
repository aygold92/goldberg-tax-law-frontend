/**
 * Unit tests for filter operations.
 * 
 * Tests all the pure filtering functions in filterOperations.ts to ensure
 * they work correctly with various data types and filter configurations.
 */

import {
  applyFilters,
  applySearchFilter,
  applyColumnFilters,
  applyCustomFilters,
  compareValues,
  convertFilterValue,
  getComparisonDisplayText,
  getFilterableColumns,
  getColumnFilterOptions,
  isValidFilterValue,
  getFilterValueType,
  getActiveFilterCount
} from '../filterOperations';
import { FilterState, FilterCriteria, CustomFilterConfig } from '../FilterTypes';
import { TableColumn, CompatibleData } from '../../types';

// Test data types
interface TestData extends CompatibleData {
  id: string;
  name: string;
  age: number;
  email: string;
  date: string;
  status: string;
}

const testData: TestData[] = [
  {
    id: '1',
    name: 'John Doe',
    age: 25,
    email: 'john@example.com',
    date: '2023-01-15',
    status: 'active'
  },
  {
    id: '2',
    name: 'Jane Smith',
    age: 25,
    email: 'jane@test.com',
    date: '2023-02-20',
    status: 'inactive'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    age: 35,
    email: 'bob@example.org',
    date: '2023-03-10',
    status: 'active'
  },
  {
    id: '4',
    name: 'Alice Brown',
    age: 28,
    email: 'alice@demo.com',
    date: '2023-04-05',
    status: 'pending'
  }
];

const testColumns: TableColumn<TestData>[] = [
  { columnId: 'name', field: 'name', type: 'text', label: 'Name' },
  { columnId: 'age', field: 'age', type: 'number', label: 'Age' },
  { columnId: 'email', field: 'email', type: 'text', label: 'Email' },
  { columnId: 'date', field: 'date', type: 'date', label: 'Date' },
  { columnId: 'status', field: 'status', type: 'text', label: 'Status' }
];

describe('filterOperations', () => {
  describe('applySearchFilter', () => {
    it('should filter by single search term', () => {
      const result = applySearchFilter(testData, 'john', testColumns);
      expect(result).toHaveLength(2);
      expect(result.map(r => r.name)).toEqual(['John Doe', 'Bob Johnson']);
    });

    it('should filter by multiple search terms (AND logic)', () => {
      const result = applySearchFilter(testData, 'john doe', testColumns);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
    });

    it('should be case insensitive', () => {
      const result = applySearchFilter(testData, 'JANE', testColumns);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Jane Smith');
    });

    it('should return all data for empty search', () => {
      const result = applySearchFilter(testData, '', testColumns);
      expect(result).toHaveLength(4);
    });

    it('should return all data for whitespace-only search', () => {
      const result = applySearchFilter(testData, '   ', testColumns);
      expect(result).toHaveLength(4);
    });

    it('should respect nonSearchable columns', () => {
      const columnsWithNonSearchable = [
        ...testColumns,
        { columnId: 'id', field: 'id', type: 'text' as const, label: 'ID', nonSearchable: true }
      ];
      const result = applySearchFilter(testData, 'uniqueid', columnsWithNonSearchable);
      expect(result).toHaveLength(0); // Should not find by ID since it's non-searchable
    });
  });

  describe('applyColumnFilters', () => {
    it('should filter by text equals', () => {
      const filters: FilterCriteria[] = [
        { columnId: 'status', comparison: 'equals', value: 'active' }
      ];
      const result = applyColumnFilters(testData, filters, testColumns);
      expect(result).toHaveLength(2);
      expect(result.map(r => r.name)).toEqual(['John Doe', 'Bob Johnson']);
    });

    it('should filter by number greater than', () => {
      const filters: FilterCriteria[] = [
        { columnId: 'age', comparison: 'greater_than', value: 30 }
      ];
      const result = applyColumnFilters(testData, filters, testColumns);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bob Johnson');
    });

    it('should filter by text contains', () => {
      const filters: FilterCriteria[] = [
        { columnId: 'email', comparison: 'contains', value: 'example' }
      ];
      const result = applyColumnFilters(testData, filters, testColumns);
      expect(result).toHaveLength(2);
      expect(result.map(r => r.name)).toEqual(['John Doe', 'Bob Johnson']);
    });

    it('should handle multiple column filters (AND logic)', () => {
      const filters: FilterCriteria[] = [
        { columnId: 'status', comparison: 'equals', value: 'active' },
        { columnId: 'age', comparison: 'greater_than', value: 24 }
      ];
      const result = applyColumnFilters(testData, filters, testColumns);
      expect(result).toHaveLength(2);
      expect(result.map(r => r.name)).toEqual(['John Doe', 'Bob Johnson']);
    });

    it('should return all data for empty filters', () => {
      const result = applyColumnFilters(testData, [], testColumns);
      expect(result).toHaveLength(4);
    });

    it('should handle non-existent column gracefully', () => {
      const filters: FilterCriteria[] = [
        { columnId: 'nonexistent', comparison: 'equals', value: 'test' }
      ];
      const result = applyColumnFilters(testData, filters, testColumns);
      expect(result).toHaveLength(4); // Should return all data
    });
  });

  describe('applyCustomFilters', () => {
    const customFilters: CustomFilterConfig<TestData>[] = [
      {
        key: 'active',
        label: 'Active',
        filterFunction: (item) => item.status === 'active'
      },
      {
        key: 'young',
        label: 'Young',
        filterFunction: (item) => item.age < 30
      }
    ];

    it('should apply single custom filter', () => {
      const customFilterState = { active: true };
      const result = applyCustomFilters(testData, customFilterState, customFilters);
      expect(result).toHaveLength(2);
      expect(result.map(r => r.name)).toEqual(['John Doe', 'Bob Johnson']);
    });

    it('should apply multiple custom filters (AND logic)', () => {
      const customFilterState = { active: true, young: true };
      const result = applyCustomFilters(testData, customFilterState, customFilters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
    });

    it('should return all data when no custom filters are active', () => {
      const customFilterState = {};
      const result = applyCustomFilters(testData, customFilterState, customFilters);
      expect(result).toHaveLength(4);
    });

    it('should return all data when custom filters are false', () => {
      const customFilterState = { active: false, young: false };
      const result = applyCustomFilters(testData, customFilterState, customFilters);
      expect(result).toHaveLength(4);
    });
  });

  describe('applyFilters (integration)', () => {
    const customFilters: CustomFilterConfig<TestData>[] = [
      {
        key: 'active',
        label: 'Active',
        filterFunction: (item) => item.status === 'active'
      }
    ];

    it('should apply search, column, and custom filters together', () => {
      const filterState: FilterState = {
        searchText: 'john doe',
        columnFilters: [
          { columnId: 'age', comparison: 'greater_than', value: 24 }
        ],
        customFilters: { active: true }
      };
      const result = applyFilters(testData, filterState, testColumns, customFilters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
    });

    it('should return empty array when filters are too restrictive', () => {
      const filterState: FilterState = {
        searchText: 'nonexistent',
        columnFilters: [],
        customFilters: {}
      };
      const result = applyFilters(testData, filterState, testColumns, customFilters);
      expect(result).toHaveLength(0);
    });
  });

  describe('compareValues', () => {
    it('should compare text values correctly', () => {
      expect(compareValues('hello', 'hello', 'equals', 'text')).toBe(true);
      expect(compareValues('hello', 'world', 'equals', 'text')).toBe(false);
      expect(compareValues('hello world', 'hello', 'contains', 'text')).toBe(true);
      expect(compareValues('hello', 'world', 'contains', 'text')).toBe(false);
    });

    it('should compare number values correctly', () => {
      expect(compareValues(10, 10, 'equals', 'number')).toBe(true);
      expect(compareValues(10, 5, 'greater_than', 'number')).toBe(true);
      expect(compareValues(10, 15, 'greater_than', 'number')).toBe(false);
      expect(compareValues(10, 5, 'less_than', 'number')).toBe(false);
    });

    it('should compare date values correctly', () => {
      const date1 = new Date('2023-01-01');
      const date2 = new Date('2023-01-02');
      expect(compareValues(date1, date1, 'equals', 'date')).toBe(true);
      expect(compareValues(date2, date1, 'greater_than', 'date')).toBe(true);
      expect(compareValues(date1, date2, 'less_than', 'date')).toBe(true);
    });

    it('should handle undefined values', () => {
      expect(compareValues(undefined, 'test', 'equals', 'text')).toBe(false);
      expect(compareValues('test', undefined, 'equals', 'text')).toBe(false);
    });

    it('should handle case insensitive string comparisons', () => {
      expect(compareValues('Hello', 'hello', 'contains', 'text')).toBe(true);
      expect(compareValues('HELLO', 'hello', 'starts_with', 'text')).toBe(true);
      expect(compareValues('WORLD', 'world', 'ends_with', 'text')).toBe(true);
    });
  });

  describe('convertFilterValue', () => {
    it('should convert to number', () => {
      expect(convertFilterValue('123', 'number')).toBe(123);
      expect(convertFilterValue('123.45', 'number')).toBe(123.45);
      expect(convertFilterValue('invalid', 'number')).toBe(NaN);
    });

    it('should convert to date', () => {
      const date = convertFilterValue('2023-01-01', 'date');
      expect(date).toBeInstanceOf(Date);
      // Check that it's a valid date and the year is correct (accounting for timezone)
      expect(date.getTime()).not.toBeNaN();
      expect(date.getFullYear()).toBeGreaterThanOrEqual(2022);
      expect(date.getFullYear()).toBeLessThanOrEqual(2023);
    });

    it('should convert to string', () => {
      expect(convertFilterValue(123, 'text')).toBe('123');
      expect(convertFilterValue(true, 'text')).toBe('true');
    });

    it('should handle null and undefined', () => {
      expect(convertFilterValue(null, 'text')).toBe(null);
      expect(convertFilterValue(undefined, 'text')).toBe(null);
    });
  });

  describe('getComparisonDisplayText', () => {
    it('should return correct display text for all operators', () => {
      expect(getComparisonDisplayText('equals')).toBe('equals');
      expect(getComparisonDisplayText('not_equals')).toBe('not equals');
      expect(getComparisonDisplayText('greater_than')).toBe('greater than');
      expect(getComparisonDisplayText('less_than')).toBe('less than');
      expect(getComparisonDisplayText('contains')).toBe('contains');
      expect(getComparisonDisplayText('starts_with')).toBe('starts with');
      expect(getComparisonDisplayText('ends_with')).toBe('ends with');
    });

    it('should return the operator name for unknown operators', () => {
      expect(getComparisonDisplayText('unknown_operator')).toBe('unknown_operator');
    });
  });

  describe('getFilterableColumns', () => {
    it('should return all columns by default', () => {
      const result = getFilterableColumns(testColumns);
      expect(result).toHaveLength(5);
    });

    it('should exclude non-filterable columns', () => {
      const columnsWithNonFilterable = [
        ...testColumns,
        { columnId: 'id', field: 'id', type: 'text' as const, label: 'ID', nonFilterable: true }
      ];
      const result = getFilterableColumns(columnsWithNonFilterable);
      expect(result).toHaveLength(5);
      expect(result.find(col => col.columnId === 'id')).toBeUndefined();
    });
  });

  describe('getColumnFilterOptions', () => {
    it('should return correct options for text columns', () => {
      const options = getColumnFilterOptions('text');
      expect(options).toContain('equals');
      expect(options).toContain('contains');
      expect(options).toContain('starts_with');
      expect(options).toContain('ends_with');
    });

    it('should return correct options for number columns', () => {
      const options = getColumnFilterOptions('number');
      expect(options).toContain('equals');
      expect(options).toContain('greater_than');
      expect(options).toContain('less_than');
      expect(options).toContain('contains');
    });

    it('should return correct options for date columns', () => {
      const options = getColumnFilterOptions('date');
      expect(options).toContain('equals');
      expect(options).toContain('greater_than');
      expect(options).toContain('less_than');
      expect(options).not.toContain('contains');
    });

    it('should return basic options for unknown column types', () => {
      const options = getColumnFilterOptions('unknown');
      expect(options).toEqual(['equals', 'not_equals']);
    });
  });

  describe('isValidFilterValue', () => {
    it('should validate text values', () => {
      expect(isValidFilterValue('hello', 'text')).toBe(true);
      expect(isValidFilterValue('', 'text')).toBe(false);
      expect(isValidFilterValue('   ', 'text')).toBe(false);
    });

    it('should validate number values', () => {
      expect(isValidFilterValue('123', 'number')).toBe(true);
      expect(isValidFilterValue('123.45', 'number')).toBe(true);
      expect(isValidFilterValue('invalid', 'number')).toBe(false);
      expect(isValidFilterValue('', 'number')).toBe(false);
    });

    it('should validate date values', () => {
      expect(isValidFilterValue('2023-01-01', 'date')).toBe(true);
      expect(isValidFilterValue('invalid-date', 'date')).toBe(false);
      expect(isValidFilterValue('', 'date')).toBe(false);
    });
  });

  describe('getFilterValueType', () => {
    it('should detect number type', () => {
      expect(getFilterValueType(123)).toBe('number');
      expect(getFilterValueType(123.45)).toBe('number');
    });

    it('should detect date type', () => {
      expect(getFilterValueType(new Date())).toBe('date');
    });

    it('should detect text type', () => {
      expect(getFilterValueType('hello')).toBe('text');
      expect(getFilterValueType(true)).toBe('text');
      expect(getFilterValueType(null)).toBe('text');
    });
  });

  describe('getActiveFilterCount', () => {
    it('should count search text', () => {
      const filterState: FilterState = {
        searchText: 'test',
        columnFilters: [],
        customFilters: {}
      };
      expect(getActiveFilterCount(filterState)).toBe(1);
    });

    it('should count column filters', () => {
      const filterState: FilterState = {
        searchText: '',
        columnFilters: [
          { columnId: 'name', comparison: 'equals', value: 'test' },
          { columnId: 'age', comparison: 'greater_than', value: 25 }
        ],
        customFilters: {}
      };
      expect(getActiveFilterCount(filterState)).toBe(2);
    });

    it('should count custom filters', () => {
      const filterState: FilterState = {
        searchText: '',
        columnFilters: [],
        customFilters: { active: true, young: true, pending: false }
      };
      expect(getActiveFilterCount(filterState)).toBe(2);
    });

    it('should count all filter types together', () => {
      const filterState: FilterState = {
        searchText: 'test',
        columnFilters: [
          { columnId: 'name', comparison: 'equals', value: 'test' }
        ],
        customFilters: { active: true }
      };
      expect(getActiveFilterCount(filterState)).toBe(3);
    });

    it('should return 0 for empty filters', () => {
      const filterState: FilterState = {
        searchText: '',
        columnFilters: [],
        customFilters: {}
      };
      expect(getActiveFilterCount(filterState)).toBe(0);
    });
  });
});
