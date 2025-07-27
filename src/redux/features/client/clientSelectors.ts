/**
 * Client selectors for Redux state access.
 *
 * These selectors provide type-safe access to client management state:
 * - List of clients
 * - Selected client
 * - Loading and error states
 *
 * Using these selectors ensures consistent state access patterns
 * and provides better TypeScript support.
 */

import { RootState } from '../../store';

export const selectClients = (state: RootState) => state.client.clients;
export const selectSelectedClient = (state: RootState) => state.client.selectedClient;
export const selectClientLoading = (state: RootState) => state.client.loading;
export const selectClientError = (state: RootState) => state.client.error; 