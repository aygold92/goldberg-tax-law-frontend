/**
 * Custom hook for managing page titles dynamically.
 * 
 * This hook provides a simple way to update the browser tab title
 * based on the current page and any relevant data.
 * 
 * Usage:
 *   const { setPageTitle } = usePageTitle();
 *   setPageTitle('Upload Documents');
 * 
 * The hook automatically prefixes titles with "Bank Statement Analyzer - "
 * to maintain brand consistency.
 */

import { useEffect, useCallback } from 'react';

const BASE_TITLE = 'Bank Statement Analyzer';

export const usePageTitle = () => {
  const setPageTitle = useCallback((title: string) => {
    document.title = title ? `${BASE_TITLE} - ${title}` : BASE_TITLE;
  }, []);

  const resetPageTitle = useCallback(() => {
    document.title = BASE_TITLE;
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      document.title = BASE_TITLE;
    };
  }, []);

  return {
    setPageTitle,
    resetPageTitle,
  };
};
