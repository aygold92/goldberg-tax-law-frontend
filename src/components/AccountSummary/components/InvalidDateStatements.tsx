/**
 * Component for rendering statements with invalid dates.
 * Displays these statements in a list format with status indicators.
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { Warning, Error } from '@mui/icons-material';
import { BankStatementMetadata } from '../../../types/api';
import styles from '../AccountSummary.module.css';

interface InvalidDateStatementsProps {
  invalidDateStatements: BankStatementMetadata[];
  onEditStatement: (statement: BankStatementMetadata) => void;
}

const InvalidDateStatements: React.FC<InvalidDateStatementsProps> = ({ 
  invalidDateStatements, 
  onEditStatement 
}) => {
  if (invalidDateStatements.length === 0) {
    return null;
  }

  return (
    <Box className={styles.invalidDateSection}>
      <Typography variant="subtitle1" gutterBottom className={styles.sectionTitle}>
        <Warning fontSize="small" sx={{ mr: 1 }} />
        Statements with Invalid Dates ({invalidDateStatements.length})
      </Typography>
      
      <Box className={styles.invalidDateList}>
        {invalidDateStatements.map((statement, index) => (
          <Box
            key={index}
            className={styles.invalidDateItem}
            onClick={() => onEditStatement(statement)}
          >
            <Box className={styles.invalidDateHeader}>
              <Typography variant="body2" className={styles.filename}>
                {statement.metadata.filename}
              </Typography>
              <Box className={styles.statusIndicators}>
                {statement.metadata.suspicious && (
                  <Error color="error" fontSize="small" />
                )}
                {statement.metadata.missingChecks && (
                  <Warning color="warning" fontSize="small" />
                )}
              </Box>
            </Box>
            <Typography variant="caption" className={styles.invalidDateInfo}>
              Date: {statement.key.date || 'null'} | Account: {statement.key.accountNumber}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default InvalidDateStatements;
