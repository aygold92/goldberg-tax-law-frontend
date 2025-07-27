/**
 * Typed Redux hooks for the Bank Statement Frontend application.
 * 
 * These hooks provide type-safe access to the Redux store:
 * - useAppDispatch: Typed dispatch function
 * - useAppSelector: Typed selector hook with RootState
 * 
 * Using these hooks ensures TypeScript can properly infer types
 * when dispatching actions and selecting state.
 */

import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 