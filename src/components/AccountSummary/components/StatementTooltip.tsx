/**
 * Component for rendering detailed statement information in tooltips.
 * Shows statement metadata including transactions, spending, income, and issues.
 */

import React from 'react';
import { Box, Typography, IconButton, Snackbar, Alert } from '@mui/material';
import { Error, Warning, Delete } from '@mui/icons-material';
import { BankStatementMetadata } from '../../../types/api';
import { constructFilenameWithPages } from '../../../utils/filenameUtils';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { selectSelectedClient } from '../../../redux/features/client/clientSelectors';
import { deleteStatements } from '../../../redux/features/statementsList/statementsListSlice';
import { useSnackbar } from '../../DocumentClassificationEditor/hooks/useSnackbar';
import styles from '../AccountSummary.module.css';

interface StatementTooltipProps {
  statement: BankStatementMetadata;
}

const StatementTooltip: React.FC<StatementTooltipProps> = ({ statement }) => {
  const dispatch = useAppDispatch();
  const selectedClient = useAppSelector(selectSelectedClient);
  const { showSnackbar, snackbarOpen, snackbarMessage, snackbarSeverity, closeSnackbar } = useSnackbar();
  
  const spending = statement.metadata.totalSpending || 0;
  const income = statement.metadata.totalIncomeCredits || 0;
  const transactions = statement.metadata.numTransactions || 0;
  
  // Generate filename with page range
  const filenameWithPages = constructFilenameWithPages(statement.metadata.filename, statement.metadata.pageRange);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await dispatch(deleteStatements({ 
        clientName: selectedClient, 
        statements: [statement] 
      })).unwrap();
      
      showSnackbar('Statement deleted successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to delete statement', 'error');
    }
  };

  return (
    <Box className={styles.tooltipContent}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" className={styles.tooltipTitle}>
          {filenameWithPages}
        </Typography>
        <IconButton
          size="small"
          onClick={handleDelete}
          sx={{ 
            color: '#d32f2f',
            '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.1)' }
          }}
        >
          <Delete fontSize="small" />
        </IconButton>
      </Box>
      
      <Box className={styles.tooltipDetails}>
        <Box className={styles.tooltipRow}>
          <Typography variant="caption" className={styles.tooltipLabel}>
            Date:
          </Typography>
          <Typography variant="caption" className={styles.tooltipValue}>
            {statement.key.date || 'null'}
          </Typography>
        </Box>
        
        <Box className={styles.tooltipRow}>
          <Typography variant="caption" className={styles.tooltipLabel}>
            Transactions:
          </Typography>
          <Typography variant="caption" className={styles.tooltipValue}>
            {transactions}
          </Typography>
        </Box>
        
        <Box className={styles.tooltipRow}>
          <Typography variant="caption" className={styles.tooltipLabel}>
            Spending:
          </Typography>
          <Typography variant="caption" className={styles.tooltipValue}>
            ${spending.toLocaleString()}
          </Typography>
        </Box>
        
        <Box className={styles.tooltipRow}>
          <Typography variant="caption" className={styles.tooltipLabel}>
            Income:
          </Typography>
          <Typography variant="caption" className={styles.tooltipValue}>
            ${income.toLocaleString()}
          </Typography>
        </Box>
        
        {(statement.metadata.suspicious || statement.metadata.missingChecks) && (
          <Box className={styles.tooltipIssues}>
            {statement.metadata.suspicious && (
              <Box className={styles.tooltipRow}>
                <Error color="error" fontSize="small" />
                <Typography variant="caption" className={styles.tooltipIssue}>
                  Suspicious statement
                </Typography>
              </Box>
            )}
            {statement.metadata.missingChecks && (
              <Box className={styles.tooltipRow}>
                <Warning color="warning" fontSize="small" />
                <Typography variant="caption" className={styles.tooltipIssue}>
                  Missing checks
                </Typography>
              </Box>
            )}
          </Box>
        )}
        
        <Typography variant="caption" className={styles.tooltipClickHint}>
          Click to edit statement
        </Typography>
      </Box>
      
      {/* Snackbar notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={closeSnackbar} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StatementTooltip;
