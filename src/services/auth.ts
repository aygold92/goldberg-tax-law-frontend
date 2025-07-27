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

import { PublicClientApplication, Configuration, AccountInfo, AuthenticationResult } from '@azure/msal-browser';

// MSAL configuration
const msalConfig: Configuration = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_AZURE_TENANT_ID || 'common'}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    allowRedirectInIframe: true,
  },
};

// Note: Update the scopes below to match your Azure AD app registration
// For custom APIs, you'll need to add the appropriate API permissions in Azure AD

// Scopes for API access
const loginRequest = {
  scopes: ['api://727a2ca0-2e37-4749-9a79-bfe79a780251/invoke'],
};

// API scopes for backend calls
const apiRequest = {
  scopes: ['api://727a2ca0-2e37-4749-9a79-bfe79a780251/invoke'],
};

class AuthService {
  private msalInstance: PublicClientApplication;

  constructor() {
    this.msalInstance = new PublicClientApplication(msalConfig);
  }

  async initialize(): Promise<void> {
    await this.msalInstance.initialize();
  }

  async login(): Promise<AuthenticationResult> {
    try {
      console.log('Starting login process...');
      const result = await this.msalInstance.loginPopup(loginRequest);
      console.log('Login successful:', result);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.msalInstance.logoutPopup();
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

      const response = await this.msalInstance.acquireTokenSilent({
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
    return this.msalInstance.getActiveAccount();
  }

  getAllAccounts(): AccountInfo[] {
    return this.msalInstance.getAllAccounts();
  }

  setActiveAccount(account: AccountInfo): void {
    this.msalInstance.setActiveAccount(account);
  }

  isAuthenticated(): boolean {
    return this.getActiveAccount() !== null;
  }

  getAccountInfo(): AccountInfo | null {
    return this.getActiveAccount();
  }
}

export default new AuthService(); 