/**
 * FilterDisplayPopover component for table column filtering.
 * 
 * This component provides a popover interface for setting table column filters on any column:
 * - Dropdown for comparison operators (based on column filter type)
 * - Input field for filter values (with type-specific handling)
 * - OK/Cancel buttons with keyboard support
 * - Clear filter functionality
 * 
 * Used by any ReactGrid component for column-specific filtering.
 * 
 * Dependencies:
 * - @mui/material for UI components
 * - @mui/icons-material for icons
 * - GenericFilterUtils for filter logic
 */

import React, { useState, useEffect } from 'react';
import {
  Popover,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Typography,
  Stack
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { 
  FilterCriteria, 

} from './FilterTypes';
import { 
  getComparisonDisplayText, 
  getColumnFilterOptions,
  convertFilterValue
} from './filterOperations';
import { CompatibleData, TableColumn } from '../types';

interface ColumnFilterPopoverProps<T extends CompatibleData> {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  column: TableColumn<T>;
  currentFilter: FilterCriteria | null;
  onApplyFilter: (filter: FilterCriteria | null) => void;
}

const ColumnFilterPopover = <T extends CompatibleData>({
  anchorEl,
  onClose,
  column,
  currentFilter,
  onApplyFilter
}: ColumnFilterPopoverProps<T>): React.ReactElement => {
  const [comparison, setComparison] = useState<FilterCriteria['comparison']>(
    currentFilter?.comparison || 'equals'
  );
  const [value, setValue] = useState<string | number>(
    currentFilter?.value?.toString() || ''
  );

  const filterType = column.type || 'text';
  const comparisonOperators = getColumnFilterOptions(filterType);
  const inputType = filterType === 'number' ? 'number' : filterType === 'date' ? 'date' : 'text';
  const open = Boolean(anchorEl);

  // Reset form when popover opens
  useEffect(() => {
    if (open) {
      setComparison(currentFilter?.comparison || 'equals');
      setValue(currentFilter?.value?.toString() || '');
    }
  }, [open, currentFilter]);

  const handleApply = () => {
    const convertedValue = convertFilterValue(value, filterType);
    const filter: FilterCriteria = {
      columnId: String(column.columnId),
      comparison,
      value: comparison === 'null' ? undefined : convertedValue
    };
    onApplyFilter(filter);
    onClose();
  };

  const handleClear = () => {
    onApplyFilter(null);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleApply();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      PaperProps={{
        sx: { minWidth: 300, p: 2 }
      }}
    >
      <Box onKeyDown={handleKeyDown}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">Filter {column.label || column.columnId}</Typography>
          <IconButton size="small" onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>

        <Stack spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Comparison</InputLabel>
            <Select
              value={comparison}
              onChange={(e) => setComparison(e.target.value as FilterCriteria['comparison'])}
              label="Comparison"
            >
              {comparisonOperators.map((op) => (
                <MenuItem key={op} value={op}>
                  {getComparisonDisplayText(op)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {comparison !== 'null' && (
            <TextField
              fullWidth
              size="small"
              label="Value"
              type={inputType}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Enter ${(column.label || String(column.columnId)).toLowerCase()}...`}
            />
          )}

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              variant="outlined"
              size="small"
              onClick={handleClear}
              disabled={!currentFilter}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleApply}
            >
              Apply
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Popover>
  );
};

export default ColumnFilterPopover;
