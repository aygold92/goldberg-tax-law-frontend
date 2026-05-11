import { useCallback } from 'react';
import { StatementSummary } from '../../../types/api';

export function useStatementNavigation(
  selectedClientId?: string,
  onOpenStatement?: (statementId: string, openInNewTab: boolean) => void,
) {
  const handleEditStatement = useCallback((statement: StatementSummary, openInNewTab = false) => {
    const statementId = statement.statementDetails.statementId;
    if (onOpenStatement) {
      onOpenStatement(statementId, openInNewTab);
    } else {
      const params = new URLSearchParams({ statementId });
      if (selectedClientId) params.set('clientId', selectedClientId);
      window.open(`/edit?${params.toString()}`, '_blank');
    }
  }, [selectedClientId, onOpenStatement]);

  return { handleEditStatement };
}
