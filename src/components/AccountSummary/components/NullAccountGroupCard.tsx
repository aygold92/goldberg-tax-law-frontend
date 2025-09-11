/**
 * Component for rendering null account group cards with accordion functionality.
 * Shows statements that don't have valid account numbers with their classification.
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
import { ExpandMore, AccountBalance, Error, Warning } from '@mui/icons-material';
import { BankStatementMetadata } from '../../../types/api';
import { NullAccountGroup } from '../types/accountSummary';
import YearlyTimeline from './YearlyTimeline';
import InvalidDateStatements from './InvalidDateStatements';
import styles from '../AccountSummary.module.css';

interface NullAccountGroupCardProps {
  group: NullAccountGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onEditStatement: (statement: BankStatementMetadata) => void;
}

const NullAccountGroupCard: React.FC<NullAccountGroupCardProps> = ({ 
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
              <AccountBalance fontSize="small" color="primary" />
              <Typography variant="h6" className={styles.accountTitle}>
                No Account - {group.classification}
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={1} className={styles.summaryChips}>
              <Chip 
                label={`${group.totalStatements} statements`}
                size="small"
                color="primary"
                variant="outlined"
              />
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
            </Stack>
          </Box>
        </AccordionSummary>
        
        <AccordionDetails>
          <Box className={styles.accountDetails}>
            {Object.keys(group.yearlyTimeline).length > 0 && (
              <YearlyTimeline 
                yearlyTimeline={group.yearlyTimeline}
                onEditStatement={onEditStatement}
              />
            )}
            
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

export default NullAccountGroupCard;
