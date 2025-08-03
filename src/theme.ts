import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
      light: '#3b82f6',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.25rem',
      lineHeight: 1.2,
      color: '#1e293b',
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.875rem',
      lineHeight: 1.3,
      color: '#1e293b',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      color: '#1e293b',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
      color: '#1e293b',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
      color: '#1e293b',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.4,
      color: '#1e293b',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#374151',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#6b7280',
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 16px',
          '&.MuiButton-contained': {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            },
          },
          '&.MuiButton-outlined': {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
            },
          },
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: '1rem',
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '0.875rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0',
          '&:hover': {
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '20px 24px 16px',
        },
        title: {
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#1e293b',
        },
        subheader: {
          fontSize: '0.875rem',
          color: '#64748b',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '16px 24px 24px',
          '&:last-child': {
            paddingBottom: '24px',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1e293b',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '64px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '& .MuiAlert-icon': {
            fontSize: '1.25rem',
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderWidth: '1.5px',
          '&.Mui-selected': {
            backgroundColor: '#dbeafe',
            color: '#1d4ed8',
            '&:hover': {
              backgroundColor: '#bfdbfe',
            },
          },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          '& .MuiToggleButton-root': {
            borderWidth: '1.5px',
          },
        },
      },
    },
  },
}); 