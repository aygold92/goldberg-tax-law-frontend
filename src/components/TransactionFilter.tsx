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
  ButtonGroup,
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
    <Box sx={{ mb: 2 }}>
      <Stack spacing={2}>
        {/* Search Input */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search transactions... (space-separated terms for AND logic)"
          value={filters.searchText}
          onChange={(e) => handleSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: hasActiveFilters ? (
              <InputAdornment position="end">
                <Tooltip title="Clear all filters">
                  <Button
                    size="small"
                    onClick={handleClearAllFilters}
                    sx={{ minWidth: 'auto', p: 0.5 }}
                  >
                    <Clear fontSize="small" />
                  </Button>
                </Tooltip>
              </InputAdornment>
            ) : null
          }}
        />

        {/* Quick Filter Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            Quick filters:
          </Typography>
          
          <ButtonGroup size="small" variant="outlined">
            <Tooltip title="Show suspicious transactions">
              <Button
                onClick={() => handleToggleFilter('showSuspicious')}
                variant={filters.showSuspicious ? 'contained' : 'outlined'}
                startIcon={<Warning />}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                Suspicious
              </Button>
            </Tooltip>
            
            <Tooltip title="Show new transactions">
              <Button
                onClick={() => handleToggleFilter('showNew')}
                variant={filters.showNew ? 'contained' : 'outlined'}
                startIcon={<Add />}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                New
              </Button>
            </Tooltip>
            
            <Tooltip title="Show income transactions (amount > 0)">
              <Button
                onClick={() => handleToggleFilter('showIncome')}
                variant={filters.showIncome ? 'contained' : 'outlined'}
                startIcon={<TrendingUp />}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                Income
              </Button>
            </Tooltip>
            
            <Tooltip title="Show expense transactions (amount < 0)">
              <Button
                onClick={() => handleToggleFilter('showExpenses')}
                variant={filters.showExpenses ? 'contained' : 'outlined'}
                startIcon={<TrendingDown />}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                Expenses
              </Button>
            </Tooltip>
          </ButtonGroup>
        </Box>

        {/* Filter Badge and Count */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {hasActiveFilters && (
            <Chip
              icon={<FilterList />}
              label={`${activeFilterCount} active filter${activeFilterCount !== 1 ? 's' : ''}`}
              size="small"
              color="primary"
              variant="outlined"
              onClick={(e) => setFilterPopoverAnchor(e.currentTarget)}
              sx={{ cursor: 'pointer' }}
            />
          )}
          
          <Typography variant="body2" color="text.secondary">
            Showing {filteredCount} of {totalCount} transactions
          </Typography>
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
          sx: { minWidth: 300, maxWidth: 400, maxHeight: 400 }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Active Filters
          </Typography>
          
          <List dense>
            {/* Search Text Filter */}
            {filters.searchText && (
              <ListItem>
                <ListItemText 
                  primary="Search text" 
                  secondary={`"${filters.searchText}"`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={handleClearSearch}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            )}

            {/* Quick Filters */}
            {filters.showSuspicious && (
              <ListItem>
                <ListItemText 
                  primary={getQuickFilterDisplayName('showSuspicious')}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleRemoveQuickFilter('showSuspicious')}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            )}

            {filters.showNew && (
              <ListItem>
                <ListItemText 
                  primary={getQuickFilterDisplayName('showNew')}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleRemoveQuickFilter('showNew')}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            )}

            {filters.showIncome && (
              <ListItem>
                <ListItemText 
                  primary={getQuickFilterDisplayName('showIncome')}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleRemoveQuickFilter('showIncome')}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            )}

            {filters.showExpenses && (
              <ListItem>
                <ListItemText 
                  primary={getQuickFilterDisplayName('showExpenses')}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleRemoveQuickFilter('showExpenses')}
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
                  <ListItem key={`${filter.columnId}-${filter.comparison}-${filter.value}-${index}`}>
                    <ListItemText 
                      primary={getFilterDisplayName(filter)}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleRemoveAdvancedFilter(filter)}
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
            <Box sx={{ mt: 2, pt: 1, borderTop: 1, borderColor: 'divider' }}>
              <Button
                size="small"
                onClick={handleClearAllFilters}
                startIcon={<Clear />}
                fullWidth
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