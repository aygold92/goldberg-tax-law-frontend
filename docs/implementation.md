# Implementation Guide

## Overview

This is a React TypeScript application for processing bank statements. It uses Azure services for authentication and storage, with a focus on document upload and analysis workflows. The application uses Redux Toolkit for centralized state management.

## Key Patterns

### Authentication
- Uses Azure AD with MSAL
- Protected routes for authenticated users
- Automatic token refresh
- Redux state management for auth state

### File Upload
- Drag-and-drop interface
- Direct upload to Azure Blob Storage
- Progress tracking and status monitoring
- Redux state management for file operations

### State Management
- Redux Toolkit for global state management
- Feature-based slices (auth, files, analysis)
- Type-safe selectors and actions
- Async operations with Redux Toolkit async thunks

## Architecture Decisions

### Why React + TypeScript?
- Type safety for complex data structures
- Better developer experience
- Easier refactoring and maintenance

### Why Material-UI?
- Consistent design system
- Built-in accessibility
- Rapid development

### Why Azure Integration?
- Enterprise authentication
- Scalable storage
- Managed services

### Why Redux Toolkit?
- Simplified Redux development
- Built-in TypeScript support
- Async operations with createAsyncThunk
- Immutable updates with Immer
- DevTools integration

## Common Patterns

### Redux State Access
```typescript
// Use typed hooks for Redux access
const dispatch = useAppDispatch();
const user = useAppSelector(selectUser);
const files = useAppSelector(selectFiles);

// Dispatch actions
dispatch(loginUser());
dispatch(addFiles(files));
```

### API Calls with Redux
```typescript
// Async thunks handle API calls
const result = await dispatch(uploadFiles()).unwrap();
```

### Error Handling
```typescript
// Redux handles error states centrally
const error = useAppSelector(selectAuthError);
if (error) {
  // Show error message
}
```

### Loading States
```typescript
// Redux manages loading states
const loading = useAppSelector(selectAuthLoading);
if (loading) {
  // Show loading indicator
}
```

## Development Guidelines

### Adding New Features
1. Start with the user story
2. Design the Redux slice structure
3. Implement the UI components
4. Add Redux actions and selectors
5. Handle errors and loading states

### Code Organization
- Keep components focused and small
- Use TypeScript interfaces for data structures
- Follow Redux Toolkit patterns
- Use typed selectors for state access

### Testing
- Test user workflows, not implementation details
- Focus on integration tests
- Keep tests simple and maintainable
- Test Redux state changes

## Environment Setup

Required environment variables:
```env
REACT_APP_AZURE_CLIENT_ID=your-client-id
REACT_APP_AZURE_TENANT_ID=your-tenant-id
REACT_APP_API_BASE_URL=your-api-url
REACT_APP_AZURE_STORAGE_ACCOUNT=your-storage-account
```

## Redux Store Structure

### Auth Slice
- User authentication state
- Login/logout operations
- Token management
- Loading and error states

### Files Slice
- Uploaded files list
- File upload progress
- File selection state
- Azure integration

### Analysis Slice
- Analysis status tracking
- Results management
- Progress monitoring
- Error handling

## Deployment

- Build with `npm run build`
- Deploy static files to web server
- Configure environment variables for production

## Troubleshooting

### Common Issues
- Authentication failures: Check Azure AD configuration
- Upload issues: Verify SAS tokens and permissions
- API errors: Check backend server status
- Redux state issues: Use Redux DevTools for debugging

### Debug Tools
- Browser dev tools for network monitoring
- React Developer Tools for component debugging
- Redux DevTools for state management debugging
- Azure Application Insights for backend monitoring

This guide provides high-level direction while allowing flexibility in implementation details. 