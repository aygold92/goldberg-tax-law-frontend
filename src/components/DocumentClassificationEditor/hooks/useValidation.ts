import { useState } from 'react';
import { DocumentClassification } from '../../../types/api';

interface ValidationError {
  field: string;
  message: string;
}

export const useValidation = () => {
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Validate page range input
  const validatePageRange = (input: string, existingClassifications: DocumentClassification[]): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!input.trim()) {
      errors.push({ field: 'pages', message: 'Page range is required' });
      return errors;
    }

    // Parse the input
    const pages = parsePageRange(input);
    
    if (pages.length === 0) {
      errors.push({ field: 'pages', message: 'Invalid page range format' });
      return errors;
    }

    // Check for duplicates within the input
    const uniquePages = new Set(pages);
    if (uniquePages.size !== pages.length) {
      errors.push({ field: 'pages', message: 'Duplicate pages in range' });
    }

    // Note: We don't check for overlaps here because the original behavior
    // was to automatically remove overlapping classifications when adding new ones
    // This validation is only for basic format and duplicate checks

    // Check page numbers are positive
    if (pages.some(page => page <= 0)) {
      errors.push({ field: 'pages', message: 'Page numbers must be positive' });
    }

    // Check page numbers are reasonable
    if (pages.some(page => page > 1000)) {
      errors.push({ field: 'pages', message: 'Page numbers seem too high (max 1000)' });
    }

    return errors;
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

  // Validate input and set errors
  const validateInput = (pageInput: string, existingClassifications: DocumentClassification[]): boolean => {
    const errors = validatePageRange(pageInput, existingClassifications);
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Clear validation errors
  const clearValidationErrors = () => {
    setValidationErrors([]);
  };

  return {
    // State
    validationErrors,
    
    // Actions
    validateInput,
    clearValidationErrors,
    parsePageRange,
  };
};
