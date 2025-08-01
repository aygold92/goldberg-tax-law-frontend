/**
 * Custom hook for undo/redo functionality.
 * 
 * Provides access to undo/redo state and actions,
 * along with keyboard shortcut handling.
 */

import { useEffect } from 'react';
import { useAppDispatch } from './index';
import { getUndoRedoState, performUndo, performRedo } from '../middleware/undoRedoMiddleware';
import { store } from '../store';

export const useUndoRedo = () => {
  const dispatch = useAppDispatch();

  const undoRedoState = getUndoRedoState();

  const handleUndo = () => {
    performUndo(store);
  };

  const handleRedo = () => {
    performRedo(store);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'z' && !event.shiftKey) {
          event.preventDefault();
          if (undoRedoState.canUndo) handleUndo();
        } else if ((event.key === 'y') || (event.key === 'z' && event.shiftKey)) {
          event.preventDefault();
          if (undoRedoState.canRedo) handleRedo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undoRedoState.canUndo, undoRedoState.canRedo]);

  return {
    canUndo: undoRedoState.canUndo,
    canRedo: undoRedoState.canRedo,
    undoStackSize: undoRedoState.undoStackSize,
    redoStackSize: undoRedoState.redoStackSize,
    undo: handleUndo,
    redo: handleRedo,
  };
}; 