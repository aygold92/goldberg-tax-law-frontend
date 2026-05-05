/**
 * Utility functions for handling filename operations in the Bank Statement Frontend application.
 * 
 * This module provides helper functions for:
 * - Constructing filename with page ranges for display
 * - Creating filename with pages for API requests
 */

export function constructFilenameWithPages(filename: string, pageRange?: { first?: number; second?: number } | null): string {
  const pageRangeText = pageRange && pageRange.first && pageRange.second ? `[${pageRange.first}-${pageRange.second}]` : '';
  return `${filename}${pageRangeText}`;
}

