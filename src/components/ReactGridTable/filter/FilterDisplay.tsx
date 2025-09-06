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
    <Box sx={{ 
      backgroundColor: '#ffffff',
      borderRadius: 2,
      p: 1.5,
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        {/* Search Input - Compact */}
        {enableSearch && (
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={filters.searchText}
            onChange={(e) => filterManager.setSearchText(e.target.value)}
            sx={{
              minWidth: 200,
              maxWidth: 300,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#f8fafc',
                '&:hover': {
                  backgroundColor: '#f1f5f9',
                },
                '&.Mui-focused': {
                  backgroundColor: '#ffffff',
                  boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.2)',
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#64748b' }} />
                </InputAdornment>
              ),
              endAdornment: hasActiveFilters ? (
                <InputAdornment position="end">
                  <Tooltip title="Clear all filters">
                    <Button
                      size="small"
                      onClick={filterManager.clearAllFilters}
                      sx={{ 
                        minWidth: 'auto', 
                        p: 0.5,
                        color: '#64748b',
                        '&:hover': {
                          backgroundColor: '#f1f5f9',
                          color: '#374151'
                        }
                      }}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {customFilters.map((customFilter) => {
              const label = customFilter.label || customFilter.key.charAt(0).toUpperCase() + customFilter.key.slice(1);
              return (
                <Tooltip key={customFilter.key} title={customFilter.tooltip || `Show ${label.toLowerCase()}`}>
                  <Button
                    onClick={() => filterManager.toggleCustomFilter(customFilter.key)}
                    variant={filters.customFilters[customFilter.key] ? 'contained' : 'outlined'}
                    startIcon={customFilter.icon}
                    size="small"
                    color={customFilter.color || 'primary'}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      minWidth: 'auto',
                      px: 1.5,
                      // Custom styling for specific colors (matching current TransactionFilter)
                      '&.MuiButton-contained.MuiButton-colorWarning': {
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        borderColor: '#f59e0b',
                        '&:hover': {
                          backgroundColor: '#fde68a',
                        }
                      },
                      '&.MuiButton-contained.MuiButton-colorSuccess': {
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        borderColor: '#22c55e',
                        '&:hover': {
                          backgroundColor: '#bbf7d0',
                        }
                      },
                      '&.MuiButton-contained.MuiButton-colorError': {
                        backgroundColor: '#fef2f2',
                        color: '#991b1b',
                        borderColor: '#ef4444',
                        '&:hover': {
                          backgroundColor: '#fecaca',
                        }
                      },
                      '&.MuiButton-outlined': {
                        borderColor: '#d1d5db',
                        color: '#64748b',
                        '&:hover': {
                          backgroundColor: '#f8fafc',
                          borderColor: '#9ca3af',
                        }
                      }
                    }}
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
            sx={{ 
              cursor: 'pointer',
              borderColor: '#3b82f6',
              color: '#1e40af',
              backgroundColor: '#eff6ff',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: '#dbeafe',
              }
            }}
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
          sx: { 
            minWidth: 300, 
            maxWidth: 400, 
            maxHeight: 400,
            borderRadius: 2,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#1e293b', fontWeight: 600 }}>
            Active Filters
          </Typography>
          
          <List dense>
            {/* Search Text Filter */}
            {filters.searchText && (
              <ListItem sx={{ borderRadius: 1, mb: 0.5 }}>
                <ListItemText 
                  primary="Search text" 
                  secondary={`"${filters.searchText}"`}
                  primaryTypographyProps={{ fontWeight: 500 }}
                  secondaryTypographyProps={{ color: '#64748b' }}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={filterManager.clearSearch}
                    sx={{ color: '#64748b' }}
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
                  <ListItem key={customFilter.key} sx={{ borderRadius: 1, mb: 0.5 }}>
                    <ListItemText 
                      primary={label}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => filterManager.removeCustomFilter(customFilter.key)}
                        sx={{ color: '#64748b' }}
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
                  <Divider sx={{ my: 1 }} />
                )}
                {filters.columnFilters.map((filter, index) => (
                  <ListItem key={`${filter.columnId}-${filter.comparison}-${filter.value}-${index}`} sx={{ borderRadius: 1, mb: 0.5 }}>
                    <ListItemText 
                      primary={getFilterDisplayName(filter)}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => filterManager.removeColumnFilter(filter)}
                        sx={{ color: '#64748b' }}
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
            <Box sx={{ mt: 2, pt: 1, borderTop: 1, borderColor: '#e2e8f0' }}>
              <Button
                size="small"
                onClick={filterManager.clearAllFilters}
                startIcon={<Clear />}
                fullWidth
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  color: '#64748b',
                  borderColor: '#d1d5db',
                  '&:hover': {
                    backgroundColor: '#f8fafc',
                    borderColor: '#9ca3af',
                  }
                }}
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
