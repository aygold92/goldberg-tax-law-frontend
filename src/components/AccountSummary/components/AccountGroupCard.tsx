/**
 * Component for rendering account group cards with accordion functionality.
 * Shows account information, summary chips, and detailed timeline/statements.
 */

import React from 'react';
import {
  Card,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Chip,
  Stack
} from '@mui/material';
import { ExpandMore, AccountBalance, CreditCard, Error, Warning } from '@mui/icons-material';
import { BankStatementMetadata } from '../../../types/api';
import { AccountGroup } from '../types/accountSummary';
import YearlyTimeline from './YearlyTimeline';
import InvalidDateStatements from './InvalidDateStatements';
import styles from '../AccountSummary.module.css';

interface AccountGroupCardProps {
  group: AccountGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onEditStatement: (statement: BankStatementMetadata) => void;
}

/**
 * Gets the appropriate bank icon based on bank type
 */
function getBankIcon(bankType: string) {
  if (bankType === 'CREDIT_CARD') {
    return <CreditCard fontSize="small" color="secondary" />;
  }
  return <AccountBalance fontSize="small" color="primary" />;
}

const AccountGroupCard: React.FC<AccountGroupCardProps> = ({ 
  group, 
  isExpanded, 
  onToggle, 
  onEditStatement 
}) => {
  return (
    <Card className={styles.accountCard}>
      <Accordion expanded={isExpanded} onChange={onToggle}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box className={styles.accountHeader}>
            <Box className={styles.accountInfo}>
              {getBankIcon(group.bankType)}
              <Typography variant="h6" className={styles.accountTitle}>
                {group.accountNumber} - {group.classification}
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={1} className={styles.summaryChips}>
              <Chip 
                label={`${group.totalStatements} statements`}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip 
                label={group.dateRange}
                size="small"
                color="info"
                variant="outlined"
              />
              {group.missingMonthsCount > 0 && (
                <Chip 
                  label={`${group.missingMonthsCount} missing months`}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
              {group.suspiciousCount > 0 && (
                <Chip 
                  label={`${group.suspiciousCount} suspicious`}
                  size="small"
                  color="error"
                  icon={<Error />}
                />
              )}
              {group.missingChecksCount > 0 && (
                <Chip
                  label={`${group.missingChecksCount} missing checks`}
                  size="small"
                  color="warning"
                  icon={<Warning />}
                />
              )}
              {group.noTransactionsCount > 0 && (
                <Chip
                  label={`${group.noTransactionsCount} no transactions`}
                  size="small"
                  color="warning"
                  icon={<Warning />}
                />
              )}
            </Stack>
          </Box>
        </AccordionSummary>
        
        <AccordionDetails>
          <Box className={styles.accountDetails}>
            <YearlyTimeline 
              yearlyTimeline={group.yearlyTimeline}
              onEditStatement={onEditStatement}
            />
            
            <InvalidDateStatements 
              invalidDateStatements={group.invalidDateStatements}
              onEditStatement={onEditStatement}
            />
          </Box>
        </AccordionDetails>
      </Accordion>
    </Card>
  );
};

export default AccountGroupCard;
