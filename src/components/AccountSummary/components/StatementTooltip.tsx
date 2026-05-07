import React from 'react';
import { Box, Typography, IconButton, Snackbar, Alert } from '@mui/material';
import { Error, Warning, Delete } from '@mui/icons-material';
import { StatementSummary } from '../../../types/api';
import { useAppDispatch } from '../../../redux/hooks';
import { deleteStatements } from '../../../redux/features/statementsList/statementsListSlice';
import { useSnackbar } from '../../DocumentClassificationEditor/hooks/useSnackbar';
import styles from '../AccountSummary.module.css';

interface StatementTooltipProps {
  statement: StatementSummary;
}

const StatementTooltip: React.FC<StatementTooltipProps> = ({ statement }) => {
  const dispatch = useAppDispatch();
  const { showSnackbar, snackbarOpen, snackbarMessage, snackbarSeverity, closeSnackbar } = useSnackbar();

  const spending = Math.abs(statement.totalSpending || 0);
  const income = statement.totalIncomeCredits || 0;
  const transactions = statement.numTransactions || 0;
  const suspicious = (statement.suspiciousReasons?.length ?? 0) > 0;
  const filename = statement.classification.inputFile.info.fileName;
  const date = statement.statementDetails.date ?? 'null';

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await dispatch(deleteStatements({
        statementIds: [statement.statementDetails.statementId],
      })).unwrap();
      showSnackbar('Statement deleted successfully', 'success');
    } catch {
      showSnackbar('Failed to delete statement', 'error');
    }
  };

  return (
    <Box className={styles.tooltipContent}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" className={styles.tooltipTitle}>
          {filename}
        </Typography>
        <IconButton
          size="small"
          onClick={handleDelete}
          sx={{ color: '#d32f2f', '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.1)' } }}
        >
          <Delete fontSize="small" />
        </IconButton>
      </Box>

      <Box className={styles.tooltipDetails}>
        <Box className={styles.tooltipRow}>
          <Typography variant="caption" className={styles.tooltipLabel}>Date:</Typography>
          <Typography variant="caption" className={styles.tooltipValue}>{date}</Typography>
        </Box>
        <Box className={styles.tooltipRow}>
          <Typography variant="caption" className={styles.tooltipLabel}>Transactions:</Typography>
          <Typography variant="caption" className={styles.tooltipValue}>{transactions}</Typography>
        </Box>
        <Box className={styles.tooltipRow}>
          <Typography variant="caption" className={styles.tooltipLabel}>Spending:</Typography>
          <Typography variant="caption" className={styles.tooltipValue}>${spending.toLocaleString()}</Typography>
        </Box>
        <Box className={styles.tooltipRow}>
          <Typography variant="caption" className={styles.tooltipLabel}>Income:</Typography>
          <Typography variant="caption" className={styles.tooltipValue}>${income.toLocaleString()}</Typography>
        </Box>

        {(suspicious || statement.missingChecks.length > 0 || transactions === 0) && (
          <Box className={styles.tooltipIssues}>
            {suspicious && (
              <Box className={styles.tooltipRow}>
                <Error color="error" fontSize="small" />
                <Typography variant="caption" className={styles.tooltipIssue}>Suspicious statement</Typography>
              </Box>
            )}
            {statement.missingChecks.length > 0 && (
              <Box className={styles.tooltipRow}>
                <Warning color="warning" fontSize="small" />
                <Typography variant="caption" className={styles.tooltipIssue}>Missing checks</Typography>
              </Box>
            )}
            {transactions === 0 && (
              <Box className={styles.tooltipRow}>
                <Warning color="warning" fontSize="small" />
                <Typography variant="caption" className={styles.tooltipIssue}>No transactions</Typography>
              </Box>
            )}
          </Box>
        )}

        <Typography variant="caption" className={styles.tooltipClickHint}>Click to edit statement</Typography>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StatementTooltip;
