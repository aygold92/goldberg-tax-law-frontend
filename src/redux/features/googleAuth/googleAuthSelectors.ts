/**
 * Selectors for Google authentication Redux state.
 * 
 * Provides typed selectors for accessing Google authentication state from components.
 */

import { RootState } from '../../store';

export const selectGoogleAuthState = (state: RootState) => state.googleAuth;

export const selectIsGoogleSignedIn = (state: RootState) => state.googleAuth.isSignedIn;
export const selectGoogleUser = (state: RootState) => state.googleAuth.user;
export const selectGoogleAuthLoading = (state: RootState) => state.googleAuth.loading;
export const selectGoogleAuthError = (state: RootState) => state.googleAuth.error;
export const selectIsGoogleAuthInitialized = (state: RootState) => state.googleAuth.isInitialized;

