/**
 * Main AccountSummary component that displays bank statements organized by account groups.
 * Shows account summaries with timelines, status indicators, and statement details.
 * Uses Material-UI components for consistent styling and user experience.
 * 
 * External dependencies:
 * - @mui/material: UI components and theming
 * - @mui/icons-material: Icons for status indicators
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { AccountSummaryProps } from './types/accountSummary';
import { useAccountSummaryData } from './hooks/useAccountSummaryData';
import { useAccountExpansion } from './hooks/useAccountExpansion';
import { useStatementNavigation } from './hooks/useStatementNavigation';
import AccountGroupCard from './components/AccountGroupCard';
import NullAccountGroupCard from './components/NullAccountGroupCard';
import styles from './AccountSummary.module.css';

const AccountSummary: React.FC<AccountSummaryProps> = ({ statements, selectedClient }) => {
  const { accountGroups, nullAccountGroups } = useAccountSummaryData(statements);
  const { expandedAccounts, handleAccountToggle } = useAccountExpansion();
  const { handleEditStatement } = useStatementNavigation(selectedClient);


  if (accountGroups.length === 0 && nullAccountGroups.length === 0) {
    return (
      <Box sx={{ mb: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1, border: '1px solid #2196f3' }}>
        <Typography variant="body2" color="primary">
          No statements found for the selected client.
        </Typography>
      </Box>
    );
  }

  return (
    <Box className={styles.container}>
      <Typography variant="h6" gutterBottom className={styles.title}>
        Account Summary
      </Typography>
      
      {accountGroups.map(group => (
        <AccountGroupCard
          key={group.accountKey}
          group={group}
          isExpanded={expandedAccounts.has(group.accountKey)}
          onToggle={() => handleAccountToggle(group.accountKey)}
          onEditStatement={handleEditStatement}
        />
      ))}
      
      {nullAccountGroups.map(nullGroup => (
        <NullAccountGroupCard
          key={`null-${nullGroup.classification}`}
          group={nullGroup}
          isExpanded={expandedAccounts.has(`null-${nullGroup.classification}`)}
          onToggle={() => handleAccountToggle(`null-${nullGroup.classification}`)}
          onEditStatement={handleEditStatement}
        />
      ))}
    </Box>
  );
};


export default AccountSummary;
