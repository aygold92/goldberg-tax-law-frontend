import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { Error, Warning, CheckCircle } from '@mui/icons-material';
import { StatementSummary } from '../../../types/api';
import { MonthBlock as MonthBlockType } from '../types/accountSummary';
import StatementTooltip from './StatementTooltip';
import styles from '../AccountSummary.module.css';

interface MonthBlockProps {
  monthBlock: MonthBlockType;
  onEditStatement: (statement: StatementSummary) => void;
}

const MonthBlock: React.FC<MonthBlockProps> = ({ monthBlock, onEditStatement }) => {
  const getTooltipContent = () => {
    if (monthBlock.hasStatement && monthBlock.statements.length > 0) {
      return <StatementTooltip statements={monthBlock.statements} />;
    } else if (monthBlock.isMissing) {
      return `${monthBlock.monthName}: Missing statement`;
    } else {
      return `${monthBlock.monthName}: No statement expected`;
    }
  };

  return (
    <Tooltip
      title={getTooltipContent()}
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
            '& .MuiTooltip-arrow': {
              color: 'rgba(255, 255, 255, 0.95)',
            },
          },
        },
      }}
    >
      <Box
        className={`${styles.monthBlock} ${
          monthBlock.hasStatement
            ? styles.hasStatement
            : monthBlock.isMissing
              ? styles.isMissing
              : styles.isNeutral
        } ${monthBlock.hasStatement && !monthBlock.hasMultipleStatements ? styles.clickable : ''}`}
        onClick={
          monthBlock.hasStatement && !monthBlock.hasMultipleStatements
            ? () => onEditStatement(monthBlock.statement!)
            : undefined
        }
      >
        <Typography variant="caption" className={styles.monthName}>
          {monthBlock.monthName}
        </Typography>
        {monthBlock.hasStatement && (
          <>
            <Typography variant="caption" className={styles.statementDate}>
              {monthBlock.hasMultipleStatements
                ? `${monthBlock.statements.length} statements`
                : monthBlock.statementDate}
            </Typography>
            <Box className={styles.statusIndicators}>
              {monthBlock.isSuspicious && (
                <Error color="error" fontSize="small" />
              )}
              {monthBlock.hasMissingChecks && (
                <Warning color="warning" fontSize="small" />
              )}
              {monthBlock.hasMultipleStatements && (
                <Warning color="warning" fontSize="small" />
              )}
              {!monthBlock.isSuspicious && !monthBlock.hasMissingChecks && !monthBlock.hasMultipleStatements && (
                <CheckCircle color="success" fontSize="small" />
              )}
            </Box>
          </>
        )}
      </Box>
    </Tooltip>
  );
};

export default MonthBlock;
