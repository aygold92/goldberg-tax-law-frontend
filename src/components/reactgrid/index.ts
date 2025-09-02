/**
 * ReactGrid custom cell types index.
 * 
 * This file exports all custom cell types and templates for ReactGrid:
 * - SortableHeaderCell: Sortable header cells with icons
 * - GenericFilter: Generic filtering components
 * - FilterableColumn: Extended column interface with filtering
 * 
 * Usage:
 * ```tsx
 * import { 
 *   SortableHeaderCell, 
 *   sortableHeaderTemplate,
 *   GenericFilter,
 *   FilterableColumn
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

// Export Generic Filter components
export { default as GenericFilter } from './GenericFilter';
export { default as GenericFilterPopover } from './GenericFilterPopover';
export {
  applyGenericFilters,
  getComparisonOperators,
  getInputType,
  getComparisonDisplayText,
  convertFilterValue,
} from './GenericFilterUtils';

export type {
  FilterableColumn,
  GenericFilterCriteria,
  GenericFilterState,
  QuickFilterFunction,
  QuickFilterConfig,
} from './FilterableColumn';