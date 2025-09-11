/**
 * Custom hook for managing accordion expansion state in the AccountSummary component.
 * Handles toggling of account group accordions.
 */

import { useState } from 'react';

export function useAccountExpansion() {
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  const handleAccountToggle = (accountKey: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountKey)) {
      newExpanded.delete(accountKey);
    } else {
      newExpanded.add(accountKey);
    }
    setExpandedAccounts(newExpanded);
  };

  return {
    expandedAccounts,
    handleAccountToggle
  };
}
