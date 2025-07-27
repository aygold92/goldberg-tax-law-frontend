# Project Structure

## Overview

This React TypeScript application is organized by feature and functionality. The structure prioritizes clarity and maintainability over rigid conventions. The application uses Redux Toolkit for state management, providing centralized state for authentication, file management, and analysis workflows.

## Directory Organization

```
src/
├── components/     # Reusable UI components
├── pages/         # Route-level components
├── redux/         # Redux state management
│   ├── store/     # Redux store configuration
│   ├── features/  # Feature-based Redux slices
│   └── hooks/     # Custom Redux hooks
├── services/      # External API integrations
├── types/         # TypeScript definitions
└── [other files]  # App entry point and config
```

## Key Directories

### components/
Reusable UI components that can be used across multiple pages.

**Examples:**
- `Layout.tsx` - Main app layout with navigation
- `DocumentUpload.tsx` - File upload functionality
- `ClientSelector.tsx` - Client selection interface

### pages/
Top-level components that correspond to routes in the application.

**Examples:**
- `LoginPage.tsx` - Authentication page
- `UploadPage.tsx` - Document upload workflow
- `StatementsPage.tsx` - View statements (placeholder)

### redux/
Redux state management organized in a dedicated directory.

#### redux/store/
Redux store configuration and setup.

**Examples:**
- `index.ts` - Store setup and root reducer
- `middleware.ts` - Custom middleware (if needed)

#### redux/features/
Feature-based Redux slices organized by domain.

**Examples:**
- `auth/` - Authentication state management
  - `authSlice.ts` - Auth state and actions
  - `authSelectors.ts` - Auth state selectors
- `files/` - File upload and management
  - `filesSlice.ts` - File state and actions
  - `filesSelectors.ts` - File state selectors
- `analysis/` - Analysis status and results
  - `analysisSlice.ts` - Analysis state and actions
  - `analysisSelectors.ts` - Analysis state selectors

#### redux/hooks/
Custom Redux hooks for type-safe state access.

**Examples:**
- `useAppDispatch.ts` - Typed dispatch hook
- `useAppSelector.ts` - Typed selector hook

### services/
External service integrations and API communication.

**Examples:**
- `auth.ts` - Azure AD authentication
- `api.ts` - Backend API communication

### types/
TypeScript interface definitions.

**Examples:**
- `api.ts` - API request/response types
- `store.ts` - Redux store types

## File Naming Conventions

- **Components**: PascalCase (e.g., `DocumentUpload.tsx`)
- **Services**: camelCase (e.g., `auth.ts`)
- **Types**: camelCase (e.g., `api.ts`)
- **Pages**: PascalCase with "Page" suffix (e.g., `LoginPage.tsx`)
- **Redux Slices**: camelCase with "Slice" suffix (e.g., `authSlice.ts`)
- **Redux Selectors**: camelCase with "Selectors" suffix (e.g., `authSelectors.ts`)

## Import Patterns

### Component Imports
```typescript
// Default exports for main components
import Layout from './components/Layout';
import DocumentUpload from './components/DocumentUpload';
```

### Redux Imports
```typescript
// Typed hooks for Redux
import { useAppDispatch, useAppSelector } from './redux/hooks';
import { authActions } from './redux/features/auth/authSlice';
import { selectUser } from './redux/features/auth/authSelectors';
```

### Service Imports
```typescript
// Singleton service instances
import apiService from './services/api';
import authService from './services/auth';
```

### Type Imports
```typescript
// Named exports for types
import { ApiResponse, DocumentStatus } from './types/api';
import { RootState, AppDispatch } from './redux/store';
```

## Adding New Features

### New Component
1. Create file in appropriate directory
2. Add TypeScript interfaces if needed
3. Export component (default or named)
4. Import and use in parent component

### New Page
1. Create component in `pages/` directory
2. Add route in `App.tsx`
3. Update navigation if needed

### New Redux Feature
1. Create feature directory in `redux/features/`
2. Create slice file with state and actions
3. Create selectors file for state access
4. Add to root reducer in `redux/store/index.ts`
5. Export actions and selectors

### New Service
1. Create file in `services/` directory
2. Define types in `types/` if needed
3. Export service instance
4. Import and use in components or Redux thunks

## Redux State Management

### Store Structure
```typescript
interface RootState {
  auth: AuthState;
  files: FilesState;
  analysis: AnalysisState;
}
```

### Slice Pattern
```typescript
// features/auth/authSlice.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Actions
  },
  extraReducers: (builder) => {
    // Async actions
  }
});
```

### Selector Pattern
```typescript
// features/auth/authSelectors.ts
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
```

### Component Usage
```typescript
const Component = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  
  const handleAction = () => {
    dispatch(authActions.someAction());
  };
};
```

## Configuration Files

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `.env` - Environment variables (not in repo)

## Development Workflow

1. **Start Development**: `npm start`
2. **Run Tests**: `npm test`
3. **Build Production**: `npm run build`

## Common Patterns

### Component Structure
```typescript
interface ComponentProps {
  // Define props
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  const dispatch = useAppDispatch();
  const someState = useAppSelector(selectSomeState);
  
  // Component logic
  return (
    // JSX
  );
};

export default Component;
```

### Redux Slice Structure
```typescript
interface SliceState {
  // State interface
}

const initialState: SliceState = {
  // Initial state
};

const slice = createSlice({
  name: 'sliceName',
  initialState,
  reducers: {
    // Synchronous actions
  },
  extraReducers: (builder) => {
    // Async actions
  }
});

export const { actions } = slice;
export default slice.reducer;
```

### Service Structure
```typescript
class Service {
  // Service methods
}

export default new Service();
```

## Testing

- Test files co-located with components (future)
- Integration tests for workflows
- Unit tests for utilities
- Redux state testing with Redux Toolkit's test utilities

## Deployment

- Static file hosting
- Environment-specific builds
- Azure integration for production

This structure provides flexibility while maintaining organization and clarity, with Redux Toolkit providing robust state management for complex application state. 