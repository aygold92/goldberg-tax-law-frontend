/**
 * Redux slice for managing Google authentication state in the Bank Statement Frontend application.
 * 
 * This slice handles:
 * - Google OAuth authentication status
 * - User profile information
 * - Sign-in and sign-out operations
 * 
 * Uses Redux Toolkit for state management and integrates with the Google Sheets service.
 * 
 * Depends on:
 * - @reduxjs/toolkit: https://redux-toolkit.js.org/
 * - src/services/googleSheets.ts for Google API operations
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import googleSheetsService, { GoogleUser } from '../../../services/googleSheets';

interface GoogleAuthState {
  isSignedIn: boolean;
  user: GoogleUser | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const initialState: GoogleAuthState = {
  isSignedIn: false,
  user: null,
  loading: false,
  error: null,
  isInitialized: false,
};

// Initialize Google APIs
export const initializeGoogleAuth = createAsyncThunk(
  'googleAuth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      await googleSheetsService.initialize();
      return {
        isSignedIn: googleSheetsService.isUserSignedIn(),
        user: googleSheetsService.getCurrentUser(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initialize Google authentication');
    }
  }
);

// Sign in to Google
export const signInToGoogle = createAsyncThunk(
  'googleAuth/signIn',
  async (_, { rejectWithValue }) => {
    try {
      const user = await googleSheetsService.signIn();
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sign in to Google');
    }
  }
);

// Sign out from Google
export const signOutFromGoogle = createAsyncThunk(
  'googleAuth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      await googleSheetsService.signOut();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sign out from Google');
    }
  }
);

const googleAuthSlice = createSlice({
  name: 'googleAuth',
  initialState,
  reducers: {
    clearGoogleAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize Google Auth
      .addCase(initializeGoogleAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeGoogleAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitialized = true;
        state.isSignedIn = action.payload.isSignedIn;
        state.user = action.payload.user;
      })
      .addCase(initializeGoogleAuth.rejected, (state, action) => {
        state.loading = false;
        state.isInitialized = true;
        state.error = action.payload as string;
      })
      
      // Sign in to Google
      .addCase(signInToGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signInToGoogle.fulfilled, (state, action: PayloadAction<GoogleUser>) => {
        state.loading = false;
        state.isSignedIn = true;
        state.user = action.payload;
      })
      .addCase(signInToGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Sign out from Google
      .addCase(signOutFromGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signOutFromGoogle.fulfilled, (state) => {
        state.loading = false;
        state.isSignedIn = false;
        state.user = null;
      })
      .addCase(signOutFromGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearGoogleAuthError } = googleAuthSlice.actions;
export default googleAuthSlice.reducer;

