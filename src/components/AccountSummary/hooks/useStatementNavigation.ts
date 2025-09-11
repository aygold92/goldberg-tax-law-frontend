/**
 * Custom hook for handling statement navigation and editing functionality.
 * Manages opening statements in the edit page with proper URL parameters.
 */

import { useCallback } from 'react';
import { BankStatementMetadata } from '../../../types/api';
import { constructFilenameWithPages } from '../../../utils/filenameUtils';

export function useStatementNavigation(selectedClient?: string) {
  const handleEditStatement = useCallback((statement: BankStatementMetadata) => {
    const params = new URLSearchParams({
      clientName: selectedClient || '',
      accountNumber: statement.key.accountNumber,
      classification: statement.key.classification,
      date: statement.key.date,
    });
    
    // Add filenameWithPages if accountNumber or date is null
    if (statement.key.accountNumber === 'null' || statement.key.date === 'null') {
      const filenameWithPages = constructFilenameWithPages(statement.metadata.filename, statement.metadata.pageRange);
      params.append('filenameWithPages', filenameWithPages);
    }
    
    window.open(`/edit?${params.toString()}`, '_blank');
  }, [selectedClient]);

  return {
    handleEditStatement
  };
}
