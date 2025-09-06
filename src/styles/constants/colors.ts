/**
 * Color constants for consistent styling across the application.
 * 
 * These colors are derived from the theme and provide semantic meaning
 * for different UI states and elements.
 */

export const COLORS = {
  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f5f5f5',
    hover: '#f8f9fa',
    selected: '#e3f2fd',
    selectedHover: '#bbdefb',
  },
  
  // Border colors
  border: {
    primary: '#e2e8f0',
    secondary: '#e0e0e0',
    accent: '#d1d5db',
    hover: '#9ca3af',
    focus: '#3b82f6',
  },
  
  // Text colors
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    muted: '#6b7280',
    accent: '#1976d2',
  },
  
  // Status colors
  status: {
    modified: 'rgba(255, 235, 59, 0.3)', // Light yellow for modified items
    new: 'rgba(76, 175, 80, 0.1)', // Light green for new items
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
    info: '#3b82f6',
  },
  
  // Button colors
  button: {
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    secondary: '#6b7280',
    secondaryHover: '#4b5563',
  }
} as const;
