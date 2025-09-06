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
import { COLORS } from '../styles/constants';
import styles from '../styles/components/Layout.module.css';
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
    <Box className={styles.mainContainer}>
      <AppBar 
        position="static" 
        elevation={0}
        className={styles.appBar}
      >
        <Toolbar className={styles.toolbar}>
          {/* Logo and Title */}
          <Typography 
            variant="h5" 
            component="div" 
            className={`${styles.logo} ${styles.logoMobile}`}
          >
            Bank Statement Analyzer
          </Typography>

          {/* Desktop Navigation */}
          <Box className={styles.desktopNav}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                variant={location.pathname === item.path ? "contained" : "text"}
                startIcon={item.icon}
                className={`${styles.navButton} ${location.pathname === item.path ? styles.navButtonContained : styles.navButtonText}`}
              >
                {item.label}
              </Button>
            ))}
            
            {/* User Menu */}
            <Box className={styles.userSection}>
              {user?.name && (
                <Chip
                  label={user.name}
                  size="small"
                  variant="outlined"
                  className={`${styles.userChip} ${styles.userChipMobile}`}
                />
              )}
              
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                disabled={loading}
                className={styles.userButton}
              >
                {user?.name ? (
                  <Avatar className={styles.userAvatar}>
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
            className={styles.mobileMenuButton}
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
          className: styles.mobileMenu
        }}
      >
        {navItems.map((item) => (
          <MenuItem
            key={item.path}
            component={Link}
            to={item.path}
            onClick={handleMobileMenuClose}
            className={`${styles.mobileMenuItem} ${location.pathname === item.path ? styles.mobileMenuItemActive : ''}`}
          >
            <Box className={styles.mobileMenuItemContent}>
              {item.icon}
              <Typography variant="body2" className={styles.mobileMenuItemText}>
                {item.label}
              </Typography>
            </Box>
          </MenuItem>
        ))}
        <Box className={styles.mobileMenuDivider}>
          {user?.name && (
            <MenuItem disabled className={styles.mobileUserInfo}>
              <Typography variant="body2" color="text.secondary">
                {user.name}
              </Typography>
            </MenuItem>
          )}
          <MenuItem 
            onClick={handleLogout} 
            disabled={loading}
            className={styles.mobileLogoutItem}
          >
            <Box className={styles.mobileLogoutContent}>
              <Logout className={styles.mobileLogoutIcon} />
              <Typography variant="body2" className={styles.mobileLogoutText}>
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
          className: styles.desktopMenu
        }}
      >
        {user?.name && (
          <MenuItem disabled className={styles.desktopUserInfo}>
            <Typography variant="body2" color="text.secondary">
              {user.name}
            </Typography>
          </MenuItem>
        )}
        <MenuItem 
          onClick={handleLogout} 
          disabled={loading}
          className={styles.desktopLogoutItem}
        >
          <Box className={styles.desktopLogoutContent}>
            <Logout className={styles.desktopLogoutIcon} />
            <Typography variant="body2" className={styles.desktopLogoutText}>
              Sign Out
            </Typography>
          </Box>
        </MenuItem>
      </Menu>

      {/* Main Content */}
      <Box 
        component="main" 
        className={styles.mainContent}
      >
        <Container maxWidth="xl" className={styles.contentContainer}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 