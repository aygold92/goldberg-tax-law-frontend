/**
 * Typography constants for consistent text styling across the application.
 */

export const TYPOGRAPHY = {
  // Font weights
  fontWeight: {
    normal: 'normal',
    medium: '500',
    semibold: '600',
    bold: 'bold',
  },
  
  // Font sizes
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    xxl: '1.5rem',
  },
  
  // Line heights
  lineHeight: {
    tight: '1.2',
    normal: '1.4',
    relaxed: '1.6',
  },
  
  // Common text styles
  styles: {
    header: {
      fontWeight: 'bold',
      fontSize: '1rem',
      lineHeight: '1.4',
    },
    body: {
      fontSize: '0.875rem',
      lineHeight: '1.6',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: '1.4',
    }
  }
} as const;
