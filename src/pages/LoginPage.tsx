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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        }}
      >
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
          Bank Statement Analyzer
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
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
          sx={{
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            fontSize: 16,
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            boxShadow: '0 3px 5px 2px rgba(25, 118, 210, .3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
            },
          }}
        >
          {loading ? 'Signing in...' : 'Sign in with Microsoft'}
        </Button>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
          You will be redirected to Microsoft to complete the sign-in process
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginPage; 