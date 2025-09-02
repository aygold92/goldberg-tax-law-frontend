# Refactoring Action Plan

## Overview

This document outlines a comprehensive refactoring plan for the bank statement frontend application. The goal is to improve code organization, maintainability, and performance while following React best practices.

## Current State Analysis

### Issues Identified
1. **Monolithic Components**: Large components handling multiple responsibilities
2. **Mixed Concerns**: UI logic mixed with business logic
3. **Poor Separation**: Redux state management could be better organized
4. **Performance**: Missing optimizations like memoization and code splitting
5. **Type Safety**: Could benefit from more specific TypeScript patterns

### Completed Refactoring
- ✅ **Redux Split**: Successfully split `statements` slice into `statementsList` and `statementEditor`

## Detailed Action Plan

### Phase 1: Component Splitting (In Progress)

#### Phase 1.1: Split TransactionsTable.tsx

**Status**: 🔄 **PENDING**

**Changes Made**:
- Created generic `useTableSorting` hook for any ReactGrid table
- Split into focused components:
  - `TransactionsTable.tsx` (orchestrator)
  - `TransactionTableControls.tsx` (UI controls)
  - `TransactionTableGrid.tsx` (grid rendering)
  - `useTransactionFiltering.ts` (filtering logic)
  - `useTransactionActions.ts` (action logic)
- Fixed TypeScript issues and performance optimizations

**Files Created/Modified**:
```
src/
├── hooks/
│   ├── index.ts
│   └── useTableSorting.ts
└── components/
    └── transactions/
        ├── TransactionsTable.tsx (refactored)
        ├── TransactionTableControls.tsx (new)
        ├── TransactionTableGrid.tsx (new)
        └── hooks/
            ├── useTransactionFiltering.ts (new)
            └── useTransactionActions.ts (new)
```

#### Phase 1.2: Split TransactionFilter.tsx

**Status**: 🔄 **PENDING**

**Target Components**:
- `SearchFilter.tsx` - Search functionality
- `QuickFilters.tsx` - Quick filter buttons
- `AdvancedFilters.tsx` - Advanced filter logic
- `FilterBadge.tsx` - Filter badge display
- `useFilterLogic.ts` - Filter state management hook

**Implementation Steps**:
1. Extract search input and logic into `SearchFilter`
2. Extract quick filter buttons into `QuickFilters`
3. Extract advanced filter form into `AdvancedFilters`
4. Extract filter badge into `FilterBadge`
5. Create `useFilterLogic` hook for state management
6. Update `TransactionFilter` to orchestrate child components

**Files to Create**:
```
src/components/transactions/filters/
├── SearchFilter.tsx
├── QuickFilters.tsx
├── AdvancedFilters.tsx
├── FilterBadge.tsx
└── hooks/
    └── useFilterLogic.ts
```

### Phase 2: Project Structure Reorganization

#### Phase 2.1: Create New Directory Structure

**Status**: 🔄 **PENDING**

**New Structure**:
```
src/
├── common/           # Shared components
│   ├── LoadingSpinner.tsx
│   ├── ErrorBoundary.tsx
│   └── index.ts
├── layout/           # Layout components
│   ├── Layout.tsx
│   ├── ProtectedRoute.tsx
│   └── index.ts
├── forms/            # Form components
│   ├── DocumentUpload.tsx
│   └── index.ts
├── tables/           # Table components
│   ├── TransactionsTable/
│   ├── PagesTable.tsx
│   ├── StatementDetailsTable.tsx
│   └── index.ts
├── filters/          # Filter components
│   ├── TransactionFilter/
│   └── index.ts
├── display/          # Display components
│   ├── PdfDisplay.tsx
│   ├── AnalysisStatus.tsx
│   └── index.ts
├── features/         # Feature-specific components
│   ├── statements/
│   ├── transactions/
│   └── analysis/
└── shared/           # Shared utilities
    ├── constants/
    ├── helpers/
    └── types/
```

**Implementation Steps**:
1. Create new directory structure
2. Move components to appropriate directories
3. Update all import paths
4. Create index files for easier imports
5. Update documentation

#### Phase 2.2: Replace "utils" Directory

**Status**: 🔄 **PENDING**

**Current utils/ files**:
- `filterUtils.ts` → `src/features/transactions/services/transactionFilterService.ts`
- `validation.ts` → `src/features/statements/services/statementValidationService.ts`

**New shared structure**:
```
src/shared/
├── constants/
│   ├── api.ts
│   └── ui.ts
├── helpers/
│   ├── dateHelpers.ts
│   ├── numberHelpers.ts
│   └── stringHelpers.ts
└── types/
    ├── common.ts
    └── api.ts
```

**Implementation Steps**:
1. Create shared directory structure
2. Move utility functions to appropriate locations
3. Update imports across the application
4. Create proper service layer for business logic

### Phase 3: Custom Hooks Implementation

**Status**: 🔄 **PENDING**

#### Phase 3.1: Create Feature-Specific Hooks

**Transaction Hooks**:
- `useTransactionSorting` ✅ (completed as generic `useTableSorting`)
- `useTransactionFiltering` ✅ (completed)
- `useTransactionActions` ✅ (completed)
- `useTransactionValidation` (new)
- `useTransactionExport` (new)

**Statement Hooks**:
- `useStatementValidation` (new)
- `useStatementExport` (new)
- `useStatementImport` (new)

**Analysis Hooks**:
- `useAnalysisStatus` (new)
- `useAnalysisProgress` (new)

**UI Hooks**:
- `useLocalStorage` (new)
- `useDebounce` (new)
- `useClickOutside` (new)

#### Phase 3.2: Create Shared Hooks

**Status**: 🔄 **PENDING**

**Shared Hooks**:
```
src/hooks/
├── useTableSorting.ts ✅ (completed)
├── useLocalStorage.ts
├── useDebounce.ts
├── useClickOutside.ts
├── useAsync.ts
└── index.ts ✅ (completed)
```

### Phase 4: Performance Optimizations

**Status**: 🔄 **PENDING**

#### Phase 4.1: React.memo() Implementation

**Components to Memoize**:
- `TransactionTableControls`
- `TransactionTableGrid`
- `SearchFilter`
- `QuickFilters`
- `AdvancedFilters`
- `FilterBadge`
- `LoadingSpinner`
- `ErrorBoundary`

#### Phase 4.2: Virtualization

**Status**: 🔄 **PENDING**

**Target Components**:
- `TransactionsTable` - For large transaction lists
- `StatementsPage` - For large statement lists

**Implementation**:
- Use `react-window` or `react-virtualized` for large lists
- Implement virtual scrolling for better performance

#### Phase 4.3: Lazy Loading

**Status**: 🔄 **PENDING**

**Pages to Lazy Load**:
- `EditPage` ✅ (already implemented)
- `StatementsPage` ✅ (already implemented)
- `UploadPage` (new)
- `PdfSplitterPage` (new)

**Implementation**:
```typescript
const UploadPage = lazy(() => import('./pages/UploadPage'));
const PdfSplitterPage = lazy(() => import('./pages/PdfSplitterPage'));
```

### Phase 5: Type Safety Improvements

**Status**: 🔄 **PENDING**

#### Phase 5.1: Discriminated Unions

**Target Areas**:
- API response types
- Redux action types
- Component prop types

**Examples**:
```typescript
// API Response Types
type ApiResponse<T> = 
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }
  | { status: 'loading' };

// Redux Action Types
type StatementAction = 
  | { type: 'LOAD_STATEMENT'; payload: BankStatement }
  | { type: 'UPDATE_STATEMENT'; payload: Partial<BankStatement> }
  | { type: 'DELETE_STATEMENT'; payload: string };
```

#### Phase 5.2: Strict Type Checking

**Implementation**:
- Enable strict TypeScript options
- Add proper error handling types
- Improve API type definitions

### Phase 6: Testing Strategy

**Status**: 🔄 **PENDING**

#### Phase 6.1: Unit Tests

**Target Areas**:
- Custom hooks
- Utility functions
- Redux selectors and reducers

**Test Structure**:
```
test/
├── hooks/
│   ├── useTableSorting.test.ts
│   ├── useTransactionFiltering.test.ts
│   └── useTransactionActions.test.ts
├── utils/
│   ├── filterUtils.test.ts ✅ (exists)
│   └── validation.test.ts
└── redux/
    ├── statementsList.test.ts
    └── statementEditor.test.ts
```

#### Phase 6.2: Component Tests

**Target Components**:
- All new split components
- Critical business logic components

### Phase 7: Documentation Updates

**Status**: 🔄 **PENDING**

#### Phase 7.1: Code Documentation

**Target Files**:
- All new components
- Custom hooks
- Utility functions
- Redux slices

#### Phase 7.2: Architecture Documentation

**Documents to Update**:
- `project_structure.md`
- `implementation.md`
- `UI_UX_doc.md`

## Implementation Priority

### High Priority (Core Functionality)
1. ✅ Phase 1.1: Split TransactionsTable.tsx
2. 🔄 Phase 1.2: Split TransactionFilter.tsx
3. 🔄 Phase 2.1: Project Structure Reorganization
4. 🔄 Phase 2.2: Replace "utils" Directory

### Medium Priority (Performance & Maintainability)
5. 🔄 Phase 3: Custom Hooks Implementation
6. 🔄 Phase 4: Performance Optimizations
7. 🔄 Phase 5: Type Safety Improvements

### Low Priority (Quality & Testing)
8. 🔄 Phase 6: Testing Strategy
9. 🔄 Phase 7: Documentation Updates

## Success Criteria

### Phase 1 Success Criteria
- [x] TransactionsTable split into focused components
- [ ] TransactionFilter split into focused components
- [ ] All components maintain existing functionality
- [ ] No TypeScript compilation errors
- [ ] Improved code readability

### Phase 2 Success Criteria
- [ ] Logical directory structure
- [ ] Clean import paths
- [ ] Proper separation of concerns
- [ ] No broken imports

### Phase 3 Success Criteria
- [ ] Reusable custom hooks
- [ ] Reduced code duplication
- [ ] Improved testability
- [ ] Better separation of concerns

### Phase 4 Success Criteria
- [ ] Improved performance metrics
- [ ] Reduced bundle size
- [ ] Faster initial load times
- [ ] Better user experience

### Phase 5 Success Criteria
- [ ] Strict TypeScript compliance
- [ ] Better error handling
- [ ] Improved developer experience
- [ ] Reduced runtime errors

## Risk Mitigation

### Technical Risks
1. **Breaking Changes**: Implement changes incrementally with thorough testing
2. **Performance Regression**: Monitor performance metrics during refactoring
3. **Type Errors**: Maintain strict TypeScript checking throughout

### Process Risks
1. **Scope Creep**: Stick to the defined phases
2. **Testing Gaps**: Ensure comprehensive testing at each phase
3. **Documentation Lag**: Update documentation as changes are made

## Monitoring & Metrics

### Code Quality Metrics
- TypeScript compilation success
- ESLint warnings/errors
- Test coverage
- Bundle size

### Performance Metrics
- Initial load time
- Component render times
- Memory usage
- User interaction responsiveness

## Conclusion

This refactoring plan provides a structured approach to improving the codebase while maintaining functionality and improving maintainability. Each phase builds upon the previous one, ensuring a smooth transition and minimal disruption to the development process.

The plan prioritizes core functionality improvements first, followed by performance optimizations and quality enhancements. This approach ensures that the most critical improvements are implemented early while maintaining a clear path for future enhancements. 