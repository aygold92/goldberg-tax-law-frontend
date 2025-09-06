/**
 * Spacing constants for consistent layout across the application.
 */

export const SPACING = {
  // Common spacing values
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
  xxxl: '32px',
  
  // Component-specific spacing
  component: {
    padding: '12px',
    margin: '8px',
    gap: '8px',
  },
  
  // Table spacing
  table: {
    cellPadding: '8px',
    headerPadding: '12px',
    rowGap: '4px',
  },
  
  // Button spacing
  button: {
    padding: '6px 12px',
    paddingLarge: '12px 24px',
    gap: '4px',
  }
} as const;
