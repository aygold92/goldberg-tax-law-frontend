/**
 * Redux store configuration for the Bank Statement Frontend application.
 * 
 * This file sets up the Redux store with:
 * - Root reducer combining all feature slices
 * - Store configuration with Redux Toolkit
 * - Type definitions for RootState and AppDispatch
 * 
 * The store uses Redux Toolkit's configureStore for optimal performance
 * and developer experience.
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import filesReducer from '../features/files/filesSlice';
import analysisReducer from '../features/analysis/analysisSlice';
import clientReducer from '../features/client/clientSlice';
import statementsListReducer from '../features/statementsList/statementsListSlice';
import statementEditorReducer from '../features/statementEditor/statementEditorSlice';
import csvOutputReducer from '../features/csvOutput/csvOutputSlice';
import googleAuthReducer from '../features/googleAuth/googleAuthSlice';
import { undoRedoMiddleware } from '../middleware/undoRedoMiddleware';

const store = configureStore({
  reducer: {
    auth: authReducer,
    files: filesReducer,
    analysis: analysisReducer,
    client: clientReducer,
    statementsList: statementsListReducer,
    statementEditor: statementEditorReducer,
    csvOutput: csvOutputReducer,
    googleAuth: googleAuthReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(undoRedoMiddleware),
});

export { store };

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 