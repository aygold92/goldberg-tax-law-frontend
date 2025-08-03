/**
 * TransactionFilter component for filtering transaction data.
 * 
 * This component provides filtering controls for the TransactionsTable:
 * - Text search input with real-time filtering
 * - Quick filter buttons for suspicious, new, income, and expense transactions
 * - Filter badge showing active filter count with popover for details
 * - Clear all filters functionality
 * 
 * Used by the TransactionsTable component to provide filtering capabilities.
 * 
 * Dependencies:
 * - @mui/material for UI components
 * - @mui/icons-material for icons
 * - filterUtils for filter logic
 */

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Chip,
  Stack,
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
  Warning,
  Add,
  TrendingUp,
  TrendingDown,
  Clear,
  FilterList,
  Close
} from '@mui/icons-material';
import { FilterState, FilterCriteria, getComparisonDisplayText } from '../utils/filterUtils';

interface TransactionFilterProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

const TransactionFilter: React.FC<TransactionFilterProps> = ({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount
}) => {
  // Popover state
  const [filterPopoverAnchor, setFilterPopoverAnchor] = useState<HTMLElement | null>(null);

  const handleSearchChange = (searchText: string) => {
    onFiltersChange({ ...filters, searchText });
  };

  const handleToggleFilter = (filterKey: keyof Pick<FilterState, 'showSuspicious' | 'showNew' | 'showIncome' | 'showExpenses'>) => {
    onFiltersChange({ ...filters, [filterKey]: !filters[filterKey] });
  };

  const handleClearAllFilters = () => {
    onFiltersChange({
      searchText: '',
      advancedFilters: [],
      showSuspicious: false,
      showNew: false,
      showIncome: false,
      showExpenses: false
    });
  };

  const handleRemoveAdvancedFilter = (filterToRemove: FilterCriteria) => {
    const newAdvancedFilters = filters.advancedFilters.filter(
      filter => !(filter.columnId === filterToRemove.columnId && 
                  filter.comparison === filterToRemove.comparison && 
                  filter.value === filterToRemove.value)
    );
    onFiltersChange({ ...filters, advancedFilters: newAdvancedFilters });
  };

  const handleRemoveQuickFilter = (filterKey: keyof Pick<FilterState, 'showSuspicious' | 'showNew' | 'showIncome' | 'showExpenses'>) => {
    onFiltersChange({ ...filters, [filterKey]: false });
  };

  const handleClearSearch = () => {
    onFiltersChange({ ...filters, searchText: '' });
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (filters.searchText) count++;
    if (filters.advancedFilters.length > 0) count += filters.advancedFilters.length;
    if (filters.showSuspicious) count++;
    if (filters.showNew) count++;
    if (filters.showIncome) count++;
    if (filters.showExpenses) count++;
    return count;
  };

  const getFilterDisplayName = (filter: FilterCriteria): string => {
    const columnNames: { [key: string]: string } = {
      'date': 'Date',
      'description': 'Description',
      'amount': 'Amount',
      'filePageNumber': 'Page #',
      'checkNumber': 'Check #',
      'checkFilename': 'Check File',
      'checkFilePage': 'Check Pg'
    };
    
    const columnName = columnNames[filter.columnId] || filter.columnId;
    const comparisonText = getComparisonDisplayText(filter.comparison);
    
    if (filter.comparison === 'null') {
      return `${columnName} ${comparisonText}`;
    }
    
    return `${columnName} ${comparisonText} ${filter.value}`;
  };

  const getQuickFilterDisplayName = (filterKey: keyof Pick<FilterState, 'showSuspicious' | 'showNew' | 'showIncome' | 'showExpenses'>): string => {
    switch (filterKey) {
      case 'showSuspicious': return 'Suspicious transactions';
      case 'showNew': return 'New transactions';
      case 'showIncome': return 'Income transactions';
      case 'showExpenses': return 'Expense transactions';
      default: return filterKey;
    }
  };

  const activeFilterCount = getActiveFilterCount();
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <Box sx={{ 
      backgroundColor: '#ffffff',
      borderRadius: 2,
      p: 2,
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <Stack spacing={2}>
        {/* Search Input */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search transactions... (space-separated terms for AND logic)"
          value={filters.searchText}
          onChange={(e) => handleSearchChange(e.target.value)}
          sx={{
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
                    onClick={handleClearAllFilters}
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

        {/* Quick Filter Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Quick filters:
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Tooltip title="Show suspicious transactions">
              <Button
                onClick={() => handleToggleFilter('showSuspicious')}
                variant={filters.showSuspicious ? 'contained' : 'outlined'}
                startIcon={<Warning />}
                size="small"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  '&.MuiButton-contained': {
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    borderColor: '#f59e0b',
                    '&:hover': {
                      backgroundColor: '#fde68a',
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
                Suspicious
              </Button>
            </Tooltip>
            
            <Tooltip title="Show new transactions">
              <Button
                onClick={() => handleToggleFilter('showNew')}
                variant={filters.showNew ? 'contained' : 'outlined'}
                startIcon={<Add />}
                size="small"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  '&.MuiButton-contained': {
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    borderColor: '#3b82f6',
                    '&:hover': {
                      backgroundColor: '#bfdbfe',
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
                New
              </Button>
            </Tooltip>
            
            <Tooltip title="Show income transactions (amount > 0)">
              <Button
                onClick={() => handleToggleFilter('showIncome')}
                variant={filters.showIncome ? 'contained' : 'outlined'}
                startIcon={<TrendingUp />}
                size="small"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  '&.MuiButton-contained': {
                    backgroundColor: '#dcfce7',
                    color: '#166534',
                    borderColor: '#22c55e',
                    '&:hover': {
                      backgroundColor: '#bbf7d0',
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
                Income
              </Button>
            </Tooltip>
            
            <Tooltip title="Show expense transactions (amount < 0)">
              <Button
                onClick={() => handleToggleFilter('showExpenses')}
                variant={filters.showExpenses ? 'contained' : 'outlined'}
                startIcon={<TrendingDown />}
                size="small"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  '&.MuiButton-contained': {
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
                Expenses
              </Button>
            </Tooltip>
          </Box>
        </Box>

        {/* Filter Badge and Count */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {hasActiveFilters && (
            <Chip
              icon={<FilterList />}
              label={`${activeFilterCount} active filter${activeFilterCount !== 1 ? 's' : ''}`}
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
      </Stack>

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
                    onClick={handleClearSearch}
                    sx={{ color: '#64748b' }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            )}

            {/* Quick Filters */}
            {filters.showSuspicious && (
              <ListItem sx={{ borderRadius: 1, mb: 0.5 }}>
                <ListItemText 
                  primary={getQuickFilterDisplayName('showSuspicious')}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleRemoveQuickFilter('showSuspicious')}
                    sx={{ color: '#64748b' }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            )}

            {filters.showNew && (
              <ListItem sx={{ borderRadius: 1, mb: 0.5 }}>
                <ListItemText 
                  primary={getQuickFilterDisplayName('showNew')}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleRemoveQuickFilter('showNew')}
                    sx={{ color: '#64748b' }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            )}

            {filters.showIncome && (
              <ListItem sx={{ borderRadius: 1, mb: 0.5 }}>
                <ListItemText 
                  primary={getQuickFilterDisplayName('showIncome')}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleRemoveQuickFilter('showIncome')}
                    sx={{ color: '#64748b' }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            )}

            {filters.showExpenses && (
              <ListItem sx={{ borderRadius: 1, mb: 0.5 }}>
                <ListItemText 
                  primary={getQuickFilterDisplayName('showExpenses')}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleRemoveQuickFilter('showExpenses')}
                    sx={{ color: '#64748b' }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            )}

            {/* Advanced Filters */}
            {filters.advancedFilters.length > 0 && (
              <>
                {(filters.searchText || filters.showSuspicious || filters.showNew || filters.showIncome || filters.showExpenses) && (
                  <Divider sx={{ my: 1 }} />
                )}
                {filters.advancedFilters.map((filter, index) => (
                  <ListItem key={`${filter.columnId}-${filter.comparison}-${filter.value}-${index}`} sx={{ borderRadius: 1, mb: 0.5 }}>
                    <ListItemText 
                      primary={getFilterDisplayName(filter)}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleRemoveAdvancedFilter(filter)}
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
                onClick={handleClearAllFilters}
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

export default TransactionFilter; 