/**
 * Main Layout component for the Bank Statement Frontend application.
 * 
 * This component provides the common layout structure for all authenticated pages:
 * - Navigation bar with links to main sections (Upload, Statements, Edit)
 * - User account menu with logout functionality
 * - Responsive container for page content
 * - Material-UI styling with consistent theming
 * 
 * The layout includes:
 * - AppBar with navigation buttons and user menu
 * - Active page highlighting
 * - User avatar/name display
 * - Logout functionality
 * 
 * Wraps all protected routes and provides consistent navigation experience.
 * Uses Redux for authentication state management.
 */

import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container, Avatar, Menu, MenuItem, IconButton } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { CloudUpload, TableChart, Edit, AccountCircle, Logout } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectUser, selectAuthLoading } from '../redux/features/auth/authSelectors';
import { logoutUser } from '../redux/features/auth/authSlice';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const loading = useAppSelector(selectAuthLoading);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const navItems = [
    { path: '/', label: 'Upload Documents', icon: <CloudUpload /> },
    { path: '/statements', label: 'View Statements', icon: <TableChart /> },
    { path: '/edit', label: 'Edit Statements', icon: <Edit /> },
  ];

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      handleClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Bank Statement Analyzer
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                color="inherit"
                startIcon={item.icon}
                sx={{
                  backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                }}
              >
                {item.label}
              </Button>
            ))}
            
            {/* User menu */}
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
              disabled={loading}
            >
              {user?.name ? (
                <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
              ) : (
                <AccountCircle />
              )}
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>
                <Typography variant="body2">
                  {user?.name || user?.email || 'User'}
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout} disabled={loading}>
                <Logout sx={{ mr: 1 }} />
                Sign Out
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout; 