/**
 * NetIncomeCalculation component for displaying balance calculations.
 * 
 * This component shows the net income calculation in a math-like format:
 * - Ending/Beginning balance display
 * - Expected vs actual value comparison
 * - Visual indicators for matches/mismatches
 * - Different calculations for BANK vs CREDIT_CARD
 * 
 * Supports real-time updates as statement data changes.
 */

import React from 'react';
import { Box, Typography, Tooltip, Badge } from '@mui/material';
import { BankStatement } from '../types/bankStatement';
import { COLORS } from '../styles/constants';
import styles from '../styles/components/NetIncomeCalculation.module.css';

interface NetIncomeCalculationProps {
  statement: BankStatement | null;
  isCreditCard: boolean;
}

const NetIncomeCalculation: React.FC<NetIncomeCalculationProps> = ({
  statement,
  isCreditCard,
}) => {
  // Calculate net income values
  let expectedValue: number | null = null;
  let actualValue: number | null = null;
  
  if (statement) {
    if (statement.beginningBalance !== null && statement.endingBalance !== null) {
      if (isCreditCard) {
        expectedValue = statement.beginningBalance - statement.endingBalance;
      } else {
        expectedValue = statement.endingBalance - statement.beginningBalance;
      }
      actualValue = statement.transactions.reduce((sum, t) => sum + (t.amount ?? 0), 0);
    }
  }

  return (
    <Box className={styles.wrapper}>
      <Box className={styles.calculationContainer}>
        <Box className={styles.calculationContent}>
          {/* First Balance */}
          <Box className={styles.calculationRow}>
            <Typography 
              variant="body2" 
              className={styles.label}
            >
              {isCreditCard ? 'Beginning Balance:' : 'Ending Balance:'}
            </Typography>
            <Typography 
              variant="body2" 
              className={styles.value}
            >
              ${isCreditCard ? statement?.beginningBalance?.toFixed(2) || '0.00' : statement?.endingBalance?.toFixed(2) || '0.00'}
            </Typography>
          </Box>
          
          {/* Minus sign */}
          <Box className={styles.calculationRow}>
            <Typography variant="body2" className={styles.minusSign}></Typography>
            <Typography 
              variant="body2" 
              className={styles.minusValue}
            >
              -
            </Typography>
          </Box>
          
          {/* Second Balance */}
          <Box className={styles.calculationRow}>
            <Typography 
              variant="body2" 
              className={styles.label}
            >
              {isCreditCard ? 'Ending Balance:' : 'Beginning Balance:'}
            </Typography>
            <Typography 
              variant="body2" 
              className={`${styles.value} ${styles.valueWide}`}
            >
              ${isCreditCard ? statement?.endingBalance?.toFixed(2) || '0.00' : statement?.beginningBalance?.toFixed(2) || '0.00'}
            </Typography>
          </Box>
          
          {/* Divider line */}
          <Box className={styles.calculationRow}>
            <Typography variant="body2" className={styles.dividerSpacer}></Typography>
            <Typography 
              variant="body2" 
              className={styles.dividerLine}
            >
              ───────
            </Typography>
          </Box>
          
          {/* Expected Value and Actual */}
          <Box className={styles.calculationRow}>
            <Typography 
              variant="body2" 
              className={styles.expectedLabel}
            >
              Expected Value:
            </Typography>
            <Typography 
              variant="body2" 
              className={styles.expectedValue}
            >
              {statement?.endingBalance?.toString() && statement?.beginningBalance?.toString() ? (
                `$${expectedValue?.toFixed(2)}`
              ) : (
                <Tooltip title="Must specify beginning and ending balance">
                  <span style={{ color: COLORS.status.warning }}>⚠️</span>
                </Tooltip>
              )}
            </Typography>
            {actualValue !== null && (
              <Box className={styles.actualContainer}>
                <Badge 
                  badgeContent={`Actual: $${actualValue.toFixed(2)}`}
                  color={expectedValue !== null && Math.abs(expectedValue - actualValue) < 0.01 ? 'success' : 'error'}
                  sx={{ 
                    '& .MuiBadge-badge': {
                      fontSize: '10px',
                      height: '16px',
                      minWidth: '100px',
                      backgroundColor: expectedValue !== null && Math.abs(expectedValue - actualValue) < 0.01 ? COLORS.status.success : COLORS.status.error,
                      color: '#ffffff',
                      fontWeight: 500
                    }
                  }}
                >
                  <Box className={styles.actualSpacer} />
                </Badge>
                <Typography variant="body2" className={styles.actualClose}>)</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default NetIncomeCalculation; 