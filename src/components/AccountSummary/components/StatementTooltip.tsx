import React, { useState } from 'react';
import { Box, Typography, IconButton, Snackbar, Alert } from '@mui/material';
import { Error, Warning, Delete, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { StatementSummary } from '../../../types/api';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { deleteStatements } from '../../../redux/features/statementsList/statementsListSlice';
import { useSnackbar } from '../../DocumentClassificationEditor/hooks/useSnackbar';
import styles from '../AccountSummary.module.css';
import { formatDateForDisplay } from '../../../utils/dateUtils';

interface StatementTooltipProps {
  statements: StatementSummary[];
}

const StatementTooltip: React.FC<StatementTooltipProps> = ({ statements }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const dispatch = useAppDispatch();
  const selectedClientId = useAppSelector(state => state.client.selectedClient?.clientId);
  const { showSnackbar, snackbarOpen, snackbarMessage, snackbarSeverity, closeSnackbar } = useSnackbar();

  const statement = statements[currentIndex];
  const isMultiple = statements.length > 1;

  const spending = Math.abs(statement.totalSpending || 0);
  const income = statement.totalIncomeCredits || 0;
  const transactions = statement.numTransactions || 0;
  const suspicious = (statement.suspiciousReasons?.length ?? 0) > 0;
  const filename = statement.classification.inputFile.info.fileName;
  const date = formatDateForDisplay(statement.statementDetails.date) || 'null';
  const pages = statement.classification.info.pages;
  const pageRange = pages.length > 0
    ? (pages.length === 1 ? `[${pages[0]}]` : `[${pages[0]}-${pages[pages.length - 1]}]`)
    : '';
  const statementId = statement.statementDetails.statementId;

  const editHref = `/edit?statementId=${statement.statementDetails.statementId}${selectedClientId ? `&clientId=${selectedClientId}` : ''}`;

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
      {isMultiple && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => i - 1); }}
            disabled={currentIndex === 0}
            sx={{ p: 0.25 }}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {statements.map((_, i) => (
              <Box
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  backgroundColor: i === currentIndex ? 'primary.main' : 'grey.400',
                  transition: 'background-color 0.15s',
                }}
              />
            ))}
          </Box>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => i + 1); }}
            disabled={currentIndex === statements.length - 1}
            sx={{ p: 0.25 }}
          >
            <ChevronRight fontSize="small" />
          </IconButton>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box>
          <Typography variant="subtitle2" className={styles.tooltipTitle}>
            {filename}{pageRange && ` ${pageRange}`}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>
            {statementId}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={handleDelete}
          sx={{ color: '#d32f2f', '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.1)' }, flexShrink: 0 }}
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
            {suspicious && statement.suspiciousReasons.map((reason, i) => (
              <Box key={i} className={styles.tooltipRow}>
                <Error color="error" fontSize="small" />
                <Typography variant="caption" className={styles.tooltipIssue}>{reason}</Typography>
              </Box>
            ))}
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

        <Typography
          variant="caption"
          className={styles.tooltipClickHint}
          component="a"
          href={editHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          sx={{ cursor: 'pointer', color: 'primary.main', textDecoration: 'underline' }}
        >
          Click to edit statement
        </Typography>
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
