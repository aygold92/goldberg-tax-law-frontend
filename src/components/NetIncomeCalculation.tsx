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
  let netMatch: boolean | null = null;
  let netError: string | null = null;
  
  if (statement) {
    if (statement.endingBalance !== null && statement.endingBalance !== undefined && 
        statement.beginningBalance !== null && statement.beginningBalance !== undefined) {
      if (isCreditCard) {
        // For CREDIT_CARD: ExpectedValue = beginningBalance - endingBalance
        expectedValue = statement.beginningBalance - statement.endingBalance;
      } else {
        // For BANK: ExpectedValue = endingBalance - beginningBalance
        expectedValue = statement.endingBalance - statement.beginningBalance;
      }
      actualValue = statement.transactions.reduce((sum, t) => sum + (t.amount ?? 0), 0);
      netMatch = Math.abs(expectedValue - actualValue) < 0.01; // Use small tolerance for floating point
    } else {
      netError = 'Must specify beginning and ending balance';
    }
  }

  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="h6" sx={{ mb: 0.5 }}>Net Income Calculation</Typography>
      <Box sx={{ 
        p: 1.5,
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        backgroundColor: '#fafafa',
        fontFamily: 'monospace',
        fontSize: '14px',
        minHeight: '120px',
        maxWidth: '370px'
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* First Balance */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ minWidth: '120px', textAlign: 'right' }}>
              {isCreditCard ? 'Beginning Balance:' : 'Ending Balance:'}
            </Typography>
            <Typography variant="body1" sx={{ minWidth: '80px', textAlign: 'right', ml: 1 }}>
              ${isCreditCard ? statement?.beginningBalance?.toFixed(2) || '0.00' : statement?.endingBalance?.toFixed(2) || '0.00'}
            </Typography>
          </Box>
          
          {/* Minus sign */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ minWidth: '120px', textAlign: 'right' }}></Typography>
            <Typography variant="body1" sx={{ minWidth: '80px', textAlign: 'right', ml: 1 }}>
              -
            </Typography>
          </Box>
          
          {/* Second Balance */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ minWidth: '120px', textAlign: 'right' }}>
              {isCreditCard ? 'Ending Balance:' : 'Beginning Balance:'}
            </Typography>
            <Typography variant="body1" sx={{ minWidth: '100px', textAlign: 'right', ml: 1 }}>
              ${isCreditCard ? statement?.endingBalance?.toFixed(2) || '0.00' : statement?.beginningBalance?.toFixed(2) || '0.00'}
            </Typography>
          </Box>
          
          {/* Divider line */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ minWidth: '140px', textAlign: 'right' }}></Typography>
            <Typography variant="body1" sx={{ 
              minWidth: '120px', 
              textAlign: 'right', 
              ml: 1,
              pt: 0.5
            }}>
              ───────
            </Typography>
          </Box>
          
          {/* Expected Value and Actual */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ minWidth: '120px', textAlign: 'right' }}>
              Expected Value:
            </Typography>
            <Typography variant="body1" sx={{ minWidth: '100px', textAlign: 'right', ml: 1 }}>
              {statement?.endingBalance?.toString() && statement?.beginningBalance?.toString() ? (
                `$${expectedValue?.toFixed(2)}`
              ) : (
                <Tooltip title="Must specify beginning and ending balance">
                  <span>⚠️</span>
                </Tooltip>
              )}
            </Typography>
            {actualValue !== null && (
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 3, gap: 0.5 }}>
                <Badge 
                  badgeContent={`Actual: $${actualValue.toFixed(2)}`}
                  color={expectedValue !== null && Math.abs(expectedValue - actualValue) < 0.01 ? 'success' : 'error'}
                  sx={{ 
                    '& .MuiBadge-badge': {
                      fontSize: '10px',
                      height: '16px',
                      minWidth: '100px',
                    }
                  }}
                >
                  <Box sx={{ width: '35px', height: '0px' }} />
                </Badge>
                <Typography variant="body1">)</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default NetIncomeCalculation; 