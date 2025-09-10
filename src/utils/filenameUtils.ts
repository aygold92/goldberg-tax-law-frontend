/**
 * Utility functions for handling filename operations in the Bank Statement Frontend application.
 * 
 * This module provides helper functions for:
 * - Constructing filename with page ranges for display
 * - Creating filename with pages for API requests
 */

import { BankStatementMetadata } from '../types/api';

/**
 * Constructs a filename with page range for display purposes.
 * 
 * @param filename - The base filename
 * @param pageRange - The page range object with first and second page numbers
 * @returns The filename with page range in format "filename[first-second]"
 */
export function constructFilenameWithPages(filename: string, pageRange?: { first?: number; second?: number } | null): string {
  const pageRangeText = pageRange && pageRange.first && pageRange.second ? `[${pageRange.first}-${pageRange.second}]` : '';
  return `${filename}${pageRangeText}`;
}

