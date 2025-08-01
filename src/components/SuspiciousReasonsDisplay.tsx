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
import { Box, Typography, Tooltip } from '@mui/material';
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
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
      {/* Calculated Suspicious Reasons */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1, mr: 2 }}>
        {calcSuspicious.length > 0 && (
          <Tooltip title="Calculated suspicious reasons">
            <Warning color="error" sx={{ mt: 0.5, flexShrink: 0 }} />
          </Tooltip>
        )}
        {calcSuspicious.length > 0 && (
          <Box 
            sx={{ 
              maxHeight: '200px', 
              overflowY: 'auto', 
              flex: 1,
              '& ul': {
                color: 'red',
                margin: 0,
                paddingLeft: '20px'
              }
            }}
          >
            <ul>
              {calcSuspicious.map((reason, i) => <li key={i}>{reason}</li>)}
            </ul>
          </Box>
        )}
      </Box>

      {/* API Suspicious Reasons */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1 }}>
        {apiSuspicious.length > 0 && (
          <Tooltip title="API suspicious reasons">
            <Warning color="error" sx={{ mt: 0.5, flexShrink: 0 }} />
          </Tooltip>
        )}
        {apiSuspicious.length > 0 && (
          <Box 
            sx={{ 
              maxHeight: '200px', 
              overflowY: 'auto', 
              flex: 1,
              '& ul': {
                color: 'red',
                margin: 0,
                paddingLeft: '20px'
              }
            }}
          >
            <ul>
              {apiSuspicious.map((reason, i) => <li key={i}>{reason}</li>)}
            </ul>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SuspiciousReasonsDisplay; 