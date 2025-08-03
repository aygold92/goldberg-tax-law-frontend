/**
 * Main App component for the Bank Statement Frontend application.
 * 
 * This component serves as the root of the application and handles:
 * - Material-UI theme configuration with custom styling
 * - React Router setup with protected routes
 * - Redux Provider for state management
 * - Application routing between different pages (Login, Upload, Statements, Edit)
 * 
 * The app uses Material-UI for styling, React Router for navigation,
 * and Redux Toolkit for state management, with all main routes protected
 * by authentication except the login page.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { useAppDispatch } from './redux/hooks';
import { initializeAuth } from './redux/features/auth/authSlice';
import { theme } from './theme';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import UploadPage from './pages/UploadPage';
import StatementsPage from './pages/StatementsPage';
import EditPage from './pages/EditPage';
import PdfSplitterPage from './pages/PdfSplitterPage';

// Component to initialize authentication state
const AuthInitializer: React.FC = () => {
  const dispatch = useAppDispatch();
  
  React.useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);
  
  return null;
};

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthInitializer />
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/pdf-splitter" element={<PdfSplitterPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <UploadPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/statements"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StatementsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EditPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
