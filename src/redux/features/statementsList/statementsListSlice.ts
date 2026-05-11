import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { StatementSummary } from '../../../types/api';
import apiService from '../../../services/api';

interface StatementsListState {
  statements: StatementSummary[];
  loading: boolean;
  error: string | null;
}

const initialState: StatementsListState = {
  statements: [],
  loading: false,
  error: null,
};

export const fetchStatements = createAsyncThunk<StatementSummary[], { clientId: string }>(
  'statementsList/fetchStatements',
  async ({ clientId }, { rejectWithValue }) => {
    try {
      return await apiService.listStatements(clientId);
    } catch (error: any) {
      return rejectWithValue(error.userMessage || error.message || 'Failed to fetch statements');
    }
  }
);

export const deleteStatements = createAsyncThunk<string[], { statementIds: string[] }>(
  'statementsList/deleteStatements',
  async ({ statementIds }, { rejectWithValue }) => {
    try {
      for (const id of statementIds) {
        await apiService.deleteStatement(id);
      }
      return statementIds;
    } catch (error: any) {
      return rejectWithValue(error.userMessage || error.message || 'Failed to delete statements');
    }
  }
);

const statementsListSlice = createSlice({
  name: 'statementsList',
  initialState,
  reducers: {
    updateStatementInList(state, action: PayloadAction<StatementSummary>) {
      const idx = state.statements.findIndex(
        s => s.statementDetails.statementId === action.payload.statementDetails.statementId
      );
      if (idx !== -1) {
        state.statements[idx] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStatements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStatements.fulfilled, (state, action: PayloadAction<StatementSummary[]>) => {
        state.loading = false;
        state.statements = action.payload;
      })
      .addCase(fetchStatements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteStatements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStatements.fulfilled, (state, action: PayloadAction<string[]>) => {
        state.loading = false;
        const deleted = new Set(action.payload);
        state.statements = state.statements.filter(
          s => !deleted.has(s.statementDetails.statementId)
        );
      })
      .addCase(deleteStatements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { updateStatementInList } = statementsListSlice.actions;

export default statementsListSlice.reducer;
