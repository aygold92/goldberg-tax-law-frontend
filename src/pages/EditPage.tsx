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
import { COLORS } from '../styles/constants';
import styles from '../styles/components/EditPage.module.css';
import { useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { 
  loadBankStatement, 
  saveStatementChanges,
} from '../redux/features/statementEditor/statementEditorSlice';
import {
  selectCurrentStatement,
  selectCurrentStatementLoading,
  selectCurrentStatementError,
  selectHasUnsavedChanges,
  selectSaveLoading,
  selectSaveError,
} from '../redux/features/statementEditor/statementEditorSelectors';
import { validateBankStatement, ValidationError } from '../utils/validation';
import { usePageTitle } from '../hooks/usePageTitle';

// Import the components
import EditPageHeader from '../components/EditPageHeader';
import SuspiciousReasonsDisplay from '../components/SuspiciousReasonsDisplay';
import StatementDetailsTable from '../components/StatementDetailsTable';
import PagesTable from '../components/PagesTable';
import TransactionsTable from '../components/TransactionsTable';
import NetIncomeCalculation from '../components/NetIncomeCalculation';
import PdfDisplay from '../components/PdfDisplay';
import { DocumentClassificationEditor } from '../components/DocumentClassificationEditor';
import { AnalyzePagesSelector } from '../components/AnalyzePagesSelector';
import { FileMetadataEditor } from '../components/FileMetadataEditor';
import ValidationConfirmationDialog from '../components/ValidationConfirmationDialog';

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
  const filenameWithPages = query.get('filenameWithPages') || undefined;

  const statement = useAppSelector(selectCurrentStatement);
  const loading = useAppSelector(selectCurrentStatementLoading);
  const error = useAppSelector(selectCurrentStatementError);
  const hasUnsavedChanges = useAppSelector(selectHasUnsavedChanges);
  const saveLoading = useAppSelector(selectSaveLoading);
  const saveError = useAppSelector(selectSaveError);
  const { setPageTitle } = usePageTitle();

  // Set dynamic page title based on statement data
  useEffect(() => {
    if (statement) {
      const title = `Edit ${statement.pageMetadata.classification}-${statement.accountNumber}: ${statement.date}`;
      setPageTitle(title);
    } else if (clientName && accountNumber && classification && date) {
      setPageTitle(`Edit ${classification}-${accountNumber}: ${date}`);
    } else {
      setPageTitle('Edit Statement');
    }
  }, [statement, clientName, accountNumber, classification, date, setPageTitle]);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  
  // Layout state
  const [layoutMode, setLayoutMode] = useState<'side-by-side' | 'stacked'>('side-by-side');

  // Load statement data
  useEffect(() => {
    if (clientName && accountNumber && classification && date) {
      console.log('Loading statement with params:', { clientName, accountNumber, classification, date, filenameWithPages });
      dispatch(loadBankStatement({ clientName, accountNumber, classification, date, filenameWithPages }));
    }
  }, [clientName, accountNumber, classification, date, filenameWithPages, dispatch]);

  // Clear validation errors when statement is initially loaded
  useEffect(() => {
    if (statement && !hasUnsavedChanges) {
      setValidationErrors([]);
      setShowValidationAlert(false);
    }
  }, [statement, hasUnsavedChanges]);

  // --- Determine Statement Type ---
  const isCreditCard = statement?.pageMetadata.classification?.includes(' CC') || false;

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
      // Show confirmation dialog instead of blocking
      setValidationErrors(validationResult.errors);
      setShowValidationDialog(true);
      return;
    }

    // No validation errors, proceed with save
    await performSave();
  };

  // --- Perform Save ---
  const performSave = async () => {
    if (!statement) return;

    try {
      await dispatch(saveStatementChanges({ 
        clientName, 
        accountNumber, 
        classification, 
        date 
      })).unwrap();
      setValidationErrors([]);
      setShowValidationAlert(false);
      setShowValidationDialog(false);
    } catch (error) {
      console.error('Save error:', error);
      setShowValidationDialog(false);
    }
  };

  // --- Handle Validation Dialog Confirm ---
  const handleValidationDialogConfirm = () => {
    setShowValidationDialog(false);
    performSave();
  };

  // --- Handle Validation Dialog Cancel ---
  const handleValidationDialogCancel = () => {
    setShowValidationDialog(false);
  };

  if (loading) {
    return (
      <Box className={styles.loadingContainer}>
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          Loading statement data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className={styles.errorContainer}>
        <Alert 
          severity="error" 
          icon={<ErrorIcon />}
          className={styles.errorAlert}
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
      <Box className={styles.errorContainer}>
        <Alert 
          severity="info"
          className={styles.infoAlert}
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
      <Box className={styles.pageContainer}>
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
              className={styles.warningAlert}
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
        <Grid container spacing={3} className={styles.overviewGrid}>
          <Grid item xs={12} md={4}>
            <Card elevation={2} className={styles.overviewCard}>
              <CardHeader 
                title="Statement Details"
                titleTypographyProps={{ variant: 'h6' }}
                className={styles.cardHeader}
              />
              <CardContent className={styles.cardContent}>
                <StatementDetailsTable statement={statement} />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card elevation={2} className={styles.overviewCard}>
              <CardHeader 
                title="Net Income Calculation"
                titleTypographyProps={{ variant: 'h6' }}
                className={styles.cardHeader}
              />
              <CardContent className={styles.cardContent}>
                <NetIncomeCalculation
                  statement={statement}
                  isCreditCard={isCreditCard}
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card elevation={2} className={styles.overviewCard}>
              <CardHeader 
                title="Pages Used"
                titleTypographyProps={{ variant: 'h6' }}
                className={styles.cardHeader}
              />
              <CardContent className={styles.cardContent}>
                <PagesTable statement={statement} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Layout Toggle */}
        <Box className={styles.layoutToggle}>
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
          <Box className={styles.sideBySideContainer}>
            {/* Transactions Table */}
            <Box className={styles.transactionsContainer}>
              <Card elevation={2} className={styles.transactionsCard}>
                <CardHeader 
                  title="Transactions"
                  titleTypographyProps={{ variant: 'h6' }}
                  className={styles.cardHeader}
                />
                <CardContent className={styles.transactionsCardContent}>
                  <TransactionsTable
                    statement={statement}
                    isCreditCard={isCreditCard}
                    isSideBySide={true}
                  />
                </CardContent>
              </Card>
            </Box>
            
            {/* PDF Display */}
            <Box className={styles.pdfContainer}>
              <Card elevation={2} className={styles.pdfCard}>
                <CardHeader 
                  title="Document Viewer"
                  titleTypographyProps={{ variant: 'h6' }}
                  className={styles.cardHeader}
                />
                <CardContent className={styles.pdfCardContent}>
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
          <Grid container spacing={3} className={styles.stackedGrid}>
            <Grid item xs={12}>
              <Card elevation={2} className={styles.stackedCard}>
                <CardHeader 
                  title="Transactions"
                  titleTypographyProps={{ variant: 'h6' }}
                  className={styles.cardHeader}
                />
                <CardContent className={styles.stackedCardContent}>
                  <TransactionsTable
                    statement={statement}
                    isCreditCard={isCreditCard}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card elevation={2} className={styles.stackedCard}>
                <CardHeader 
                  title="Document Viewer"
                  titleTypographyProps={{ variant: 'h6' }}
                  className={styles.cardHeader}
                />
                <CardContent className={styles.stackedCardContent}>
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

        {/* Validation Confirmation Dialog */}
        <ValidationConfirmationDialog
          open={showValidationDialog}
          onClose={handleValidationDialogCancel}
          onConfirm={handleValidationDialogConfirm}
          errors={validationErrors}
        />

        {/* Validation Alert (kept for backwards compatibility if needed) */}
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
            className={styles.validationAlert}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              Validation Errors
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {validationErrors.map((error, index) => (
                <Typography key={index} component="li" variant="body2" sx={{ mb: 0.5 }}>
                  {error.message}
                </Typography>
              ))}
            </Box>
          </Alert>
        </Snackbar>

        {/* Document Classification Editor */}
        <Box sx={{ mt: 4 }}>
          <DocumentClassificationEditor
            clientName={clientName}
            filename={statement.pageMetadata.filename}
            defaultClassification={statement.pageMetadata.classification}
          />
        </Box>

        {/* Analyze Pages Selector */}
        <Box sx={{ mt: 4 }}>
          <AnalyzePagesSelector
            clientName={clientName}
            filename={statement.pageMetadata.filename}
          />
        </Box>

        {/* File Metadata Editor */}
        <Box sx={{ mt: 4 }}>
          <FileMetadataEditor
            clientName={clientName}
            filename={statement.pageMetadata.filename}
          />
        </Box>
      </Box>
    </Fade>
  );
};

export default EditPage; 