import { RootState } from '../../store';

export const selectClients = (state: RootState) => state.client.clients;
export const selectSelectedClient = (state: RootState) => state.client.selectedClient;
export const selectSelectedClientId = (state: RootState) => state.client.selectedClient?.clientId ?? null;
export const selectSelectedClientName = (state: RootState) => state.client.selectedClient?.clientName ?? null;
export const selectClientLoading = (state: RootState) => state.client.loading;
export const selectClientError = (state: RootState) => state.client.error;
