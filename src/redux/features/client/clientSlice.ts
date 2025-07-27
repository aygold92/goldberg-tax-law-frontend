/**
 * Redux slice for client management in the Bank Statement Frontend application.
 *
 * This slice manages:
 * - The list of clients (loaded from the backend)
 * - The currently selected client
 * - Loading and error states for client operations
 *
 * Uses Redux Toolkit's createSlice and createAsyncThunk.
 *
 * External dependencies:
 * - Redux Toolkit: https://redux-toolkit.js.org/
 * - Axios (via apiService): https://axios-http.com/
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '../../../services/api';

export interface ClientState {
  clients: string[];
  selectedClient: string;
  loading: boolean;
  error: string | null;
}

const initialState: ClientState = {
  clients: [],
  selectedClient: localStorage.getItem('selectedClient') || '',
  loading: false,
  error: null,
};

// Async thunk to load clients from the backend
export const loadClients = createAsyncThunk<string[], void, { rejectValue: string }>(
  'client/loadClients',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.listClients();
      return response.clients;
    } catch (error: any) {
      return rejectWithValue(error.userMessage || 'Failed to load clients');
    }
  }
);

// Async thunk to create a new client
export const createClient = createAsyncThunk<string, string, { rejectValue: string }>(
  'client/createClient',
  async (clientName, { rejectWithValue, dispatch }) => {
    try {
      await apiService.newClient({ clientName });
      // After creating, reload the client list
      await dispatch(loadClients());
      return clientName;
    } catch (error: any) {
      return rejectWithValue(error.userMessage || 'Failed to create client');
    }
  }
);

const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {
    setSelectedClient: (state, action: PayloadAction<string>) => {
      state.selectedClient = action.payload;
      localStorage.setItem('selectedClient', action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadClients.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = action.payload;
        // If no client is selected, select the first one
        if (!state.selectedClient && action.payload.length > 0) {
          state.selectedClient = action.payload[0];
        }
      })
      .addCase(loadClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load clients';
      })
      .addCase(createClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.loading = false;
        // selectedClient will be set by the component after creation
      })
      .addCase(createClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create client';
      });
  },
});

export const { setSelectedClient } = clientSlice.actions;
export default clientSlice.reducer; 