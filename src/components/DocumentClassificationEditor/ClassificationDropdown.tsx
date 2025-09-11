/**
 * ClassificationDropdown component for selecting document classification types.
 * 
 * This component provides a dropdown interface for selecting from the available
 * classification types defined in the ClassificationType enum.
 * 
 * Features:
 * - Uses existing ClassificationType enum for consistency
 * - Material-UI Select component with proper styling
 * - Form validation support
 * - Disabled state support
 */

import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { ClassificationType } from '../../types/bankStatement';

interface ClassificationDropdownProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  label?: string;
}

const ClassificationDropdown: React.FC<ClassificationDropdownProps> = ({
  value,
  onChange,
  disabled = false,
  error = false,
  helperText,
  label = 'Classification',
}) => {
  const classificationOptions = Object.values(ClassificationType);

  return (
    <FormControl fullWidth error={error} disabled={disabled}>
      <InputLabel id="classification-select-label">{label}</InputLabel>
      <Select
        labelId="classification-select-label"
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
      >
        {classificationOptions.map((classification) => (
          <MenuItem key={classification} value={classification}>
            {classification}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default ClassificationDropdown;
