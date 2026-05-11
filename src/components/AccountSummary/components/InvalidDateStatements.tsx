import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { Warning, Error } from '@mui/icons-material';
import { StatementSummary } from '../../../types/api';
import StatementTooltip from './StatementTooltip';
import styles from '../AccountSummary.module.css';

interface InvalidDateStatementsProps {
  invalidDateStatements: StatementSummary[];
  onEditStatement: (statement: StatementSummary, openInNewTab?: boolean) => void;
}

const InvalidDateStatements: React.FC<InvalidDateStatementsProps> = ({
  invalidDateStatements,
  onEditStatement,
}) => {
  if (invalidDateStatements.length === 0) return null;

  return (
    <Box className={styles.invalidDateSection}>
      <Typography variant="subtitle1" gutterBottom className={styles.sectionTitle}>
        <Warning fontSize="small" sx={{ mr: 1 }} />
        Statements with Invalid Dates ({invalidDateStatements.length})
      </Typography>

      <Box className={styles.invalidDateList}>
        {invalidDateStatements.map((statement, index) => {
          const suspicious = (statement.suspiciousReasons?.length ?? 0) > 0;
          const pages = statement.classification.info.pages;
          const pagesText = pages.length > 0 ? `${pages[0]}-${pages[pages.length - 1]}` : '';

          return (
            <Tooltip
              key={index}
              title={<StatementTooltip statements={[statement]} onEditStatement={onEditStatement} />}
              placement="top"
              arrow
              enterDelay={300}
              leaveDelay={100}
              componentsProps={{
                tooltip: {
                  sx: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    color: '#333333',
                    fontSize: '0.75rem',
                    maxWidth: '300px',
                    border: '1px solid #e0e0e0',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    '& .MuiTooltip-arrow': { color: 'rgba(255, 255, 255, 0.95)' },
                  },
                },
              }}
            >
              <Box className={styles.invalidDateItem} onClick={(e) => onEditStatement(statement, e.metaKey || e.ctrlKey)}>
                <Box className={styles.invalidDateHeader}>
                  <Typography variant="body2" className={styles.filename}>
                    {statement.classification.inputFile.info.fileName}
                  </Typography>
                  <Box className={styles.statusIndicators}>
                    {suspicious && <Error color="error" fontSize="small" />}
                    {statement.missingChecks.length > 0 && <Warning color="warning" fontSize="small" />}
                  </Box>
                </Box>
                <Typography variant="caption" className={styles.invalidDateInfo}>
                  Date: {statement.statementDetails.date ?? 'null'} | Account: {statement.statementDetails.accountNumber ?? 'null'} | Pages: {pagesText}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
};

export default InvalidDateStatements;
