/**
 * Authentication slice for Redux state management.
 * 
 * This slice manages authentication state including:
 * - User authentication status (isAuthenticated)
 * - User account information (name and email only for serialization)
 * - Loading states during authentication operations
 * - Error handling for authentication failures
 * 
 * Replaces the AuthContext with Redux state management for better
 * scalability and developer experience.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AccountInfo } from '@azure/msal-browser';
import authService from '../../../services/auth';

// Async thunk for login
export const loginUser = createAsyncThunk(
  'auth/login',
  async (_, { rejectWithValue }) => {
    try {
      console.log('AuthSlice: Starting login...');
      const result = await authService.login();
      console.log('AuthSlice: Login result:', result);
      authService.setActiveAccount(result.account);
      // Return only serializable data
      return safeSerializeAccount(result.account);
    } catch (error) {
      console.error('Login error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
    }
  }
);

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Logout failed');
    }
  }
);

// Async thunk for initializing auth
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      await authService.initialize();
      
      // Check if user is already signed in
      const accounts = authService.getAllAccounts();
      if (accounts.length > 0) {
        authService.setActiveAccount(accounts[0]);
        // Return only serializable data
        return safeSerializeAccount(accounts[0]);
      }
      return null;
    } catch (error) {
      console.error('Auth initialization error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Auth initialization failed');
    }
  }
);

interface SerializableUser {
  name: string;
  email: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: SerializableUser | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
};

// Helper function to safely serialize account data
const safeSerializeAccount = (account: AccountInfo): SerializableUser => {
  // Only extract known serializable properties
  const serializableData = {
    name: account.name || '',
    email: account.username || '',
  };
  
  // Log to help debug any non-serializable properties
  console.log('Extracted serializable data:', serializableData);
  
  return serializableData;
};

// Helper function to extract serializable user data
const extractUserData = (account: AccountInfo): SerializableUser => {
  // Log the account object to identify non-serializable properties
  console.log('AccountInfo object:', account);
  console.log('AccountInfo keys:', Object.keys(account));
  
  // Use the safe serialization function
  return safeSerializeAccount(account);
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<AccountInfo>) => {
      state.user = extractUserData(action.payload);
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    // Initialize auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user = action.payload; // Now it's already SerializableUser
          state.isAuthenticated = true;
        }
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload; // Now it's already SerializableUser
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer; 