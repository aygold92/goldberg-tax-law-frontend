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
import { 
  Box, 
  Alert, 
  CircularProgress, 
  Snackbar, 
  Typography, 
  ToggleButton, 
  ToggleButtonGroup, 
  Grid,
  Card,
  CardContent,
  CardHeader,
  Fade,
  Slide
} from '@mui/material';
import { 
  ViewSidebar, 
  ViewColumn, 
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
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
    if (!statement) return;

    // Validate before saving
    const validationResult = validateBankStatement(statement);
    if (!validationResult.isValid) {
      setValidationErrors(validationResult.errors.map(error => error.message));
      setShowValidationAlert(true);
      return;
    }

    try {
      await dispatch(saveStatementChanges({ 
        clientName, 
        accountNumber, 
        classification, 
        date 
      })).unwrap();
      setValidationErrors([]);
      setShowValidationAlert(false);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: 'calc(100vh - 200px)',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          Loading statement data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          icon={<ErrorIcon />}
          sx={{ 
            borderRadius: 2,
            backgroundColor: '#fef2f2',
            border: '1px solid #f87171',
            color: '#991b1b'
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            Error Loading Statement
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (!statement) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="info"
          sx={{ 
            borderRadius: 2,
            backgroundColor: '#eff6ff',
            border: '1px solid #93c5fd',
            color: '#1e40af'
          }}
        >
          <Typography variant="body2">
            No statement data available. Please select a statement to edit.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Fade in={true} timeout={300}>
      <Box sx={{ height: '100%' }}>
        {/* Header */}
        <EditPageHeader
          statement={statement}
          hasUnsavedChanges={hasUnsavedChanges}
          saveLoading={saveLoading}
          saveError={saveError}
          onSave={handleSave}
        />

        {/* Status Alerts */}
        <Slide direction="down" in={hasUnsavedChanges} mountOnEnter unmountOnExit>
          <Box sx={{ mb: 3 }}>
            <Alert 
              severity="warning" 
              icon={<WarningIcon />}
              sx={{ 
                borderRadius: 2,
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                color: '#92400e',
                '& .MuiAlert-icon': {
                  color: '#f59e0b'
                }
              }}
            >
              <Typography variant="body2" fontWeight={500}>
                You have unsaved changes. Don't forget to save your work!
              </Typography>
            </Alert>
          </Box>
        </Slide>

        {/* Suspicious Reasons */}
        <SuspiciousReasonsDisplay statement={statement} />

        {/* Statement Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card elevation={2} sx={{ height: '100%', transition: 'all 0.2s ease-in-out' }}>
              <CardHeader 
                title="Statement Details"
                titleTypographyProps={{ variant: 'h6' }}
                sx={{ pb: 1 }}
              />
              <CardContent sx={{ pt: 0 }}>
                <StatementDetailsTable statement={statement} />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card elevation={2} sx={{ height: '100%', transition: 'all 0.2s ease-in-out' }}>
              <CardHeader 
                title="Net Income Calculation"
                titleTypographyProps={{ variant: 'h6' }}
                sx={{ pb: 1 }}
              />
              <CardContent sx={{ pt: 0 }}>
                <NetIncomeCalculation
                  statement={statement}
                  isCreditCard={isCreditCard}
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card elevation={2} sx={{ height: '100%', transition: 'all 0.2s ease-in-out' }}>
              <CardHeader 
                title="Pages Used"
                titleTypographyProps={{ variant: 'h6' }}
                sx={{ pb: 1 }}
              />
              <CardContent sx={{ pt: 0 }}>
                <PagesTable statement={statement} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Layout Toggle */}
        <Box sx={{ 
          mb: 3, 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2
        }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Layout:
          </Typography>
          <ToggleButtonGroup
            value={layoutMode}
            exclusive
            onChange={handleLayoutChange}
            aria-label="layout mode"
            size="small"
          >
            <ToggleButton value="side-by-side" aria-label="side by side">
              <ViewSidebar sx={{ mr: 1 }} />
              Side by Side
            </ToggleButton>
            <ToggleButton value="stacked" aria-label="stacked">
              <ViewColumn sx={{ mr: 1 }} />
              Stacked
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Main Content Area */}
        {layoutMode === 'side-by-side' ? (
          <Box sx={{ 
            // height: 'calc(100vh - 400px)', 
            display: 'flex', 
            flexDirection: 'row', 
            gap: 3,
            minHeight: '1200px',
            overflow: 'auto' // Allow horizontal scrolling for wide PDF
          }}>
            {/* Transactions Table */}
            <Box sx={{ width: 'auto', minWidth: '800px', display: 'flex', flexDirection: 'column' }}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader 
                  title="Transactions"
                  titleTypographyProps={{ variant: 'h6' }}
                  sx={{ pb: 1 }}
                />
                <CardContent sx={{ pt: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <TransactionsTable
                    statement={statement}
                    isCreditCard={isCreditCard}
                    isSideBySide={true}
                  />
                </CardContent>
              </Card>
            </Box>
            
            {/* PDF Display */}
            <Box sx={{ minWidth: '1024px', minHeight: '1000px', display: 'flex', flexDirection: 'column' }}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader 
                  title="Document Viewer"
                  titleTypographyProps={{ variant: 'h6' }}
                  sx={{ pb: 1 }}
                />
                <CardContent sx={{ pt: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <PdfDisplay
                    statement={statement}
                    clientName={clientName}
                    accountNumber={accountNumber}
                    classification={classification}
                    date={date}
                  />
                </CardContent>
              </Card>
            </Box>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card elevation={2} sx={{ display: 'flex', flexDirection: 'column', minHeight: '1000px' }}>
                <CardHeader 
                  title="Transactions"
                  titleTypographyProps={{ variant: 'h6' }}
                  sx={{ pb: 1 }}
                />
                <CardContent sx={{ pt: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <TransactionsTable
                    statement={statement}
                    isCreditCard={isCreditCard}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card elevation={2} sx={{ display: 'flex', flexDirection: 'column', minHeight: '1000px' }}>
                <CardHeader 
                  title="Document Viewer"
                  titleTypographyProps={{ variant: 'h6' }}
                  sx={{ pb: 1 }}
                />
                <CardContent sx={{ pt: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <PdfDisplay
                    statement={statement}
                    clientName={clientName}
                    accountNumber={accountNumber}
                    classification={classification}
                    date={date}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Validation Alert */}
        <Snackbar
          open={showValidationAlert}
          autoHideDuration={8000}
          onClose={() => setShowValidationAlert(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity="error" 
            onClose={() => setShowValidationAlert(false)}
            icon={<ErrorIcon />}
            sx={{ 
              borderRadius: 2,
              backgroundColor: '#fef2f2',
              border: '1px solid #f87171',
              color: '#991b1b',
              minWidth: '400px'
            }}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              Validation Errors
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {validationErrors.map((error, index) => (
                <Typography key={index} component="li" variant="body2" sx={{ mb: 0.5 }}>
                  {error}
                </Typography>
              ))}
            </Box>
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
};

export default EditPage; 