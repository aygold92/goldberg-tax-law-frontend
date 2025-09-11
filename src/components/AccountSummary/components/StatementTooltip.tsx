/**
 * Component for rendering detailed statement information in tooltips.
 * Shows statement metadata including transactions, spending, income, and issues.
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { Error, Warning } from '@mui/icons-material';
import { MonthBlock } from '../types/accountSummary';
import styles from '../AccountSummary.module.css';

interface StatementTooltipProps {
  monthBlock: MonthBlock;
}

/**
 * Generates tooltip content for month blocks without statements
 */
function getMonthBlockTooltip(monthBlock: MonthBlock): string {
  if (monthBlock.hasStatement) {
    const issues = [];
    if (monthBlock.isSuspicious) issues.push('Suspicious');
    if (monthBlock.hasMissingChecks) issues.push('Missing checks');
    
    if (issues.length > 0) {
      return `${monthBlock.monthName}: ${issues.join(', ')} - Click to edit`;
    }
    return `${monthBlock.monthName}: Statement available - Click to edit`;
  } else if (monthBlock.isMissing) {
    return `${monthBlock.monthName}: Missing statement`;
  } else {
    return `${monthBlock.monthName}: No statement expected`;
  }
}

const StatementTooltip: React.FC<StatementTooltipProps> = ({ monthBlock }) => {
  if (!monthBlock.hasStatement || !monthBlock.statement) {
    return <>{getMonthBlockTooltip(monthBlock)}</>;
  }

  const statement = monthBlock.statement;
  const spending = statement.metadata.totalSpending || 0;
  const income = statement.metadata.totalIncomeCredits || 0;
  const transactions = statement.metadata.numTransactions || 0;

  return (
    <Box className={styles.tooltipContent}>
      <Typography variant="subtitle2" className={styles.tooltipTitle}>
        {statement.metadata.filename}
      </Typography>
      
      <Box className={styles.tooltipDetails}>
        <Box className={styles.tooltipRow}>
          <Typography variant="caption" className={styles.tooltipLabel}>
            Date:
          </Typography>
          <Typography variant="caption" className={styles.tooltipValue}>
            {monthBlock.statementDate}
          </Typography>
        </Box>
        
        <Box className={styles.tooltipRow}>
          <Typography variant="caption" className={styles.tooltipLabel}>
            Transactions:
          </Typography>
          <Typography variant="caption" className={styles.tooltipValue}>
            {transactions}
          </Typography>
        </Box>
        
        <Box className={styles.tooltipRow}>
          <Typography variant="caption" className={styles.tooltipLabel}>
            Spending:
          </Typography>
          <Typography variant="caption" className={styles.tooltipValue}>
            ${spending.toLocaleString()}
          </Typography>
        </Box>
        
        <Box className={styles.tooltipRow}>
          <Typography variant="caption" className={styles.tooltipLabel}>
            Income:
          </Typography>
          <Typography variant="caption" className={styles.tooltipValue}>
            ${income.toLocaleString()}
          </Typography>
        </Box>
        
        {(monthBlock.isSuspicious || monthBlock.hasMissingChecks) && (
          <Box className={styles.tooltipIssues}>
            {monthBlock.isSuspicious && (
              <Box className={styles.tooltipRow}>
                <Error color="error" fontSize="small" />
                <Typography variant="caption" className={styles.tooltipIssue}>
                  Suspicious statement
                </Typography>
              </Box>
            )}
            {monthBlock.hasMissingChecks && (
              <Box className={styles.tooltipRow}>
                <Warning color="warning" fontSize="small" />
                <Typography variant="caption" className={styles.tooltipIssue}>
                  Missing checks
                </Typography>
              </Box>
            )}
          </Box>
        )}
        
        <Typography variant="caption" className={styles.tooltipClickHint}>
          Click to edit statement
        </Typography>
      </Box>
    </Box>
  );
};

export default StatementTooltip;
