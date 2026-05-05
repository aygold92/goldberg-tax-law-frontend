import { useCallback } from 'react';
import { StatementSummary } from '../../../types/api';

export function useStatementNavigation(selectedClientId?: string) {
  const handleEditStatement = useCallback((statement: StatementSummary) => {
    const params = new URLSearchParams({
      statementId: statement.statementDetails.statementId,
    });
    if (selectedClientId) params.set('clientId', selectedClientId);
    window.open(`/edit?${params.toString()}`, '_blank');
  }, [selectedClientId]);

  return { handleEditStatement };
}
