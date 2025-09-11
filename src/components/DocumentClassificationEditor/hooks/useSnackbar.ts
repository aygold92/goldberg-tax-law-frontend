import { useState } from 'react';

type SnackbarSeverity = 'success' | 'error' | 'info';

export const useSnackbar = () => {
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<SnackbarSeverity>('success');

  // Show snackbar notification
  const showSnackbar = (message: string, severity: SnackbarSeverity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Close snackbar
  const closeSnackbar = () => {
    setSnackbarOpen(false);
  };

  return {
    // State
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    
    // Actions
    showSnackbar,
    closeSnackbar,
  };
};
