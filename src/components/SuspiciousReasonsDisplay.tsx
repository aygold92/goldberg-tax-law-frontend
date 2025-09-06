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
import { COLORS } from '../styles/constants';
import styles from '../styles/components/SuspiciousReasonsDisplay.module.css';

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
    <Box className={styles.warningContainer}>
      <Box className={styles.warningHeader}>
        <Warning className={styles.warningIcon} />
        <Typography variant="h6" className={styles.warningTitle}>
          Validation Warnings
        </Typography>
      </Box>
      
      <Box className={styles.contentContainer}>
        {/* Calculated Suspicious Reasons */}
        <Box className={styles.sectionContainer}>
          {calcSuspicious.length > 0 && (
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" className={styles.sectionTitle}>
                Calculated Issues:
              </Typography>
              <Box className={styles.reasonsList}>
                <ul>
                  {calcSuspicious.map((reason, i) => <li key={i}>{reason}</li>)}
                </ul>
              </Box>
            </Box>
          )}
        </Box>

        {/* API Suspicious Reasons */}
        <Box className={styles.sectionContainer}>
          {apiSuspicious.length > 0 && (
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" className={styles.sectionTitle}>
                API Issues:
              </Typography>
              <Box className={styles.reasonsList}>
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