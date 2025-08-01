/**
 * Edit Page component for editing bank statement data.
 * 
 * This page provides an Excel-like editing experience for transaction data:
 * - Inline editing capabilities for transaction details
 * - Bulk operations (copy, paste, delete, move)
 * - Data validation and formatting rules
 * - Save changes to backend with conflict resolution
 * - Undo/redo functionality for user actions
 * - Advanced filtering and sorting capabilities
 * 
 * Features include:
 * - Editable statement details and transaction data
 * - Real-time validation and error display
 * - Save changes to backend API
 * - Transaction actions (duplicate, delete, invert, new record)
 * - Copy/paste functionality
 */

import React, { useEffect, useState } from 'react';
import { Box, Alert, CircularProgress, Snackbar, Typography, ToggleButton, ToggleButtonGroup, Grid } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { 
  loadBankStatement, 
  saveStatementChanges,
} from '../redux/features/statements/statementsSlice';
import {
  selectCurrentStatement,
  selectCurrentStatementLoading,
  selectCurrentStatementError,
  selectHasUnsavedChanges,
  selectSaveLoading,
  selectSaveError,
} from '../redux/features/statements/statementsSelectors';
import { validateBankStatement } from '../utils/validation';

// Import the components
import EditPageHeader from '../components/EditPageHeader';
import SuspiciousReasonsDisplay from '../components/SuspiciousReasonsDisplay';
import StatementDetailsTable from '../components/StatementDetailsTable';
import PagesTable from '../components/PagesTable';
import TransactionsTable from '../components/TransactionsTable';
import NetIncomeCalculation from '../components/NetIncomeCalculation';
import PdfDisplay from '../components/PdfDisplay';

// Helper to parse query params
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const EditPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const query = useQuery();
  const clientName = query.get('clientName') || '';
  const accountNumber = query.get('accountNumber') || '';
  const classification = query.get('classification') || '';
  const date = query.get('date') || '';

  const statement = useAppSelector(selectCurrentStatement);
  const loading = useAppSelector(selectCurrentStatementLoading);
  const error = useAppSelector(selectCurrentStatementError);
  const hasUnsavedChanges = useAppSelector(selectHasUnsavedChanges);
  const saveLoading = useAppSelector(selectSaveLoading);
  const saveError = useAppSelector(selectSaveError);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  
  // Layout state
  const [layoutMode, setLayoutMode] = useState<'side-by-side' | 'stacked'>('side-by-side');

  // Load statement data
  useEffect(() => {
    if (clientName && accountNumber && classification && date) {
      console.log('Loading statement with params:', { clientName, accountNumber, classification, date });
      dispatch(loadBankStatement({ clientName, accountNumber, classification, date }));
    }
  }, [clientName, accountNumber, classification, date, dispatch]);

  // Clear validation errors when statement is initially loaded
  useEffect(() => {
    if (statement && !hasUnsavedChanges) {
      setValidationErrors([]);
      setShowValidationAlert(false);
    }
  }, [statement, hasUnsavedChanges]);

  // --- Determine Statement Type ---
  const isCreditCard = statement?.pageMetadata.classification?.endsWith('CC') || false;

  // --- Handle Layout Change ---
  const handleLayoutChange = (
    event: React.MouseEvent<HTMLElement>,
    newLayout: 'side-by-side' | 'stacked' | null,
  ) => {
    if (newLayout !== null) {
      setLayoutMode(newLayout);
    }
  };



  // --- Handle Save ---
  const handleSave = async () => {
    if (statement) {
      const validation = validateBankStatement(statement);
      if (!validation.isValid) {
        setValidationErrors(validation.errors.map(e => e.message));
        setShowValidationAlert(true);
        return;
      }

      try {
        await dispatch(saveStatementChanges({ clientName, accountNumber, classification, date })).unwrap();
        // Clear validation errors on successful save
        setValidationErrors([]);
        setShowValidationAlert(false);
      } catch (error) {
        console.error('Save failed:', error);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <EditPageHeader
        statement={statement}
        clientName={clientName}
        accountNumber={accountNumber}
        date={date}
        hasUnsavedChanges={hasUnsavedChanges}
        saveLoading={saveLoading}
        saveError={saveError}
        onSave={handleSave}
      />

      {/* Suspicious Reasons */}
      <SuspiciousReasonsDisplay statement={statement} />

      {/* Details, Net Income Calculation, and Pages Tables */}
      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid item xs={12} md={4}>
          <StatementDetailsTable statement={statement} />
        </Grid>
        <Grid item xs={12} md={4}>
          <NetIncomeCalculation
            statement={statement}
            isCreditCard={isCreditCard}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <PagesTable statement={statement} />
        </Grid>
      </Grid>

      {/* Layout Toggle */}
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'center' }}>
        <ToggleButtonGroup
          value={layoutMode}
          exclusive
          onChange={handleLayoutChange}
          aria-label="layout mode"
        >
          <ToggleButton value="side-by-side" aria-label="side by side">
            Side by Side
          </ToggleButton>
          <ToggleButton value="stacked" aria-label="stacked">
            Stacked
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Transactions Table and PDF Display */}
      {layoutMode === 'side-by-side' ? (
        <Box sx={{ height: '800px', display: 'flex', flexDirection: 'row', gap: 1 }}>

            <TransactionsTable
              statement={statement}
              isCreditCard={isCreditCard}
              isSideBySide={true}
            />
          
            <PdfDisplay
              statement={statement}
              clientName={clientName}
              accountNumber={accountNumber}
              classification={classification}
              date={date}
            />

        </Box>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TransactionsTable
              statement={statement}
              isCreditCard={isCreditCard}
            />
          </Grid>
          <Grid item xs={12}>
            <PdfDisplay
              statement={statement}
              clientName={clientName}
              accountNumber={accountNumber}
              classification={classification}
              date={date}
            />
          </Grid>
        </Grid>
      )}

      {/* Validation Alert */}
      <Snackbar
        open={showValidationAlert}
        autoHideDuration={6000}
        onClose={() => setShowValidationAlert(false)}
      >
        <Alert severity="error" onClose={() => setShowValidationAlert(false)}>
          <Typography variant="h6">Validation Errors</Typography>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditPage; 