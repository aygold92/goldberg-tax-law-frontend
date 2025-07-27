/**
 * Authentication Context for the Bank Statement Frontend application.
 * 
 * This context provides authentication state management throughout the application:
 * - Manages user authentication status (isAuthenticated, user info)
 * - Handles login/logout operations using Azure AD authentication
 * - Provides loading states during authentication operations
 * - Initializes authentication on app startup
 * 
 * Uses Microsoft Authentication Library (MSAL) for Azure AD integration.
 * Provides a useAuth hook for components to access authentication state and methods.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AccountInfo } from '@azure/msal-browser';
import authService from '../services/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AccountInfo | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await authService.initialize();
        
        // Check if user is already signed in
        const accounts = authService.getAllAccounts();
        if (accounts.length > 0) {
          authService.setActiveAccount(accounts[0]);
          setUser(accounts[0]);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Handle authentication state changes
  useEffect(() => {
    if (isAuthenticated && !loading) {
      // User is authenticated and not loading, they should be redirected
      // This will be handled by the LoginPage component
    }
  }, [isAuthenticated, loading]);

  const login = async () => {
    try {
      setLoading(true);
      console.log('AuthContext: Starting login...');
      const result = await authService.login();
      console.log('AuthContext: Login result:', result);
      authService.setActiveAccount(result.account);
      setUser(result.account);
      setIsAuthenticated(true);
      console.log('AuthContext: User authenticated, state updated');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 