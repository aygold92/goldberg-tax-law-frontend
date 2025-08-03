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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        p: 2,
        border: '1px solid #e2e8f0',
        borderRadius: 2,
        backgroundColor: '#ffffff',
        fontFamily: 'monospace',
        fontSize: '14px',
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* First Balance */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                minWidth: '120px', 
                textAlign: 'right',
                color: '#64748b',
                fontWeight: 500
              }}
            >
              {isCreditCard ? 'Beginning Balance:' : 'Ending Balance:'}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                minWidth: '80px', 
                textAlign: 'right', 
                ml: 1,
                fontWeight: 600,
                color: '#1e293b'
              }}
            >
              ${isCreditCard ? statement?.beginningBalance?.toFixed(2) || '0.00' : statement?.endingBalance?.toFixed(2) || '0.00'}
            </Typography>
          </Box>
          
          {/* Minus sign */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ minWidth: '120px', textAlign: 'right' }}></Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                minWidth: '80px', 
                textAlign: 'right', 
                ml: 1,
                color: '#64748b',
                fontWeight: 500
              }}
            >
              -
            </Typography>
          </Box>
          
          {/* Second Balance */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                minWidth: '120px', 
                textAlign: 'right',
                color: '#64748b',
                fontWeight: 500
              }}
            >
              {isCreditCard ? 'Ending Balance:' : 'Beginning Balance:'}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                minWidth: '100px', 
                textAlign: 'right', 
                ml: 1,
                fontWeight: 600,
                color: '#1e293b'
              }}
            >
              ${isCreditCard ? statement?.endingBalance?.toFixed(2) || '0.00' : statement?.beginningBalance?.toFixed(2) || '0.00'}
            </Typography>
          </Box>
          
          {/* Divider line */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ minWidth: '140px', textAlign: 'right' }}></Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                minWidth: '120px', 
                textAlign: 'right', 
                ml: 1,
                pt: 0.5,
                color: '#cbd5e1',
                fontWeight: 500
              }}
            >
              ───────
            </Typography>
          </Box>
          
          {/* Expected Value and Actual */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                minWidth: '120px', 
                textAlign: 'right',
                color: '#64748b',
                fontWeight: 500
              }}
            >
              Expected Value:
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                minWidth: '100px', 
                textAlign: 'right', 
                ml: 1,
                fontWeight: 600,
                color: '#1e293b'
              }}
            >
              {statement?.endingBalance?.toString() && statement?.beginningBalance?.toString() ? (
                `$${expectedValue?.toFixed(2)}`
              ) : (
                <Tooltip title="Must specify beginning and ending balance">
                  <span style={{ color: '#f59e0b' }}>⚠️</span>
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
                      backgroundColor: expectedValue !== null && Math.abs(expectedValue - actualValue) < 0.01 ? '#10b981' : '#ef4444',
                      color: '#ffffff',
                      fontWeight: 500
                    }
                  }}
                >
                  <Box sx={{ width: '35px', height: '0px' }} />
                </Badge>
                <Typography variant="body2" sx={{ color: '#64748b' }}>)</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default NetIncomeCalculation; 