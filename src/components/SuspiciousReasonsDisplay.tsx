/**
 * SuspiciousReasonsDisplay component for showing validation warnings.
 * 
 * This component displays both API and calculated suspicious reasons:
 * - API suspicious reasons from the backend
 * - Calculated suspicious reasons from client-side validation
 * - Visual indicators with tooltips
 * - Organized layout with proper spacing
 * 
 * Supports real-time updates as statement data changes.
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { Warning } from '@mui/icons-material';
import { BankStatement } from '../types/bankStatement';
import { calculateStatementSuspiciousReasons } from '../utils/validation';

interface SuspiciousReasonsDisplayProps {
  statement: BankStatement | null;
}

const SuspiciousReasonsDisplay: React.FC<SuspiciousReasonsDisplayProps> = ({
  statement,
}) => {
  // Get suspicious reasons
  const apiSuspicious = statement?.suspiciousReasons || [];
  const calcSuspicious = statement ? calculateStatementSuspiciousReasons(statement) : [];

  // Don't render if no suspicious reasons
  if (apiSuspicious.length === 0 && calcSuspicious.length === 0) {
    return null;
  }

  return (
    <Box sx={{ 
      mb: 3,
      p: 2,
      backgroundColor: '#fef3c7',
      border: '1px solid #f59e0b',
      borderRadius: 2,
      borderLeft: '4px solid #f59e0b'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 1 }}>
        <Warning sx={{ color: '#92400e', mt: 0.5, flexShrink: 0 }} />
        <Typography variant="h6" sx={{ color: '#92400e', fontWeight: 600 }}>
          Validation Warnings
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3 }}>
        {/* Calculated Suspicious Reasons */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1 }}>
          {calcSuspicious.length > 0 && (
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: '#92400e', fontWeight: 500, mb: 1 }}>
                Calculated Issues:
              </Typography>
              <Box 
                sx={{ 
                  maxHeight: '150px', 
                  overflowY: 'auto', 
                  '& ul': {
                    color: '#92400e',
                    margin: 0,
                    paddingLeft: '20px',
                    '& li': {
                      marginBottom: '4px',
                      fontSize: '0.875rem',
                      lineHeight: 1.4
                    }
                  }
                }}
              >
                <ul>
                  {calcSuspicious.map((reason, i) => <li key={i}>{reason}</li>)}
                </ul>
              </Box>
            </Box>
          )}
        </Box>

        {/* API Suspicious Reasons */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1 }}>
          {apiSuspicious.length > 0 && (
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: '#92400e', fontWeight: 500, mb: 1 }}>
                API Issues:
              </Typography>
              <Box 
                sx={{ 
                  maxHeight: '150px', 
                  overflowY: 'auto', 
                  '& ul': {
                    color: '#92400e',
                    margin: 0,
                    paddingLeft: '20px',
                    '& li': {
                      marginBottom: '4px',
                      fontSize: '0.875rem',
                      lineHeight: 1.4
                    }
                  }
                }}
              >
                <ul>
                  {apiSuspicious.map((reason, i) => <li key={i}>{reason}</li>)}
                </ul>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default SuspiciousReasonsDisplay; 