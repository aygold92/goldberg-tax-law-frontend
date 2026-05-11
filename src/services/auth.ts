/**
 * Authentication Service for Azure AD integration.
 * 
 * This service handles all authentication-related operations using Microsoft Authentication Library (MSAL):
 * - Initializes MSAL configuration with Azure AD settings
 * - Manages login/logout operations via popup windows
 * - Handles access token acquisition for API calls
 * - Manages active account state and user sessions
 * 
 * Uses environment variables for Azure AD configuration (client ID, tenant ID).
 * Provides methods for authentication state management and token handling.
 */

import { AccountInfo, AuthenticationResult } from '@azure/msal-browser';
import { msalInstance } from './msalInstance';

// Scopes for API access — offline_access is required so Azure AD issues a refresh token,
// which MSAL uses for silent renewal instead of the throttled prompt=none iframe flow.
const loginRequest = {
  scopes: ['api://727a2ca0-2e37-4749-9a79-bfe79a780251/invoke', 'offline_access'],
};

// API scopes for backend calls
const apiRequest = {
  scopes: ['api://727a2ca0-2e37-4749-9a79-bfe79a780251/invoke', 'offline_access'],
};

class AuthService {
  async initialize(): Promise<void> {
    // Initialization is handled by msalInstance.initialize() in index.tsx before render
  }

  async login(): Promise<AuthenticationResult> {
    try {
      console.log('Starting login process...');
      const result = await msalInstance.loginPopup(loginRequest);
      console.log('Login successful:', result);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await msalInstance.logoutPopup();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      const account = this.getActiveAccount();
      if (!account) {
        throw new Error('No active account found');
      }

      const response = await msalInstance.acquireTokenSilent({
        ...apiRequest,
        account,
      });

      return response.accessToken;
    } catch (error) {
      console.error('Token acquisition error:', error);
      return null;
    }
  }

  getActiveAccount(): AccountInfo | null {
    return msalInstance.getActiveAccount();
  }

  getAllAccounts(): AccountInfo[] {
    return msalInstance.getAllAccounts();
  }

  setActiveAccount(account: AccountInfo): void {
    msalInstance.setActiveAccount(account);
  }

  isAuthenticated(): boolean {
    return this.getActiveAccount() !== null;
  }

  getAccountInfo(): AccountInfo | null {
    return this.getActiveAccount();
  }
}

export default new AuthService(); 