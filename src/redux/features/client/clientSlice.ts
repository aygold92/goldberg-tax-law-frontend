import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Client } from '../../../types/api';
import apiService from '../../../services/api';

export interface ClientState {
  clients: Client[];
  selectedClient: Client | null;
  loading: boolean;
  error: string | null;
}

const parseStoredClient = (): Client | null => {
  try {
    const stored = localStorage.getItem('selectedClient');
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore malformed JSON from old format (was plain string)
  }
  return null;
};

const initialState: ClientState = {
  clients: [],
  selectedClient: parseStoredClient(),
  loading: false,
  error: null,
};

export const loadClients = createAsyncThunk<Client[], void, { rejectValue: string }>(
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

export const createClient = createAsyncThunk<Client, string, { rejectValue: string }>(
  'client/createClient',
  async (clientName, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiService.newClient({
        clientName,
        requestToken: crypto.randomUUID(),
      });
      const newClient: Client = {
        clientId: response.clientId,
        clientName: response.clientName,
        createdAt: Date.now(),
      };
      await dispatch(loadClients());
      return newClient;
    } catch (error: any) {
      return rejectWithValue(error.userMessage || 'Failed to create client');
    }
  }
);

const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {
    setSelectedClient: (state, action: PayloadAction<Client | null>) => {
      state.selectedClient = action.payload;
      if (action.payload) {
        localStorage.setItem('selectedClient', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('selectedClient');
      }
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
        // Auto-select first client if none selected
        if (!state.selectedClient && action.payload.length > 0) {
          state.selectedClient = action.payload[0];
          localStorage.setItem('selectedClient', JSON.stringify(action.payload[0]));
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
      .addCase(createClient.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create client';
      });
  },
});

export const { setSelectedClient } = clientSlice.actions;
export default clientSlice.reducer;
