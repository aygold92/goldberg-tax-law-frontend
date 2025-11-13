/**
 * Google Sign-in component for the Bank Statement Frontend application.
 * 
 * This component provides Google OAuth authentication functionality:
 * - Sign-in button when not authenticated
 * - User profile display when authenticated
 * - Sign-out functionality
 * - Loading states and error handling
 * 
 * Integrates with Redux for state management and the Google Sheets service.
 * 
 * Dependencies:
 * - @mui/material: https://mui.com/
 * - Redux for state management
 * - Google Sheets service for authentication
 */

import React, { useEffect } from 'react';
import { 
  Button, 
  Avatar, 
  Chip, 
  Box, 
  Menu, 
  MenuItem, 
  Typography,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  AccountCircle, 
  Google, 
  Logout,
  Person
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { 
  selectIsGoogleSignedIn, 
  selectGoogleUser, 
  selectGoogleAuthLoading, 
  selectGoogleAuthError,
  selectIsGoogleAuthInitialized
} from '../redux/features/googleAuth/googleAuthSelectors';
import { 
  initializeGoogleAuth, 
  signInToGoogle, 
  signOutFromGoogle,
  clearGoogleAuthError 
} from '../redux/features/googleAuth/googleAuthSlice';

interface GoogleSignInProps {
  variant?: 'button' | 'chip' | 'icon';
  size?: 'small' | 'medium' | 'large';
}

const GoogleSignIn: React.FC<GoogleSignInProps> = ({ 
  variant = 'button', 
  size = 'medium' 
}) => {
  const dispatch = useAppDispatch();
  const isSignedIn = useAppSelector(selectIsGoogleSignedIn);
  const user = useAppSelector(selectGoogleUser);
  const loading = useAppSelector(selectGoogleAuthLoading);
  const error = useAppSelector(selectGoogleAuthError);
  const isInitialized = useAppSelector(selectIsGoogleAuthInitialized);
  
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  useEffect(() => {
    if (!isInitialized) {
      dispatch(initializeGoogleAuth());
    }
  }, [dispatch, isInitialized]);

  useEffect(() => {
    if (error) {
      console.error('Google Auth Error:', error);
      // Clear error after 5 seconds
      const timer = setTimeout(() => {
        dispatch(clearGoogleAuthError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleSignIn = async () => {
    try {
      await dispatch(signInToGoogle()).unwrap();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    try {
      await dispatch(signOutFromGoogle()).unwrap();
      handleClose();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  if (!isInitialized || loading) {
    return (
      <Button
        disabled
        startIcon={<Google />}
        size={size}
        variant="outlined"
      >
        Loading...
      </Button>
    );
  }

  if (error) {
    return (
      <Tooltip title={error}>
        <Button
          color="error"
          startIcon={<Google />}
          size={size}
          variant="outlined"
          onClick={handleSignIn}
        >
          Sign In Failed
        </Button>
      </Tooltip>
    );
  }

  if (isSignedIn && user) {
    if (variant === 'chip') {
      return (
        <Chip
          avatar={<Avatar src={user.picture} alt={user.name} />}
          label={user.name}
          size={size === 'large' ? 'medium' : size}
          variant="outlined"
          onClick={handleMenu}
          clickable
        />
      );
    }

    if (variant === 'icon') {
      return (
        <>
          <IconButton
            onClick={handleMenu}
            size={size}
            disabled={loading}
          >
            <Avatar 
              src={user.picture} 
              alt={user.name}
              sx={{ width: 32, height: 32 }}
            />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem disabled>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person />
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleSignOut} disabled={loading}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Logout />
                <Typography variant="body2">Sign Out</Typography>
              </Box>
            </MenuItem>
          </Menu>
        </>
      );
    }

    // Default button variant
    return (
      <>
        <Button
          startIcon={<Avatar src={user.picture} alt={user.name} sx={{ width: 20, height: 20 }} />}
          size={size}
          variant="outlined"
          onClick={handleMenu}
          disabled={loading}
        >
          {user.name}
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem disabled>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person />
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {user.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
          <MenuItem onClick={handleSignOut} disabled={loading}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Logout />
              <Typography variant="body2">Sign Out</Typography>
            </Box>
          </MenuItem>
        </Menu>
      </>
    );
  }

  // Not signed in
  return (
    <Button
      startIcon={<Google />}
      size={size}
      variant="outlined"
      onClick={handleSignIn}
      disabled={loading}
    >
      Sign in with Google
    </Button>
  );
};

export default GoogleSignIn;
