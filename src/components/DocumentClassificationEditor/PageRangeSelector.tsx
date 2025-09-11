/**
 * PageSelector component for selecting pages and ranges in a document.
 * 
 * This component provides a compact interface for selecting pages with support
 * for ranges like "1,3-7" which gets converted to [1,3,4,5,6,7].
 * 
 * Features:
 * - Page input with comma-separated values and ranges
 * - Real-time validation
 * - Support for ranges (1-5) and individual pages (1,3,7)
 * - Error handling and display
 * - Disabled state support
 */

import React, { useState, useEffect } from 'react';
import {
  TextField,
  Box,
} from '@mui/material';

interface PageSelectorProps {
  pages: number[];
  onPagesChange: (pages: number[]) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  minPage?: number;
  maxPage?: number;
}

const PageSelector: React.FC<PageSelectorProps> = ({
  pages,
  onPagesChange,
  disabled = false,
  error = false,
  helperText,
  minPage = 1,
  maxPage = 1000,
}) => {
  const [inputValue, setInputValue] = useState<string>('');

  // Convert pages array to range string for display
  const pagesToRangeString = (pageNumbers: number[]): string => {
    if (pageNumbers.length === 0) return '';
    
    const sorted = [...pageNumbers].sort((a, b) => a - b);
    const ranges: string[] = [];
    let start = sorted[0];
    let end = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        if (start === end) {
          ranges.push(start.toString());
        } else {
          ranges.push(`${start}-${end}`);
        }
        start = sorted[i];
        end = sorted[i];
      }
    }

    if (start === end) {
      ranges.push(start.toString());
    } else {
      ranges.push(`${start}-${end}`);
    }

    return ranges.join(',');
  };

  // Update input value when pages change externally
  useEffect(() => {
    setInputValue(pagesToRangeString(pages));
  }, [pages]);

  const parseRangeString = (value: string): number[] => {
    if (!value.trim()) return [];

    const parts = value.split(',').map(s => s.trim()).filter(s => s);
    const pageNumbers: number[] = [];

    for (const part of parts) {
      if (part.includes('-')) {
        // Handle range like "3-7"
        const [startStr, endStr] = part.split('-').map(s => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);

        if (isNaN(start) || isNaN(end)) {
          throw new Error(`Invalid range: ${part}`);
        }

        if (start > end) {
          throw new Error(`Invalid range: ${part} (start > end)`);
        }

        for (let i = start; i <= end; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Handle single page
        const page = parseInt(part, 10);
        if (isNaN(page)) {
          throw new Error(`Invalid page number: ${part}`);
        }
        pageNumbers.push(page);
      }
    }

    return pageNumbers;
  };

  const validatePages = (pageNumbers: number[]): string => {
    if (pageNumbers.length === 0) {
      return 'At least one page must be selected';
    }

    for (const page of pageNumbers) {
      if (page < minPage) {
        return `Page ${page} must be at least ${minPage}`;
      }
      if (page > maxPage) {
        return `Page ${page} must be at most ${maxPage}`;
      }
      if (!Number.isInteger(page)) {
        return `Page ${page} must be a whole number`;
      }
    }

    // Check for duplicates
    const uniquePages = new Set(pageNumbers);
    if (uniquePages.size !== pageNumbers.length) {
      return 'Duplicate pages are not allowed';
    }

    return '';
  };

  const handleInputChange = (value: string) => {
    // Only allow numbers, comma, hyphen
    const cleanValue = value.replace(/[^0-9,\-]/g, '');
    setInputValue(cleanValue);
    
    if (!cleanValue.trim()) {
      onPagesChange([]);
      return;
    }

    try {
      const pageNumbers = parseRangeString(cleanValue);
      const validationError = validatePages(pageNumbers);
      
      if (!validationError) {
        onPagesChange(pageNumbers);
      }
    } catch (err: any) {
      // Error will be shown via the error prop from parent
    }
  };

  const hasError = error || !!helperText;

  return (
    <Box>
      <TextField
        label="Pages"
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        disabled={disabled}
        error={hasError}
        size="small"
        fullWidth
        placeholder="e.g., 1,3-7,10"
        helperText={helperText}
        inputProps={{ min: minPage, max: maxPage }}
      />
    </Box>
  );
};

export default PageSelector;
