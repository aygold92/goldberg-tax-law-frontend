import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { ClassificationType } from '../../../types/bankStatement';

interface ClassificationInputProps {
  onAdd: (pages: number[], classification: string) => void;
  onValidate: (input: string) => boolean;
  validationErrors: Array<{ field: string; message: string }>;
  defaultClassification?: string;
  readOnly?: boolean;
}

const ClassificationInput: React.FC<ClassificationInputProps> = ({
  onAdd,
  onValidate,
  validationErrors,
  defaultClassification = ClassificationType.AMEX_CC,
  readOnly = false,
}) => {
  const [pageInput, setPageInput] = useState<string>('');
  const [classification, setClassification] = useState<string>(defaultClassification);

  const handleSubmit = () => {
    if (onValidate(pageInput)) {
      const pages = parsePageRange(pageInput);
      onAdd(pages, classification);
      setPageInput('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  };

  // Parse page range string (e.g., "1,3-7,10" -> [1,3,4,5,6,7,10])
  const parsePageRange = (input: string): number[] => {
    const pages: number[] = [];
    const parts = input.split(',').map(part => part.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        // Handle range (e.g., "3-7")
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        if (isNaN(start) || isNaN(end) || start > end) {
          return []; // Invalid range
        }
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
      } else {
        // Handle single page
        const page = parseInt(part);
        if (isNaN(page)) {
          return []; // Invalid page number
        }
        pages.push(page);
      }
    }

    return pages;
  };

  const pageError = validationErrors.find(e => e.field === 'pages');
  const hasError = !!pageError;

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 1 }}>
      <Box sx={{ flex: 1 }}>
        <TextField
          fullWidth
          size="small"
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          onKeyDown={handleKeyPress}
          error={hasError}
          helperText={pageError?.message}
          placeholder="Enter pages (e.g., 1,3-7,10)"
          disabled={readOnly}
          inputProps={{
            pattern: '[0-9,\\-\\s]*',
            inputMode: 'numeric',
          }}
        />
      </Box>
      
      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel>Type</InputLabel>
        <Select
          value={classification}
          onChange={(e) => setClassification(e.target.value)}
          label="Type"
          disabled={readOnly}
        >
          {Object.values(ClassificationType).map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {!readOnly && (
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleSubmit}
          disabled={!pageInput.trim() || hasError}
          sx={{ minWidth: 'auto', px: 2 }}
        >
          Add
        </Button>
      )}
    </Box>
  );
};

export default ClassificationInput;
