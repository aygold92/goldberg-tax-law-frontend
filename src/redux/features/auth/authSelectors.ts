/**
 * Authentication selectors for Redux state access.
 * 
 * These selectors provide type-safe access to authentication state:
 * - User information and authentication status
 * - Loading states for authentication operations
 * - Error states for authentication failures
 * 
 * Using these selectors ensures consistent state access patterns
 * and provides better TypeScript support.
 */

import { RootState } from '../../store';

// Basic selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;

// Derived selectors
export const selectUserName = (state: RootState) => state.auth.user?.name || '';
export const selectUserEmail = (state: RootState) => state.auth.user?.email || '';
export const selectHasAuthError = (state: RootState) => state.auth.error !== null; 