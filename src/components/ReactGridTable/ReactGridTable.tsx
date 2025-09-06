/**
 * ReactGridTable component - A reusable table component built on top of ReactGrid.
 * 
 * This component provides common table functionality including:
 * - Automatic header row generation
 * - Automatic add-row generation (when handleRowAdd provided)
 * - Column resizing
 * - Sorting and filtering (integrated with existing components)
 * - Table size controls
 * - Type-safe column definitions
 * 
 * Usage:
 * ```tsx
 * <ReactGridTable
 *   columns={columns}
 *   data={data}
 *   handleRowAdd={handleAddRow}
 *   onCellsChanged={handleCellChanges}
 * />
 * ```
 */

import React, { useMemo, useState, useCallback } from 'react';
import { ReactGrid, Row, Id, DefaultCellTypes, Column, CellChange, DateCell, NumberCell, DropdownCell, TextCell } from '@silevis/reactgrid';
import '@silevis/reactgrid/styles.css';
import { ViewCompact, ViewModule, ViewList, ViewStream, ArrowDropDown } from '@mui/icons-material';
import { Select, MenuItem, FormControl } from '@mui/material';
import { COLORS } from '../../styles/constants';
import styles from '../../styles/components/ReactGridTable.module.css';

// Import our custom types
import { 
  ReactGridTableProps, 
  ReactGridTableState, 
  isDataColumn,
  isCustomColumn,
  CompatibleData
} from './types';

// Import existing components we'll integrate with
import { SortableHeaderCell, sortableHeaderTemplate } from '../reactgrid/SortableHeaderCell';
import FilterDisplay from './filter/FilterDisplay';
import ColumnFilterPopover from './filter/ColumnFilterPopover';
import { useTableSorting } from './hooks/useTableSorting';
import { useFilterManager } from './filter/filterManager';
import { FilterCriteria } from './filter/FilterTypes';

// Extend the default cell types to include our custom type
type CellTypes = DefaultCellTypes | SortableHeaderCell;

/**
 * ReactGridTable component that extends ReactGrid with common table functionality.
 */
function ReactGridTable<T extends CompatibleData>({
  columns,
  data,
  handleRowAdd,
  initialTableSize,
  customFilters = [],
  nonSearchable = false,
  rowStyle,
  ...reactGridProps
}: ReactGridTableProps<T>) {

  // Calculate feature flags based on columns
  const enableAddRow = !!handleRowAdd;
  const enableSorting = columns.some(col => !col.nonSortable);
  const enableFiltering = columns.some(col => !col.nonFilterable);
  const enableSearch = !nonSearchable && columns.some(col => !col.nonSearchable);
  const enableColumnResize = columns.some(col => col.resizable !== false);
  const enableTableSizeControls = !!initialTableSize;
  
  // Default row ID field (use 'id' if it exists, otherwise use index)
  const rowIdField = 'id' as keyof T;
  
  // Use the filter manager hook
  const filterManager = useFilterManager(data, columns, customFilters);
  
  // UI state for column filter popover (moved back from hook)
  const [filterPopoverAnchor, setFilterPopoverAnchor] = useState<HTMLElement | null>(null);
  const [currentFilter, setCurrentFilter] = useState<FilterCriteria | null>(null);
  
  // UI state handlers
  const handleOpenFilterPopover = useCallback((columnId: string, event: React.MouseEvent) => {
    setFilterPopoverAnchor(event.currentTarget as HTMLElement);
    setCurrentFilter({ columnId, comparison: 'equals', value: '' });
  }, []);

  const handleCloseFilterPopover = useCallback(() => {
    setFilterPopoverAnchor(null);
    setCurrentFilter(null);
  }, []);

  const handleApplyColumnFilter = useCallback((filter: FilterCriteria | null) => {
    if (filter) {
      filterManager.addColumnFilter(filter);
    }
    handleCloseFilterPopover();
  }, [filterManager, handleCloseFilterPopover]);
  
  // Get filtered data from filter manager
  const filteredData = filterManager.getFilteredData();
  
  // Use the sorting hook on the filtered data
  const { sortedData, handleChangeSortState, getColumnSortDirection, getColumnSortOrder, sortingState } = useTableSorting(filteredData, columns);
  
  // Internal state management
  const [state, setState] = useState<ReactGridTableState>({
    columnWidths: Object.fromEntries(
        columns.map(col => [col.columnId, col.width || 100])
    ),
    tableSize: initialTableSize || 'medium'
  });


  const filterColumn = columns.find(col => col.columnId === currentFilter?.columnId);


  // Handle column resizing
  const handleColumnResized = useCallback((
    columnId: Id, 
    width: number, 
    selectedColIds: Id[]
  ) => {
    setState(prev => ({
      ...prev,
      columnWidths: {
        ...prev.columnWidths,
        [String(columnId)]: width
      }
    }));
  }, []);



  // Handle cell changes

  const handleCellsChanged = useCallback((changes: CellChange[]) => {
    const nonHeaderChanges = changes.filter(change => {
      const { rowId } = change;
      return rowId !== 'header';
    });
    reactGridProps.onCellsChanged?.(nonHeaderChanges);
  }, []);


  const headerStyle = { 
    fontWeight: 'bold', 
    background: COLORS.background.tertiary, 
    color: COLORS.text.accent 
  }
  // Generate header row
  const headerRow = useMemo((): Row<CellTypes> => {
    const headerCells = columns.map(column => {
      
      if (column.nonSortable) {
        return {
          type: 'header' as const,
          text: column.label,
          nonEditable: true,
          style: headerStyle
        };
      }
      
      const columnId = String(column.columnId);
      
      return {
        type: 'sortableHeader' as const,
        text: column.label,
        nonEditable: true,
        columnId,
        filterable: !column.nonFilterable,
        style: headerStyle,
        onSort: handleChangeSortState,
        onFilter: !column.nonFilterable ? handleOpenFilterPopover : undefined,
        sortDirection: getColumnSortDirection(columnId),
        sortOrder: getColumnSortOrder(columnId)
      };
    });

    return {
      rowId: 'header',
      cells: headerCells
    };
  }, [columns, handleChangeSortState, getColumnSortDirection, getColumnSortOrder, handleOpenFilterPopover]);


  // Generate data rows
  const dataRows = useMemo((): Row<CellTypes>[] => {
    // Use sorted data from the sorting hook (which works on filtered data)
    let rows = sortedData.map((item, index) => {
      const rowId = String(item[rowIdField] || index);
      
      // Get row style if provided
      const currentRowStyle = rowStyle?.[rowId];
      
      const cells = columns.map(column => {
        if (isCustomColumn(column)) {
          // Custom column - render using the render function
          return {
            type: 'text' as const,
            text: rowId,
            renderer: () => column.render(rowId, item, index),
            style: currentRowStyle
          };
        } else if (isDataColumn(column)) {
          // Data column - generate cell based on type
          const value = item[column.field];
          
          let cell: TextCell | NumberCell | DateCell | DropdownCell;
          switch (column.type) {
            case 'text':
              cell = { type: 'text' as const, text: String(value || '') };
              break;
            case 'number':
              cell = { type: 'number' as const, value: Number(value) || NaN };
              break;
            case 'date':
              cell = { type: 'date' as const, date: value ? new Date(value) : undefined };
              break;
            case 'dropdown':
              cell = { type: 'dropdown' as const, values: [], selectedValue: undefined };
              break;
            case 'custom':
            default:
              cell = { type: 'text' as const, text: String(value || '') };
          }
          
          // Apply row style if provided
          if (currentRowStyle) {
            cell.style = currentRowStyle;
          }
          
          return cell;
        } else {
          // Fallback for unknown column types
          return { 
            type: 'text' as const, 
            text: 'Unknown Column Type',
            style: currentRowStyle
          };
        }
      });

      return {
        rowId,
        cells,
        data: item // Store the original data for sorting
      };
    });

    return rows;
  }, [sortedData, columns, rowIdField, rowStyle]);

  // Combine all rows
  const rows = useMemo((): Row<CellTypes>[] => {
    const allRows: Row<CellTypes>[] = [headerRow];
    
    // Add data rows
    allRows.push(...dataRows);
    
    return allRows;
  }, [headerRow, dataRows]);

  // Use default cell templates
  const cellTemplates = useMemo(() => ({
    sortableHeader: sortableHeaderTemplate
  }), []);

  const columnsToRender: Column[] = [
    ...columns.map(col => ({
      columnId: col.columnId,
      width: state.columnWidths[col.columnId] || col.width || 100,
      resizable: col.resizable
    }))
  ];    
  return (
    <div className="react-grid-table">
      {/* Table Controls - Compact Layout */}
      {(enableSorting || enableFiltering || enableTableSizeControls || enableAddRow) && (
        <div className={styles.controlsContainer}>
          <div className={styles.controlsContent}>
            <div className={styles.controlsLeft}>
              {/* Status Info - Compact */}
              <div className={styles.statusInfo}>
                {enableSorting && sortingState.length > 0 && (
                  <span>
                    Sorted by: {sortingState.map((sort, index) => (
                      <span key={sort.columnId}>
                        {index > 0 && ', '}
                        <strong className={styles.sortInfo}>
                          {columns.find(col => String(col.columnId) === sort.columnId)?.label}
                        </strong>
                        {sort.direction === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    ))}
                  </span>
                )}
                
                <span>
                  {dataRows.length} of {data.length} rows
                </span>
              </div>
              
              {/* Filter Controls - Integrated */}
              {enableFiltering && (
                <FilterDisplay
                  filterManager={filterManager}
                  totalCount={data.length}
                  filteredCount={dataRows.length}
                  columns={columns}
                  customFilters={customFilters}
                  searchPlaceholder="Search table..."
                  enableSearch={enableSearch}
                />
              )}
            </div>
            
            <div className={styles.controlsRight}>
              {/* Add Row Button - Compact */}
              {enableAddRow && (
                <button
                  onClick={() => handleRowAdd({})}
                  className={styles.addRowButton}
                  title="Add new row"
                >
                  <span>+</span>
                  Add Row
                </button>
              )}
              
              {/* Table Size Controls - Compact */}
              {enableTableSizeControls && (
                <FormControl size="small" className={styles.tableSizeSelect}>
                  <Select
                    value={state.tableSize}
                    onChange={(e) => setState(prev => ({ ...prev, tableSize: e.target.value as any }))}
                    displayEmpty
                    IconComponent={ArrowDropDown}
                  >
                    <MenuItem value="small">
                      <div className={styles.menuItemContent}>
                        <ViewCompact fontSize="small" />
                        <span>Small</span>
                      </div>
                    </MenuItem>
                    <MenuItem value="medium">
                      <div className={styles.menuItemContent}>
                        <ViewModule fontSize="small" />
                        <span>Medium</span>
                      </div>
                    </MenuItem>
                    <MenuItem value="large">
                      <div className={styles.menuItemContent}>
                        <ViewList fontSize="small" />
                        <span>Large</span>
                      </div>
                    </MenuItem>
                    <MenuItem value="unbounded">
                      <div className={styles.menuItemContent}>
                        <ViewStream fontSize="small" />
                        <span>Unbounded</span>
                      </div>
                    </MenuItem>
                  </Select>
                </FormControl>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Filter Popover */}
      {enableFiltering && currentFilter && filterColumn && (
        <ColumnFilterPopover
          anchorEl={filterPopoverAnchor}
          onClose={handleCloseFilterPopover}
          column={filterColumn}
          currentFilter={currentFilter}
          onApplyFilter={handleApplyColumnFilter}
        />
      )}
      
      {/* Table Container */}
      <div 
        className={styles.tableContainer}
        style={{
          height: state.tableSize === 'unbounded' ? 'auto' : 
                 state.tableSize === 'small' ? '300px' :
                 state.tableSize === 'medium' ? '500px' : '700px',
        }}
      >
        <ReactGrid
          {...reactGridProps}
          rows={rows}
          columns={columnsToRender}
          onColumnResized={enableColumnResize ? handleColumnResized : undefined}
          customCellTemplates={cellTemplates}
          onCellsChanged={handleCellsChanged}
        />
      </div>
    </div>
  );
}

export default ReactGridTable;
