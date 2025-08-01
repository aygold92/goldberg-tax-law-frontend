/**
 * ReactGrid custom cell types index.
 * 
 * This file exports all custom cell types and templates for ReactGrid:
 * - SortableHeaderCell: Sortable header cells with icons
 * 
 * Usage:
 * ```tsx
 * import { 
 *   SortableHeaderCell, 
 *   sortableHeaderTemplate,
 * } from './reactgrid';
 * ```
 */

// Export SortableHeaderCell
export {
  SortableHeaderTemplate,
  sortableHeaderTemplate,
  SortDirection,
  handleSort,
  sortRows,
  getSortDirectionForColumn,
  getSortOrderForColumn,
} from './SortableHeaderCell';

export type {
  SortableHeaderCell,
  SortCriteria,
  SortCriterion,
} from './SortableHeaderCell';