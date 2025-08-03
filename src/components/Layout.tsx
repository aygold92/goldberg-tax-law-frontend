/**
 * Main Layout component for the Bank Statement Frontend application.
 * 
 * This component provides the common layout structure for all authenticated pages:
 * - Modern navigation bar with links to main sections (Upload, Statements, Edit)
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
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container, 
  Avatar, 
  Menu, 
  MenuItem, 
  IconButton,
  Chip
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { 
  CloudUpload, 
  TableChart, 
  Edit, 
  AccountCircle, 
  Logout,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectUser, selectAuthLoading } from '../redux/features/auth/authSelectors';
import { logoutUser } from '../redux/features/auth/authSlice';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const loading = useAppSelector(selectAuthLoading);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = React.useState<null | HTMLElement>(null);

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

  const handleMobileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      handleClose();
      handleMobileMenuClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          color: '#1e293b'
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 3 }, py: 1 }}>
          {/* Logo and Title */}
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 700,
              color: '#1e293b',
              fontSize: { xs: '1.25rem', md: '1.5rem' }
            }}
          >
            Bank Statement Analyzer
          </Typography>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                variant={location.pathname === item.path ? "contained" : "text"}
                startIcon={item.icon}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  '&.MuiButton-contained': {
                    backgroundColor: '#2563eb',
                    '&:hover': {
                      backgroundColor: '#1d4ed8',
                    }
                  },
                  '&.MuiButton-text': {
                    color: '#64748b',
                    '&:hover': {
                      backgroundColor: '#f1f5f9',
                      color: '#1e293b',
                    }
                  }
                }}
              >
                {item.label}
              </Button>
            ))}
            
            {/* User Menu */}
            <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              {user?.name && (
                <Chip
                  label={user.name}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: '#d1d5db',
                    color: '#374151',
                    fontWeight: 500,
                    display: { xs: 'none', lg: 'flex' }
                  }}
                />
              )}
              
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                disabled={loading}
                sx={{
                  color: '#64748b',
                  '&:hover': {
                    backgroundColor: '#f1f5f9',
                    color: '#1e293b',
                  }
                }}
              >
                {user?.name ? (
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      fontSize: '0.875rem',
                      backgroundColor: '#2563eb',
                      color: '#ffffff'
                    }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </Avatar>
                ) : (
                  <AccountCircle />
                )}
              </IconButton>
            </Box>
          </Box>

          {/* Mobile Menu Button */}
          <IconButton
            sx={{ 
              display: { xs: 'flex', md: 'none' },
              color: '#64748b',
              '&:hover': {
                backgroundColor: '#f1f5f9',
                color: '#1e293b',
              }
            }}
            onClick={handleMobileMenu}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile Menu */}
      <Menu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleMobileMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          }
        }}
      >
        {navItems.map((item) => (
          <MenuItem
            key={item.path}
            component={Link}
            to={item.path}
            onClick={handleMobileMenuClose}
            sx={{
              py: 1.5,
              px: 2,
              color: location.pathname === item.path ? '#2563eb' : '#374151',
              backgroundColor: location.pathname === item.path ? '#dbeafe' : 'transparent',
              '&:hover': {
                backgroundColor: location.pathname === item.path ? '#bfdbfe' : '#f8fafc',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {item.icon}
              <Typography variant="body2" fontWeight={500}>
                {item.label}
              </Typography>
            </Box>
          </MenuItem>
        ))}
        <Box sx={{ borderTop: '1px solid #e2e8f0', mt: 1, pt: 1 }}>
          {user?.name && (
            <MenuItem disabled sx={{ py: 1, px: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {user.name}
              </Typography>
            </MenuItem>
          )}
          <MenuItem 
            onClick={handleLogout} 
            disabled={loading}
            sx={{ 
              py: 1.5, 
              px: 2,
              color: '#ef4444',
              '&:hover': {
                backgroundColor: '#fef2f2',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Logout sx={{ fontSize: '1.25rem' }} />
              <Typography variant="body2" fontWeight={500}>
                Sign Out
              </Typography>
            </Box>
          </MenuItem>
        </Box>
      </Menu>

      {/* Desktop User Menu */}
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
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          }
        }}
      >
        {user?.name && (
          <MenuItem disabled sx={{ py: 1, px: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {user.name}
            </Typography>
          </MenuItem>
        )}
        <MenuItem 
          onClick={handleLogout} 
          disabled={loading}
          sx={{ 
            py: 1.5, 
            px: 2,
            color: '#ef4444',
            '&:hover': {
              backgroundColor: '#fef2f2',
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Logout sx={{ fontSize: '1.25rem' }} />
            <Typography variant="body2" fontWeight={500}>
              Sign Out
            </Typography>
          </Box>
        </MenuItem>
      </Menu>

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          py: 3, 
          px: { xs: 2, md: 3 },
          backgroundColor: '#f8fafc',
          minHeight: 'calc(100vh - 64px)'
        }}
      >
        <Container maxWidth="xl" sx={{ height: '100%' }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 