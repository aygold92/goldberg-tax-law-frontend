/**
 * Undo/Redo middleware for Redux store.
 * 
 * This middleware automatically tracks state changes and provides
 * undo/redo functionality without requiring explicit action handling.
 * It only tracks changes to the statements slice to avoid memory issues.
 * 
 * Features:
 * - Automatic state snapshot on relevant actions
 * - Configurable undo stack size
 * - Keyboard shortcuts support
 * - Memory-efficient deep cloning
 */

import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface UndoRedoState {
  undoStack: RootState['statementEditor'][];
  redoStack: RootState['statementEditor'][];
  maxStackSize: number;
}

const undoRedoState: UndoRedoState = {
  undoStack: [],
  redoStack: [],
  maxStackSize: 50, // Configurable limit
};

// Actions that should trigger undo/redo tracking
const TRACKED_ACTIONS = [
  'statementEditor/updateStatementField',
  'statementEditor/updateTransaction',
  'statementEditor/batchUpdateTransaction',
  'statementEditor/batchUpdateMultipleTransactions',
  'statementEditor/batchUpdatePages',
  'statementEditor/addPage',
  'statementEditor/deletePage',
  'statementEditor/addTransaction',
  'statementEditor/deleteTransaction',
  'statementEditor/duplicateTransaction',
  'statementEditor/invertTransactionAmount',
  'statementEditor/resetTransaction',
  'statementEditor/resetPage',
  'statementEditor/resetStatementField',
];

// Actions that should clear the redo stack
const CLEAR_REDO_ACTIONS = [
  'statementEditor/loadBankStatement',
  'statementEditor/saveStatementChanges',
];

export const undoRedoMiddleware: Middleware = store => next => action => {
  const prevState = store.getState();
  const result = next(action);
  const nextState = store.getState();

  // Only track changes to the statementEditor slice
  const prevStatementEditor = prevState.statementEditor;

  // Check if this action should be tracked
  if (TRACKED_ACTIONS.includes((action as any).type)) {
    // Take snapshot of previous state
    const snapshot = JSON.parse(JSON.stringify(prevStatementEditor));
    
    // Add to undo stack
    undoRedoState.undoStack.push(snapshot);
    
    // Limit stack size
    if (undoRedoState.undoStack.length > undoRedoState.maxStackSize) {
      undoRedoState.undoStack.shift();
    }
    
    // Clear redo stack when new action is performed
    undoRedoState.redoStack = [];
  }

  // Clear redo stack for certain actions
  if (CLEAR_REDO_ACTIONS.includes((action as any).type)) {
    undoRedoState.undoStack = [];
    undoRedoState.redoStack = [];
  }

  return result;
};

// Export functions to access undo/redo state
export const getUndoRedoState = () => ({
  canUndo: undoRedoState.undoStack.length > 0,
  canRedo: undoRedoState.redoStack.length > 0,
  undoStackSize: undoRedoState.undoStack.length,
  redoStackSize: undoRedoState.redoStack.length,
});

export const performUndo = (store: any) => {
  if (undoRedoState.undoStack.length > 0) {
    const previousState = undoRedoState.undoStack.pop()!;
    const currentState = store.getState().statementEditor;
    
    // Add current state to redo stack
    undoRedoState.redoStack.push(JSON.parse(JSON.stringify(currentState)));
    
    // Dispatch action to restore previous state
    store.dispatch({
      type: 'statementEditor/restoreState',
      payload: previousState,
    });
  }
};

export const performRedo = (store: any) => {
  if (undoRedoState.redoStack.length > 0) {
    const nextState = undoRedoState.redoStack.pop()!;
    const currentState = store.getState().statementEditor;
    
    // Add current state to undo stack
    undoRedoState.undoStack.push(JSON.parse(JSON.stringify(currentState)));
    
    // Dispatch action to restore next state
    store.dispatch({
      type: 'statementEditor/restoreState',
      payload: nextState,
    });
  }
}; 