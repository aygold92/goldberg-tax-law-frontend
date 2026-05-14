import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowDropDown,
  TableChart,
  Download,
  Google,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  selectIsGoogleSignedIn,
  selectGoogleUser
} from '../redux/features/googleAuth/googleAuthSelectors';
import {
  selectIsAnyLoading,
  selectGoogleSheetsLoading,
  selectGoogleSheetsError,
  selectGoogleSheetsUrl,
  selectDownloadLoading,
  selectDownloadError
} from '../redux/features/csvOutput/csvOutputSelectors';
import {
  createGoogleSheets,
  downloadCsvFiles,
  clearGoogleSheetsResult,
  clearDownloadResult
} from '../redux/features/csvOutput/csvOutputSlice';

interface CsvOutputDropdownProps {
  disabled?: boolean;
}

const CsvOutputDropdown: React.FC<CsvOutputDropdownProps> = ({ disabled = false }) => {
  const dispatch = useAppDispatch();
  const isGoogleSignedIn = useAppSelector(selectIsGoogleSignedIn);
  const googleUser = useAppSelector(selectGoogleUser);
  const isAnyLoading = useAppSelector(selectIsAnyLoading);
  const googleSheetsLoading = useAppSelector(selectGoogleSheetsLoading);
  const googleSheetsError = useAppSelector(selectGoogleSheetsError);
  const googleSheetsUrl = useAppSelector(selectGoogleSheetsUrl);
  const downloadLoading = useAppSelector(selectDownloadLoading);
  const downloadError = useAppSelector(selectDownloadError);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCreateGoogleSheets = async () => {
    handleClose();
    try {
      await dispatch(createGoogleSheets()).unwrap();
    } catch (error) {
      console.error('Failed to create Google Sheets:', error);
    }
  };

  const handleDownloadCsv = async () => {
    handleClose();
    try {
      await dispatch(downloadCsvFiles()).unwrap();
    } catch (error) {
      console.error('Failed to download CSV files:', error);
    }
  };

  const handleOpenGoogleSheets = () => {
    if (googleSheetsUrl) {
      window.open(googleSheetsUrl, '_blank');
    }
  };

  const canCreateGoogleSheets = isGoogleSignedIn && !isAnyLoading;
  const canDownloadCsv = !isAnyLoading;

  return (
    <Box>
      <Button
        variant="contained"
        endIcon={<ArrowDropDown />}
        onClick={handleClick}
        disabled={disabled || isAnyLoading}
        startIcon={isAnyLoading ? <CircularProgress size={16} /> : <TableChart />}
        sx={{ minWidth: 200 }}
      >
        {isAnyLoading ? 'Processing...' : 'Create Spreadsheet'}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem onClick={handleCreateGoogleSheets} disabled={!canCreateGoogleSheets}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <Google color={isGoogleSignedIn ? 'primary' : 'disabled'} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" fontWeight="medium">
                Create Google Sheet
              </Typography>
              {isGoogleSignedIn ? (
                <Typography variant="caption" color="text.secondary">
                  Signed in as {googleUser?.name}
                </Typography>
              ) : (
                <Typography variant="caption" color="error">
                  Sign in to Google required
                </Typography>
              )}
            </Box>
            {googleSheetsLoading && <CircularProgress size={16} />}
          </Box>
        </MenuItem>

        <MenuItem onClick={handleDownloadCsv} disabled={!canDownloadCsv}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <Download color={canDownloadCsv ? 'primary' : 'disabled'} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" fontWeight="medium">
                Download CSV Files
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Download as ZIP file
              </Typography>
            </Box>
            {downloadLoading && <CircularProgress size={16} />}
          </Box>
        </MenuItem>
      </Menu>

      {googleSheetsUrl && (
        <Alert
          severity="success"
          sx={{ mt: 1 }}
          action={
            <Button color="inherit" size="small" onClick={handleOpenGoogleSheets} startIcon={<Google />}>
              Open Sheet
            </Button>
          }
        >
          Google Sheet created successfully!
        </Alert>
      )}

      {googleSheetsError && (
        <Alert
          severity="error"
          sx={{ mt: 1 }}
          action={
            <Button color="inherit" size="small" onClick={() => dispatch(clearGoogleSheetsResult())}>
              Dismiss
            </Button>
          }
        >
          {googleSheetsError}
        </Alert>
      )}

      {downloadError && (
        <Alert
          severity="error"
          sx={{ mt: 1 }}
          action={
            <Button color="inherit" size="small" onClick={() => dispatch(clearDownloadResult())}>
              Dismiss
            </Button>
          }
        >
          {downloadError}
        </Alert>
      )}
    </Box>
  );
};

export default CsvOutputDropdown;
