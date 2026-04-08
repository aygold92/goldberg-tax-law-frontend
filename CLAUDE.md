# CLAUDE.md — Bank Statement Frontend

## Project Overview

A React + TypeScript app for extracting and managing financial transaction data from PDF bank statements. The workflow is:

1. Upload PDFs → stored in Azure Blob Storage
2. Trigger backend analysis → Azure Function processes the PDFs via document AI
3. Review & edit extracted data → editable grid interface
4. Export → CSV or Google Sheets

The app is used in a legal/forensic accounting context. "Suspicious reasons" are data quality warnings flagged on transactions or statements that don't pass validation (missing fields, date mismatches, balance calculation errors, etc.).

The backend is a **separate Azure Functions project** (not in this repo). The API contract is defined entirely by the types in `src/types/api.ts` and `src/types/bankStatement.ts`. Do not attempt to modify or reference backend code.

---

## Tech Stack

| Category | Library / Version |
|---|---|
| Framework | React 18.3, TypeScript 4.9 |
| Build tool | Create React App (react-scripts 5) |
| State management | Redux Toolkit 2.2, React Redux 9.1 |
| UI components | MUI v6 (Material-UI) + MUI X DataGrid v7 + MUI X Date Pickers v8 |
| Editable grid | @silevis/reactgrid 4.1 |
| HTTP | axios 1.7 (via centralized `ApiService`) |
| Authentication | @azure/msal-browser 3.7, @azure/msal-react 2.2 |
| Routing | React Router v6 |
| PDF manipulation | pdf-lib 1.17, jszip 3.10 |
| Drag/drop upload | react-dropzone 14.2 |
| Draggable panels | react-rnd 10.3 |
| Date utilities | date-fns 4.1 |
| Google Sheets (WIP) | gapi-script 1.2 |
| Testing | Jest + @testing-library/react 16 |

---

## Dev Commands

```bash
npm start          # Dev server on port 3000 (hot reload)
npm run build      # Production build → /build
npm test           # Jest tests (watch mode)
npm run test:debug # Jest, no watch, no cache, single-threaded
```

---

## Environment Variables

Create a `.env` file at the project root. All variables must be prefixed with `REACT_APP_`:

```env
REACT_APP_API_BASE_URL=http://localhost:7071
REACT_APP_AZURE_STORAGE_ACCOUNT=<storage_account_name>
REACT_APP_AZURE_CLIENT_ID=<azure_app_client_id>
REACT_APP_AZURE_TENANT_ID=<azure_tenant_id>
```

The `ApiService` defaults to `http://localhost:3001` if `REACT_APP_API_BASE_URL` is not set.

---

## Application Routes

| Path | Component | Auth Required |
|---|---|---|
| `/login` | `LoginPage` | No |
| `/` | `UploadPage` | Yes |
| `/statements` | `StatementsPage` | Yes |
| `/edit` | `EditPage` | Yes |
| `/view-file` | `ViewFileDataPage` | Yes |
| `/pdf-splitter` | `PdfSplitterPage` | No |

Protected routes are wrapped in `<ProtectedRoute>` which redirects to `/login` if unauthenticated. All authenticated pages are also wrapped in `<Layout>` (provides nav bar).

---

## Architecture & Data Flow

### State Management

All application state lives in Redux. The store is configured in `src/redux/store/index.ts`.

**Slices:**

| Slice key | File | Purpose |
|---|---|---|
| `auth` | `features/auth/authSlice.ts` | Azure AD auth state |
| `files` | `features/files/filesSlice.ts` | Upload workflow state |
| `analysis` | `features/analysis/analysisSlice.ts` | Analysis progress polling |
| `client` | `features/client/clientSlice.ts` | Selected client |
| `statementsList` | `features/statementsList/statementsListSlice.ts` | List of all statements |
| `statementEditor` | `features/statementEditor/statementEditorSlice.ts` | Currently-open statement being edited |
| `csvOutput` | `features/csvOutput/csvOutputSlice.ts` | CSV/export state |
| `googleAuth` | `features/googleAuth/googleAuthSlice.ts` | Google Sheets auth (WIP) |

Use the typed hooks from `src/redux/hooks/index.ts`:
```typescript
import { useAppDispatch, useAppSelector } from '../redux/hooks';
```
Never use raw `useDispatch` / `useSelector` — always use the typed wrappers.

### API Layer

All backend calls go through the singleton `ApiService` class in `src/services/api.ts`. Import via:
```typescript
import apiService from '../services/api';
```

**Never construct axios calls directly** in components or slices. Add new endpoints as methods on `ApiService`.

Auth tokens are injected automatically via an axios request interceptor — do not manually attach Bearer tokens anywhere.

The API has a **120-second timeout** intentionally (backend document analysis is slow).

### Adding a New Redux Slice

Follow the existing pattern:
1. Create `src/redux/features/<name>/<name>Slice.ts` — define `interface <Name>State`, `initialState`, async thunks, and the slice
2. Export the reducer as default and named action creators
3. Add the reducer to `src/redux/store/index.ts`
4. Optionally create `<name>Selectors.ts` alongside the slice for memoized selectors

---

## Component Organization

### Two-tier convention

**Simple components** — single file directly in `src/components/`:
```
src/components/ClientSelector.tsx
src/components/DocumentUpload.tsx
```

**Complex components** — their own folder with sub-structure:
```
src/components/AccountSummary/
├── index.ts                    # Barrel export
├── AccountSummary.tsx          # Root component
├── components/                 # Sub-components
│   ├── AccountGroupCard.tsx
│   └── StatementTooltip.tsx
├── hooks/                      # Component-scoped hooks
│   ├── useAccountSummaryData.ts
│   └── useStatementNavigation.ts
└── types/                      # Component-scoped types
    └── accountSummary.ts
```

Use the complex structure when a component has more than one meaningful sub-component or needs local hooks/types.

Always create an `index.ts` barrel file for complex components.

### Pages vs Components

- **`src/pages/`** — route-level containers; they own business logic and dispatch Redux actions
- **`src/components/`** — presentational; receive props or read from Redux, but pages orchestrate the overall flow

---

## Key Gotchas

### Redux Serialization: `SerializableUser` vs `AccountInfo`

MSAL's `AccountInfo` type is **not Redux-serializable**. The `authSlice` converts it to a plain `SerializableUser` object (only `name: string` and `email: string`) before storing in Redux. **Never put `AccountInfo` directly into Redux state.**

```typescript
// Correct — what's stored in Redux
interface SerializableUser {
  name: string;
  email: string;
}
```

### Balance Calculation: Credit Cards vs Bank Accounts

The validation logic treats credit card and bank statements differently:

- **Bank accounts**: `endingBalance - beginningBalance` should equal sum of transactions
- **Credit cards**: `beginningBalance - endingBalance` should equal sum of transactions

A classification containing `" CC"` (e.g. `"AMEX CC"`, `"WF CC"`) is treated as a credit card. See `src/utils/validation.ts`.

### Strict Null Checks

`strictNullChecks` is enabled in `tsconfig.json`. Many fields on `BankStatement` and `TransactionHistoryRecord` are explicitly `null`-able. Handle nulls carefully throughout.

### Transaction Validation Exception

Transactions whose `description` starts with `"interest rate change from"` (case-insensitive) are exempt from the amount-required validation rule.

---

## Undo/Redo System

The `undoRedoMiddleware` (in `src/redux/middleware/undoRedoMiddleware.ts`) automatically snapshots `statementEditor` state before any tracked action, maintaining an undo stack (max 50 entries). The redo stack is cleared on any new edit action, and both stacks are reset on load or save.

To use undo/redo in a component:
```typescript
import { useUndoRedo } from '../redux/hooks/useUndoRedo';

const { canUndo, canRedo, undo, redo } = useUndoRedo();
```

Keyboard shortcuts (`Ctrl+Z` / `Cmd+Z` to undo, `Ctrl+Y` / `Cmd+Shift+Z` to redo) are wired automatically inside `useUndoRedo`.

**When adding new editable fields to `statementEditor`**, add the corresponding action type string to the `TRACKED_ACTIONS` array in `undoRedoMiddleware.ts` so undo/redo covers it.

---

## Change Tracking in `statementEditor`

The slice tracks unsaved changes via **per-entity hash comparison** (not a simple boolean). On load, hashes are computed for each transaction, page, and statement field. On save, dirty entities are identified by comparing current vs original hashes.

The `hasUnsavedChanges` boolean in slice state is set to `true` whenever any reducer modifies the current statement — this is what drives the "unsaved changes" UI indicator.

---

## Validation & Suspicious Reasons

`src/utils/validation.ts` exports:
- `validateBankStatement(statement)` → `ValidationResult` (hard errors, blocks save)
- `validateTransaction(transaction, statement)` → `ValidationError[]`
- `calculateStatementSuspiciousReasons(statement)` → `string[]` (soft warnings, shown in UI)
- `calculateTransactionSuspiciousReasons(transaction, statement)` → `string[]`

"Suspicious reasons" are soft warnings shown in the UI to flag data quality issues. They do not block saving. Validation errors do.

Required fields for a valid statement: `filename`, `classification`, `date`, `accountNumber`, `beginningBalance`, `endingBalance`.

Required fields for a valid transaction: `date`, `description`, `amount` (with exception above), `filePageNumber` (must be in statement's page list).

---

## Core Data Types

Defined in `src/types/bankStatement.ts`:

```typescript
interface BankStatement {
  pageMetadata: ClassifiedPdfMetadata   // filename, pages[], classification
  date: string | null
  accountNumber: string | null
  beginningBalance: number | null
  endingBalance: number | null
  interestCharged: number | null
  feesCharged: number | null
  transactions: TransactionHistoryRecord[]
  batesStamps: Record<number, string>   // page number → bates stamp
  checks: Record<number, ClassifiedPdfMetadata>
  netTransactions: number
  totalSpending: number
  totalIncomeCredits: number
  suspiciousReasons?: string[]
}

interface TransactionHistoryRecord {
  id: string
  date?: string | null
  checkNumber?: number | null
  description?: string | null
  amount?: number | null | undefined
  filePageNumber?: number | null
  checkDataModel?: CheckDataModel | null
  suspiciousReasons?: string[]
}

enum ClassificationType {
  AMEX_CC = "AMEX CC", C1_CC = "C1 CC", CITI_CC = "CITI CC",
  WF_CC = "WF CC", BOFA_CC = "BofA CC", BOFA_CC_BUSINESS = "BofA CC Business",
  NFCU_CC = "NFCU CC", CAPITAL_ONE_JOINT = "Capital One Joint",
  EAGLE_BANK = "Eagle Bank", WF_BANK = "WF Bank", WF_BANK_JOINT = "WF Bank Joint",
  BOFA = "BofA", NFCU_BANK = "NFCU Bank", TRUIST = "Truist",
  SANDY_SPRING = "Sandy Spring", ATLANTIC_UNION = "Atlantic Union",
  MT_BANK = "M&T Bank", CHECKS = "Checks"
}
```

---

## Testing

Tests live in `__tests__/` subdirectories co-located with the code they test.

```
src/components/ReactGridTable/filter/__tests__/filterOperations.test.ts
src/components/ReactGridTable/hooks/__tests__/useTableSorting.test.ts
src/hooks/__tests__/usePageTitle.test.ts
```

Test file naming: `<name>.test.ts` or `<name>.test.tsx`.

Pages and Redux slices currently have no tests. Focus new tests on utility functions and hooks.

---

## Linting & Formatting

ESLint is configured via the `eslintConfig` field in `package.json` (extends `react-app` and `react-app/jest` — standard CRA configuration). There is **no Prettier** configured. Do not add Prettier formatting or a `.prettierrc`.

---

## Google Sheets Integration (WIP)

The Google Sheets export feature (`src/services/googleSheets.ts`, `googleAuthSlice`, `csvOutputSlice`, `GoogleSignIn` component) exists but is **incomplete**. Google API credentials are currently hard-coded in `googleSheets.ts` and should eventually be moved to environment variables. Treat this feature as work-in-progress and do not rely on it being fully functional.

---

## Key Files Reference

| File | Purpose |
|---|---|
| `src/App.tsx` | Root component — Redux Provider, ThemeProvider, Router, routes |
| `src/theme.ts` | MUI theme (colors, typography, component overrides) |
| `src/redux/store/index.ts` | Store config, `RootState` and `AppDispatch` types |
| `src/redux/hooks/index.ts` | `useAppDispatch`, `useAppSelector` typed hooks |
| `src/services/api.ts` | All backend API calls — the only place HTTP requests are made |
| `src/services/auth.ts` | MSAL wrapper for Azure AD authentication |
| `src/types/bankStatement.ts` | Core domain types (`BankStatement`, `TransactionHistoryRecord`, etc.) |
| `src/types/api.ts` | All API request/response types |
| `src/utils/validation.ts` | Statement and transaction validation + suspicious reason calculation |
| `src/utils/filenameUtils.ts` | Filename formatting helpers |
| `src/pages/EditPage.tsx` | Main statement editing page |
| `src/components/TransactionsTable.tsx` | Editable transaction grid (reactgrid-based) |
| `src/components/AccountSummary/` | Timeline visualization of statements by account |
| `src/redux/middleware/undoRedoMiddleware.ts` | Undo/redo state tracking |
