/**
 * GenericFilter component for filtering any ReactGrid table data.
 * 
 * This component provides filtering controls for any ReactGrid table:
 * - Text search input with real-time filtering
 * - Quick filter buttons (configurable)
 * - Filter badge showing active filter count with popover for details
 * - Clear all filters functionality
 * 
 * Used by any ReactGrid component to provide filtering capabilities.
 * 
 * Dependencies:
 * - @mui/material for UI components
 * - @mui/icons-material for icons
 * - GenericFilterUtils for filter logic
 */

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Chip,
  Typography,
  InputAdornment,
  Tooltip,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider
} from '@mui/material';
import {
  Search,
  Clear,
  FilterList,
  Close
} from '@mui/icons-material';
import { COLORS } from '../../../styles/constants';
import styles from '../../../styles/components/FilterDisplay.module.css';

import { getComparisonDisplayText } from './filterOperations';
import { CustomFilterConfig, FilterCriteria } from './FilterTypes';
import { TableColumn, CompatibleData } from '../types';
import { FilterManager } from './filterManager';

interface FilterDisplayProps<T extends CompatibleData> {
  filterManager: FilterManager<T>;
  totalCount: number;
  filteredCount: number;
  columns: TableColumn<T>[];
  customFilters?: CustomFilterConfig<T>[];
  searchPlaceholder?: string;
  enableSearch?: boolean;
}

const FilterDisplay = <T extends CompatibleData>({
  filterManager,
  totalCount,
  filteredCount,
  columns,
  customFilters = [],
  searchPlaceholder = "Search... (space-separated terms for AND logic)",
  enableSearch = true
}: FilterDisplayProps<T>): React.ReactElement => {
  // Get current filter state from filter manager
  const filters = filterManager.getState();
  // Popover state
  const [filterPopoverAnchor, setFilterPopoverAnchor] = useState<HTMLElement | null>(null);

  const getFilterDisplayName = (filter: FilterCriteria): string => {
    const column = columns.find(col => col.columnId === filter.columnId);
    const columnName = column?.label || filter.columnId;
    const comparisonText = getComparisonDisplayText(filter.comparison);
    
    if (filter.comparison === 'null') {
      return `${columnName} ${comparisonText}`;
    }
    
    return `${columnName} ${comparisonText} ${filter.value}`;
  };

  const activeFilterCount = filterManager.getActiveFilterCount();
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <Box className={styles.filterContainer}>
      <Box className={styles.controlsRow}>
        {/* Search Input - Compact */}
        {enableSearch && (
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={filters.searchText}
            onChange={(e) => filterManager.setSearchText(e.target.value)}
            className={styles.searchField}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search className={styles.searchIcon} />
                </InputAdornment>
              ),
              endAdornment: hasActiveFilters ? (
                <InputAdornment position="end">
                  <Tooltip title="Clear all filters">
                    <Button
                      size="small"
                      onClick={filterManager.clearAllFilters}
                      className={styles.clearButton}
                    >
                      <Clear fontSize="small" />
                    </Button>
                  </Tooltip>
                </InputAdornment>
              ) : null
            }}
          />
        )}

        {/* Custom Filter Buttons - Compact */}
        {customFilters.length > 0 && (
          <Box className={styles.customFiltersContainer}>
            {customFilters.map((customFilter) => {
              const label = customFilter.label || customFilter.key.charAt(0).toUpperCase() + customFilter.key.slice(1);
              const isActive = filters.customFilters[customFilter.key];
              const colorClass = customFilter.color || 'primary';
              return (
                <Tooltip key={customFilter.key} title={customFilter.tooltip || `Show ${label.toLowerCase()}`}>
                  <Button
                    onClick={() => filterManager.toggleCustomFilter(customFilter.key)}
                    variant={isActive ? 'contained' : 'outlined'}
                    startIcon={customFilter.icon}
                    size="small"
                    color={customFilter.color || 'primary'}
                    className={`${styles.customFilterButton} ${isActive ? styles[`customFilterButton${colorClass.charAt(0).toUpperCase() + colorClass.slice(1)}`] : styles.customFilterButtonOutlined}`}
                  >
                    {label}
                  </Button>
                </Tooltip>
              );
            })}
          </Box>
        )}

        {/* Filter Badge and Count - Integrated */}
        {hasActiveFilters && (
          <Chip
            icon={<FilterList />}
            label={`${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''}`}
            size="small"
            color="primary"
            variant="outlined"
            onClick={(e) => setFilterPopoverAnchor(e.currentTarget)}
            className={styles.filterChip}
          />
        )}
      </Box>

      {/* Filter Details Popover */}
      <Popover
        open={Boolean(filterPopoverAnchor)}
        anchorEl={filterPopoverAnchor}
        onClose={() => setFilterPopoverAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          className: styles.popover
        }}
      >
        <Box className={styles.popoverContent}>
          <Typography variant="h6" className={styles.popoverTitle}>
            Active Filters
          </Typography>
          
          <List dense className={styles.filterList}>
            {/* Search Text Filter */}
            {filters.searchText && (
              <ListItem className={styles.filterListItem}>
                <ListItemText 
                  primary="Search text" 
                  secondary={`"${filters.searchText}"`}
                  primaryTypographyProps={{ className: styles.filterListItemPrimary }}
                  secondaryTypographyProps={{ className: styles.filterListItemSecondary }}
                />
                <ListItemSecondaryAction className={styles.filterListItemAction}>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={filterManager.clearSearch}
                    className={styles.filterCloseButton}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            )}

            {/* Custom Filters */}
            {customFilters.map((customFilter) => {
              const label = customFilter.label || customFilter.key.charAt(0).toUpperCase() + customFilter.key.slice(1);
              return (
                filters.customFilters[customFilter.key] && (
                  <ListItem key={customFilter.key} className={styles.filterListItem}>
                    <ListItemText 
                      primary={label}
                      primaryTypographyProps={{ className: styles.filterListItemPrimary }}
                    />
                    <ListItemSecondaryAction className={styles.filterListItemAction}>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => filterManager.removeCustomFilter(customFilter.key)}
                        className={styles.filterCloseButton}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                )
              );
            })}

            {/* Advanced Filters */}
            {filters.columnFilters.length > 0 && (
              <>
                {(filters.searchText || Object.values(filters.customFilters).some(Boolean)) && (
                  <Divider className={styles.filterDivider} />
                )}
                {filters.columnFilters.map((filter, index) => (
                  <ListItem key={`${filter.columnId}-${filter.comparison}-${filter.value}-${index}`} className={styles.filterListItem}>
                    <ListItemText 
                      primary={getFilterDisplayName(filter)}
                      primaryTypographyProps={{ className: styles.filterListItemPrimary }}
                    />
                    <ListItemSecondaryAction className={styles.filterListItemAction}>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => filterManager.removeColumnFilter(filter)}
                        className={styles.filterCloseButton}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </>
            )}
          </List>

          {hasActiveFilters && (
            <Box className={styles.filterActions}>
              <Button
                size="small"
                onClick={filterManager.clearAllFilters}
                startIcon={<Clear />}
                fullWidth
                className={styles.clearAllFiltersButton}
                variant="outlined"
              >
                Clear All Filters
              </Button>
            </Box>
          )}
        </Box>
      </Popover>
    </Box>
  );
};

export default FilterDisplay;
