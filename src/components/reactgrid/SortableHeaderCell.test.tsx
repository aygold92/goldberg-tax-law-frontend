import { sortRows, SortDirection, SortCriteria } from './SortableHeaderCell';
import { Row, Column, TextCell, NumberCell, DateCell } from '@silevis/reactgrid';

describe('sortRows', () => {
  const INVALID_DATE = new Date('invalid');

  const mockColumns: Column[] = [
    { columnId: 'text', width: 100 },
    { columnId: 'number', width: 100 },
    { columnId: 'date', width: 100 }
  ];

  const createRow = (rowId: string, text: any, number: any, date: any): Row => ({
    rowId,
    cells: [
      { type: 'text', text: text } as TextCell,
      { type: 'number', value: number } as NumberCell,
      { type: 'date', date: date } as DateCell
    ]
  });

  describe('Text column sorting', () => {
    it('should handle null/undefined text values', () => {
      const rows = [
        createRow('1', 'apple', 1, new Date('2023-01-01')),
        createRow('2', null, 2, new Date('2023-01-02')),
        createRow('3', undefined, 3, new Date('2023-01-03')),
        createRow('4', 'banana', 4, new Date('2023-01-04'))
      ];

      const sorting: SortCriteria = [{ columnId: 'text', direction: SortDirection.ASC }];
      const result = sortRows(rows, sorting, mockColumns);

      expect(result).toEqual([
        createRow('2', null, 2, new Date('2023-01-02')),
        createRow('3', undefined, 3, new Date('2023-01-03')),
        createRow('1', 'apple', 1, new Date('2023-01-01')),
        createRow('4', 'banana', 4, new Date('2023-01-04'))
      ]);
    });

    it('should handle null/undefined text values in descending order', () => {
      const rows = [
        createRow('1', 'apple', 1, new Date('2023-01-01')),
        createRow('2', null, 2, new Date('2023-01-02')),
        createRow('3', undefined, 3, new Date('2023-01-03')),
        createRow('4', 'banana', 4, new Date('2023-01-04'))
      ];

      const sorting: SortCriteria = [{ columnId: 'text', direction: SortDirection.DESC }];
      const result = sortRows(rows, sorting, mockColumns);

      expect(result).toEqual([
        createRow('4', 'banana', 4, new Date('2023-01-04')),
        createRow('1', 'apple', 1, new Date('2023-01-01')),
        createRow('2', null, 2, new Date('2023-01-02')),
        createRow('3', undefined, 3, new Date('2023-01-03'))
      ]);
    });

    it('should handle empty strings in text sorting', () => {
      const rows = [
        createRow('1', '', 1, new Date('2023-01-01')),
        createRow('2', 'zebra', 2, new Date('2023-01-02')),
        createRow('3', 'apple', 3, new Date('2023-01-03'))
      ];

      const sorting: SortCriteria = [{ columnId: 'text', direction: SortDirection.ASC }];
      const result = sortRows(rows, sorting, mockColumns);

      expect(result).toEqual([
        createRow('1', '', 1, new Date('2023-01-01')),
        createRow('3', 'apple', 3, new Date('2023-01-03')),
        createRow('2', 'zebra', 2, new Date('2023-01-02'))
      ]);
    });
  });

  describe('Number column sorting', () => {
    it('should handle NaN values in number sorting', () => {
      const rows = [
        createRow('1', 'a', 5, new Date('2023-01-01')),
        createRow('2', 'b', NaN, new Date('2023-01-02')),
        createRow('3', 'c', 3, new Date('2023-01-03')),
        createRow('4', 'd', undefined, new Date('2023-01-04'))
      ];

      const sorting: SortCriteria = [{ columnId: 'number', direction: SortDirection.ASC }];
      const result = sortRows(rows, sorting, mockColumns);

      expect(result).toEqual([
        createRow('2', 'b', NaN, new Date('2023-01-02')),
        createRow('4', 'd', undefined, new Date('2023-01-04')),
        createRow('3', 'c', 3, new Date('2023-01-03')),
        createRow('1', 'a', 5, new Date('2023-01-01'))
      ]);
    });

    it('should handle null values in number sorting', () => {
      const rows = [
        createRow('1', 'a', null, new Date('2023-01-01')),
        createRow('2', 'b', 10, new Date('2023-01-02')),
        createRow('3', 'c', 5, new Date('2023-01-03'))
      ];

      const sorting: SortCriteria = [{ columnId: 'number', direction: SortDirection.ASC }];
      const result = sortRows(rows, sorting, mockColumns);

      expect(result).toEqual([
        createRow('1', 'a', null, new Date('2023-01-01')),
        createRow('3', 'c', 5, new Date('2023-01-03')),
        createRow('2', 'b', 10, new Date('2023-01-02'))
      ]);
    });

    it('should handle descending number sorting with invalid values', () => {
      const rows = [
        createRow('1', 'a', 15, new Date('2023-01-01')),
        createRow('2', 'b', NaN, new Date('2023-01-02')),
        createRow('3', 'c', 5, new Date('2023-01-03'))
      ];

      const sorting: SortCriteria = [{ columnId: 'number', direction: SortDirection.DESC }];
      const result = sortRows(rows, sorting, mockColumns);

      expect(result).toEqual([
        createRow('1', 'a', 15, new Date('2023-01-01')),
        createRow('3', 'c', 5, new Date('2023-01-03')),
        createRow('2', 'b', NaN, new Date('2023-01-02'))
      ]);
    });
  });

  describe('Date column sorting', () => {
    it('should handle Invalid Date values', () => {
      const rows = [
        createRow('1', 'a', 1, new Date('2023-01-01')),
        createRow('2', 'b', 2, INVALID_DATE),
        createRow('3', 'c', 3, new Date('2023-01-03')),
        createRow('4', 'd', 4, undefined),
        createRow('5', 'e', 5, INVALID_DATE)
      ];

      const sorting: SortCriteria = [{ columnId: 'date', direction: SortDirection.ASC }];
      const result = sortRows(rows, sorting, mockColumns);

      expect(result).toEqual([
        createRow('2', 'b', 2, INVALID_DATE),
        createRow('4', 'd', 4, undefined),
        createRow('5', 'e', 5, INVALID_DATE),
        createRow('1', 'a', 1, new Date('2023-01-01')),
        createRow('3', 'c', 3, new Date('2023-01-03'))
      ]);
    });

    it('should handle null date values', () => {
      const rows = [
        createRow('1', 'a', 1, null),
        createRow('2', 'b', 2, new Date('2023-01-02')),
        createRow('3', 'c', 3, new Date('2023-01-01'))
      ];

      const sorting: SortCriteria = [{ columnId: 'date', direction: SortDirection.ASC }];
      const result = sortRows(rows, sorting, mockColumns);

      expect(result).toEqual([
        createRow('1', 'a', 1, null),
        createRow('3', 'c', 3, new Date('2023-01-01')),
        createRow('2', 'b', 2, new Date('2023-01-02'))
      ]);
    });

    it('should handle descending date sorting with invalid dates', () => {
      const rows = [
        createRow('1', 'a', 1, new Date('2023-01-03')),
        createRow('2', 'b', 2, INVALID_DATE),
        createRow('3', 'c', 3, new Date('2023-01-01'))
      ];

      const sorting: SortCriteria = [{ columnId: 'date', direction: SortDirection.DESC }];
      const result = sortRows(rows, sorting, mockColumns);

      expect(result).toEqual([
        createRow('1', 'a', 1, new Date('2023-01-03')),
        createRow('3', 'c', 3, new Date('2023-01-01')),
        createRow('2', 'b', 2, INVALID_DATE)
      ]);
    });
  });

  describe('Multi-column sorting', () => {
    it('should handle invalid values in multi-column sorting', () => {
      const rows = [
        createRow('1', 'apple', 5, new Date('2023-01-01')),
        createRow('2', 'apple', NaN, new Date('2023-01-02')),
        createRow('3', 'banana', 3, new Date('2023-01-03')),
        createRow('4', 'banana', 3, INVALID_DATE)
      ];

      const sorting: SortCriteria = [
        { columnId: 'text', direction: SortDirection.ASC },
        { columnId: 'number', direction: SortDirection.ASC },
        { columnId: 'date', direction: SortDirection.ASC }
      ];
      const result = sortRows(rows, sorting, mockColumns);

      expect(result).toEqual([
        createRow('2', 'apple', NaN, new Date('2023-01-02')),
        createRow('1', 'apple', 5, new Date('2023-01-01')),
        createRow('4', 'banana', 3, INVALID_DATE),
        createRow('3', 'banana', 3, new Date('2023-01-03'))
      ]);
    });

    it('should handle invalid values in multi-column sorting (descending)', () => {
      const rows = [
        createRow('1', 'apple', 5, new Date('2023-01-01')),
        createRow('2', 'apple', NaN, new Date('2023-01-02')),
        createRow('3', 'banana', 3, new Date('2023-01-03')),
        createRow('4', 'banana', 3, INVALID_DATE)
      ];

      const sorting: SortCriteria = [
        { columnId: 'text', direction: SortDirection.DESC },
        { columnId: 'number', direction: SortDirection.DESC },
        { columnId: 'date', direction: SortDirection.DESC }
      ];
      const result = sortRows(rows, sorting, mockColumns);

      expect(result).toEqual([
        createRow('3', 'banana', 3, new Date('2023-01-03')),
        createRow('4', 'banana', 3, INVALID_DATE),
        createRow('1', 'apple', 5, new Date('2023-01-01')),
        createRow('2', 'apple', NaN, new Date('2023-01-02'))
      ]);
    });
  });

  describe('Edge cases', () => {
    it('should return original rows when no sorting criteria provided', () => {
      const rows = [
        createRow('1', 'z', 3, new Date('2023-01-03')),
        createRow('2', 'a', 1, new Date('2023-01-01')),
        createRow('3', 'm', 2, new Date('2023-01-02'))
      ];

      const result = sortRows(rows, [], mockColumns);
      expect(result).toEqual(rows);
    });

    it('should skip header rows', () => {
      const rows = [
        createRow('header', 'Header', 0, new Date('2023-01-01')),
        createRow('1', 'apple', 5, new Date('2023-01-01')),
        createRow('2', 'banana', 3, new Date('2023-01-02'))
      ];

      const sorting: SortCriteria = [{ columnId: 'text', direction: SortDirection.ASC }];
      const result = sortRows(rows, sorting, mockColumns);

      expect(result).toEqual([
        createRow('header', 'Header', 0, new Date('2023-01-01')),
        createRow('1', 'apple', 5, new Date('2023-01-01')),
        createRow('2', 'banana', 3, new Date('2023-01-02'))
      ]);
    });

    it('should handle missing columns gracefully', () => {
      const rows = [
        createRow('1', 'apple', 5, new Date('2023-01-01')),
        createRow('2', 'banana', 3, new Date('2023-01-02'))
      ];

      const sorting: SortCriteria = [{ columnId: 'nonexistent', direction: SortDirection.ASC }];
      const result = sortRows(rows, sorting, mockColumns);

      expect(result).toEqual(rows);
    });

    it('should handle cells with different types', () => {
      const rows = [
        createRow('1', 'apple', 5, new Date('2023-01-01')),
        {
          rowId: '2',
          cells: [
            { type: 'text', text: 'banana', value: 'banana' },
            { type: 'text', text: '3', value: '3' }, // Different type
            { type: 'date', date: new Date('2023-01-02') }
          ]
        }
      ];

      const sorting: SortCriteria = [{ columnId: 'number', direction: SortDirection.ASC }];
      const result = sortRows(rows, sorting, mockColumns);

      expect(result).toEqual(rows); // Should not change order when types don't match
    });
  });
}); 