import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Slide,
} from '@mui/material';
import {
  Close,
  ChevronLeft,
  ChevronRight,
  Save,
  Undo,
  Redo,
  Warning as WarningIcon,
  ViewSidebar,
  ViewColumn,
} from '@mui/icons-material';
import { StatementSummary } from '../../types/api';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  loadBankStatement,
  saveStatementChanges,
} from '../../redux/features/statementEditor/statementEditorSlice';
import {
  selectCurrentStatement,
  selectCurrentStatementLoading,
  selectCurrentStatementError,
  selectHasUnsavedChanges,
  selectSaveLoading,
  selectSaveError,
} from '../../redux/features/statementEditor/statementEditorSelectors';
import { validateBankStatement, ValidationError } from '../../utils/validation';
import { formatDateForDisplay } from '../../utils/dateUtils';
import { useUndoRedo } from '../../redux/hooks/useUndoRedo';
import StatementDetailsTable from '../StatementDetailsTable';
import PagesTable from '../PagesTable';
import TransactionsTable from '../TransactionsTable';
import NetIncomeCalculation from '../NetIncomeCalculation';
import PdfDisplay from '../PdfDisplay';
import { DocumentClassificationPanel } from '../DocumentClassificationPanel';
import ValidationConfirmationDialog from '../ValidationConfirmationDialog';
import SuspiciousReasonsDisplay from '../SuspiciousReasonsDisplay';
import StatementCarousel from './StatementCarousel';
import styles from '../../styles/components/StatementEditorModal.module.css';

interface StatementEditorModalProps {
  open: boolean;
  onClose: () => void;
  statementId: string | null;
  clientId: string;
  carouselStatements: StatementSummary[];
  onNavigate: (statementId: string) => void;
}

const StatementEditorModal: React.FC<StatementEditorModalProps> = ({
  open,
  onClose,
  statementId,
  clientId,
  carouselStatements,
  onNavigate,
}) => {
  const dispatch = useAppDispatch();
  const statement = useAppSelector(selectCurrentStatement);
  const loading = useAppSelector(selectCurrentStatementLoading);
  const error = useAppSelector(selectCurrentStatementError);
  const hasUnsavedChanges = useAppSelector(selectHasUnsavedChanges);
  const saveLoading = useAppSelector(selectSaveLoading);
  const saveError = useAppSelector(selectSaveError);
  const { canUndo, canRedo, undo, redo } = useUndoRedo();

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'side-by-side' | 'stacked'>('side-by-side');

  useEffect(() => {
    if (open && statementId) {
      dispatch(loadBankStatement({ statementId }));
    }
  }, [open, statementId, dispatch]);

  useEffect(() => {
    if (statement && !hasUnsavedChanges) {
      setValidationErrors([]);
    }
  }, [statement, hasUnsavedChanges]);

  const isCreditCard = statement?.pageMetadata.classification?.includes(' CC') || false;

  const carouselIndex = carouselStatements.findIndex(
    s => s.statementDetails.statementId === statementId
  );
  const isInCarousel = carouselIndex !== -1;
  const prevId = isInCarousel && carouselIndex > 0
    ? carouselStatements[carouselIndex - 1].statementDetails.statementId
    : null;
  const nextId = isInCarousel && carouselIndex < carouselStatements.length - 1
    ? carouselStatements[carouselIndex + 1].statementDetails.statementId
    : null;

  const handleSave = async () => {
    if (!statement) return;
    const validationResult = validateBankStatement(statement);
    if (!validationResult.isValid) {
      setValidationErrors(validationResult.errors);
      setShowValidationDialog(true);
      return;
    }
    await performSave();
  };

  const performSave = async () => {
    if (!statement) return;
    try {
      await dispatch(saveStatementChanges()).unwrap();
      setValidationErrors([]);
      setShowValidationDialog(false);
      const currentIndex = carouselStatements.findIndex(
        s => s.statementDetails.statementId === statementId
      );
      if (currentIndex !== -1) {
        const nextSuspicious = carouselStatements
          .slice(currentIndex + 1)
          .find(s => (s.suspiciousReasons?.length ?? 0) > 0);
        if (nextSuspicious) {
          onNavigate(nextSuspicious.statementDetails.statementId);
        }
      }
    } catch {
      setShowValidationDialog(false);
    }
  };

  const title = statement
    ? `${statement.pageMetadata.classification}-${statement.accountNumber}: ${formatDateForDisplay(statement.date)}`
    : 'Loading...';

  const handleNavigate = (id: string) => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Navigate away and lose them?')) return;
    }
    onNavigate(id);
  };

  if (!open) return null;

  return (
    <Box className={styles.overlay}>
      {/* Top bar */}
      <Box className={styles.topBar}>
        <Box className={styles.topBarLeft}>
          <IconButton onClick={onClose} size="small" title="Close">
            <Close />
          </IconButton>
          <Button
            variant="contained"
            size="small"
            startIcon={saveLoading ? <CircularProgress size={14} color="inherit" /> : <Save />}
            onClick={handleSave}
            disabled={!hasUnsavedChanges || saveLoading}
          >
            Save
          </Button>
          <IconButton size="small" onClick={undo} disabled={!canUndo} title="Undo">
            <Undo fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={redo} disabled={!canRedo} title="Redo">
            <Redo fontSize="small" />
          </IconButton>
          {hasUnsavedChanges && (
            <Chip label="Unsaved changes" color="warning" size="small" icon={<WarningIcon />} />
          )}
          {saveError && (
            <Typography variant="caption" color="error">{saveError}</Typography>
          )}
        </Box>

        <Box className={styles.topBarCenter}>
          <Typography variant="subtitle1" fontWeight={500} noWrap>
            {title}
          </Typography>
        </Box>

        <Box className={styles.topBarRight}>
          {isInCarousel && (
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              {carouselIndex + 1} / {carouselStatements.length}
            </Typography>
          )}
          <IconButton
            size="small"
            onClick={() => prevId && handleNavigate(prevId)}
            disabled={!prevId}
            title="Previous statement"
          >
            <ChevronLeft />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => nextId && handleNavigate(nextId)}
            disabled={!nextId}
            title="Next statement"
          >
            <ChevronRight />
          </IconButton>
        </Box>
      </Box>

      {/* Carousel */}
      <StatementCarousel
        statements={carouselStatements}
        currentStatementId={statementId}
        onNavigate={handleNavigate}
        onEditStatement={(s, openInNewTab) => {
          if (openInNewTab) {
            const params = new URLSearchParams({ statementId: s.statementDetails.statementId });
            if (clientId) params.set('clientId', clientId);
            window.open(`/edit?${params.toString()}`, '_blank');
          } else {
            handleNavigate(s.statementDetails.statementId);
          }
        }}
        showNotInFilterMessage={!isInCarousel && !!statementId}
      />

      {/* Content */}
      <Box className={styles.content}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, gap: 2 }}>
            <CircularProgress />
            <Typography color="text.secondary">Loading statement...</Typography>
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : statement ? (
          <>
            <Slide direction="down" in={hasUnsavedChanges} mountOnEnter unmountOnExit>
              <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
                You have unsaved changes. Don't forget to save!
              </Alert>
            </Slide>

            <SuspiciousReasonsDisplay statement={statement} />

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Card elevation={2}>
                  <CardHeader title="Statement Details" titleTypographyProps={{ variant: 'h6' }} />
                  <CardContent>
                    <StatementDetailsTable statement={statement} />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card elevation={2}>
                  <CardHeader title="Net Income Calculation" titleTypographyProps={{ variant: 'h6' }} />
                  <CardContent>
                    <NetIncomeCalculation statement={statement} isCreditCard={isCreditCard} />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card elevation={2}>
                  <CardHeader title="Pages Used" titleTypographyProps={{ variant: 'h6' }} />
                  <CardContent>
                    <PagesTable statement={statement} />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>Layout:</Typography>
              <ToggleButtonGroup
                value={layoutMode}
                exclusive
                onChange={(_e, val) => val && setLayoutMode(val)}
                size="small"
              >
                <ToggleButton value="side-by-side">
                  <ViewSidebar sx={{ mr: 1 }} /> Side by Side
                </ToggleButton>
                <ToggleButton value="stacked">
                  <ViewColumn sx={{ mr: 1 }} /> Stacked
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {layoutMode === 'side-by-side' ? (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Card elevation={2}>
                    <CardHeader title="Transactions" titleTypographyProps={{ variant: 'h6' }} />
                    <CardContent>
                      <TransactionsTable statement={statement} isCreditCard={isCreditCard} isSideBySide={true} />
                    </CardContent>
                  </Card>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Card elevation={2}>
                    <CardHeader title="Document Viewer" titleTypographyProps={{ variant: 'h6' }} />
                    <CardContent>
                      <PdfDisplay fileId={statement.fileId} pages={statement.pageMetadata.pages} />
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card elevation={2}>
                    <CardHeader title="Transactions" titleTypographyProps={{ variant: 'h6' }} />
                    <CardContent>
                      <TransactionsTable statement={statement} isCreditCard={isCreditCard} />
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card elevation={2}>
                    <CardHeader title="Document Viewer" titleTypographyProps={{ variant: 'h6' }} />
                    <CardContent>
                      <PdfDisplay fileId={statement.fileId} pages={statement.pageMetadata.pages} />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            <Box sx={{ mt: 4 }}>
              <DocumentClassificationPanel fileId={statement.fileId} clientId={clientId} />
            </Box>
          </>
        ) : null}
      </Box>

      <ValidationConfirmationDialog
        open={showValidationDialog}
        onClose={() => setShowValidationDialog(false)}
        onConfirm={() => { setShowValidationDialog(false); performSave(); }}
        errors={validationErrors}
      />
    </Box>
  );
};

export default StatementEditorModal;
