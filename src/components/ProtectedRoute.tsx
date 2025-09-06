/**
 * Protected Route component for authentication-based route protection.
 * 
 * This component ensures that only authenticated users can access protected routes:
 * - Checks authentication status from Redux store
 * - Shows loading spinner while authentication is being determined
 * - Redirects unauthenticated users to the login page
 * - Renders children components only for authenticated users
 * 
 * Used to wrap all routes that require authentication in the application.
 * Provides a smooth user experience with loading states and automatic redirects.
 * Uses Redux for authentication state management.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAppSelector } from '../redux/hooks';
import { selectIsAuthenticated, selectAuthLoading } from '../redux/features/auth/authSelectors';
import { COLORS } from '../styles/constants';
import styles from '../styles/components/ProtectedRoute.module.css';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectAuthLoading);

  if (loading) {
    return (
      <Box className={styles.loadingContainer}>
        <CircularProgress size={60} className={styles.loadingSpinner} />
        <Typography variant="h6" className={styles.loadingText}>
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 