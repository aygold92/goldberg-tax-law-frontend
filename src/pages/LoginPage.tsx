/**
 * Login Page component for Microsoft Azure AD authentication.
 * 
 * This page provides the authentication entry point for the application:
 * - Displays a styled login form with Microsoft branding
 * - Handles Azure AD authentication via popup
 * - Shows loading states during authentication
 * - Displays error messages for failed login attempts
 * - Redirects authenticated users to the main application
 * 
 * Features include:
 * - Gradient background styling
 * - Responsive design for different screen sizes
 * - Error handling and user feedback
 * - Automatic redirect for already authenticated users
 * - Microsoft icon and branding elements
 * 
 * Serves as the gateway to the protected application features.
 * Uses Redux for authentication state management.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Microsoft } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectIsAuthenticated, selectAuthLoading, selectAuthError } from '../redux/features/auth/authSelectors';
import { loginUser, clearError } from '../redux/features/auth/authSlice';
import styles from '../styles/components/LoginPage.module.css';

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  // Redirect to home if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async () => {
    try {
      dispatch(clearError());
      await dispatch(loginUser()).unwrap();
    } catch (err: any) {
      // Error is handled by Redux state
      console.error('Login error:', err);
    }
  };

  return (
    <Box className={styles.loginContainer}>
      <Paper elevation={8} className={styles.loginPaper}>
        <Typography variant="h4" fontWeight={700} gutterBottom className={styles.loginTitle}>
          Bank Statement Analyzer
        </Typography>
        
        <Typography variant="body1" color="text.secondary" className={styles.loginDescription}>
          Sign in with your Microsoft account to access the application
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleLogin}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Microsoft />}
          className={styles.loginButton}
        >
          {loading ? 'Signing in...' : 'Sign in with Microsoft'}
        </Button>

        <Typography variant="caption" color="text.secondary" className={styles.loginCaption}>
          You will be redirected to Microsoft to complete the sign-in process
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginPage; 