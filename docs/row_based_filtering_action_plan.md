# Row-Based Filtering Implementation Action Plan

## Overview
Transform the current transaction-specific filtering system into a generic, row-based filtering system that works with any ReactGrid table. The filtering should operate on ReactGrid `Row` objects rather than the underlying data, similar to how sorting currently works.

## Current State
- ✅ `FilterableColumn.ts` - Updated to support row-based filtering with `QuickFilterFunction = (rowId: string) => boolean`
- ✅ `GenericFilterUtils.ts` - Updated to work with `Row<any>[]` instead of data arrays
- ❌ `TransactionsTable.tsx` - Still using old data-based filtering approach
- ❌ Missing proper imports and integration

## Required Changes

### 1. Update TransactionsTable.tsx Imports
**File:** `src/components/TransactionsTable.tsx`
**Lines:** ~30-35

**Current:**
```typescript
import { FilterState, FilterCriteria, applyFilters } from '../utils/filterUtils';
```

**Change to:**
```typescript
import { FilterState, FilterCriteria, applyFilters } from '../utils/filterUtils';
import { GenericFilter, GenericFilterPopover, FilterableColumn, GenericFilterState, GenericFilterCriteria, applyGenericFilters, QuickFilterFunction, QuickFilterConfig } from './reactgrid';
import { Warning, Add, TrendingUp, TrendingDown } from '@mui/icons-material';
```

### 2. Update Filter State Type
**File:** `src/components/TransactionsTable.tsx`
**Lines:** ~110-120

**Current:**
```typescript
const [filters, setFilters] = useState<FilterState>({
  searchText: '',
  advancedFilters: [],
  showSuspicious: false,
  showNew: false,
  showIncome: false,
  showExpenses: false
});
```

**Change to:**
```typescript
const [filters, setFilters] = useState<GenericFilterState>({
  searchText: '',
  advancedFilters: [],
  quickFilters: {}
});
```

### 3. Update Quick Filters Definition
**File:** `src/components/TransactionsTable.tsx`
**Lines:** ~140-170

**Current:**
```typescript
const quickFilters: Record<string, QuickFilterFunction<TransactionHistoryRecord>> = {
  suspicious: (transaction) => {
    if (!statement) return false;
    return statement.suspiciousReasons.some(reason => 
      reason.transactionId === transaction.id
    );
  },
  new: (transaction) => transaction.isNew,
  income: (transaction) => transaction.amount > 0,
  expenses: (transaction) => transaction.amount < 0,
};
```

**Change to:**
```typescript
const quickFilters: Record<string, QuickFilterFunction> = {
  suspicious: (rowId) => {
    if (!statement) return false;
    const transaction = statement.transactions.find(t => t.id === rowId);
    if (!transaction) return false;
    return statement.suspiciousReasons.some(reason => 
      reason.transactionId === transaction.id
    );
  },
  new: (rowId) => {
    const transaction = statement?.transactions.find(t => t.id === rowId);
    return transaction?.isNew || false;
  },
  income: (rowId) => {
    const transaction = statement?.transactions.find(t => t.id === rowId);
    return (transaction?.amount || 0) > 0;
  },
  expenses: (rowId) => {
    const transaction = statement?.transactions.find(t => t.id === rowId);
    return (transaction?.amount || 0) < 0;
  },
};
```

### 4. Add Quick Filter Configuration
**File:** `src/components/TransactionsTable.tsx`
**Lines:** After quickFilters definition

**Add:**
```typescript
const quickFilterConfig: QuickFilterConfig[] = [
  {
    key: 'suspicious',
    label: 'Suspicious',
    icon: Warning,
    color: 'warning',
    tooltip: 'Show suspicious transactions'
  },
  {
    key: 'new',
    label: 'New',
    icon: Add,
    color: 'primary',
    tooltip: 'Show new transactions'
  },
  {
    key: 'income',
    label: 'Income',
    icon: TrendingUp,
    color: 'success',
    tooltip: 'Show income transactions'
  },
  {
    key: 'expenses',
    label: 'Expenses',
    icon: TrendingDown,
    color: 'error',
    tooltip: 'Show expense transactions'
  }
];
```

### 5. Remove valueGetter Function
**File:** `src/components/TransactionsTable.tsx`
**Lines:** ~125-135

**Remove the entire valueGetter function:**
```typescript
// Remove this entire function
const valueGetter: ValueGetter<TransactionHistoryRecord> = (row, columnId) => {
  // ... function body
};
```

### 6. Update Columns Definition
**File:** `src/components/TransactionsTable.tsx`
**Lines:** ~180-220

**Current:** Uses regular Column type
**Change to:** Use FilterableColumn type with proper metadata

```typescript
const columns: FilterableColumn[] = useMemo(() => [
  {
    columnId: 'suspiciousReasons',
    width: columnWidths.suspiciousReasons,
    resizable: false,
    reorderable: false,
    filterable: false, // No filtering for this column
    nonSearchable: true, // Not included in search
  },
  { 
    columnId: 'date', 
    width: columnWidths.date, 
    resizable: true,
    filterable: true,
    filterType: 'date',
    filterLabel: 'Date',
    nonSearchable: false, // Include in search
  },
  { 
    columnId: 'description', 
    width: columnWidths.description, 
    resizable: true,
    filterable: true,
    filterType: 'text',
    filterLabel: 'Description',
    nonSearchable: false, // Include in search
  },
  { 
    columnId: 'amount', 
    width: columnWidths.amount, 
    resizable: true,
    filterable: true,
    filterType: 'number',
    filterLabel: 'Amount',
    nonSearchable: false, // Include in search
  },
  // ... continue for all other columns
], [columnWidths]);
```

### 7. Remove filteredTransactions useMemo
**File:** `src/components/TransactionsTable.tsx`
**Lines:** ~280-300

**Remove the entire filteredTransactions useMemo:**
```typescript
// Remove this entire useMemo
const filteredTransactions = useMemo(() => {
  if (!statement) return [];
  return applyGenericFilters(
    statement.transactions, 
    filters, 
    columns, 
    valueGetter, 
    quickFilters
  );
}, [statement, filters, columns, quickFilters]);
```

### 8. Update Rows Generation
**File:** `src/components/TransactionsTable.tsx`
**Lines:** ~350-400

**Current:** Uses filteredTransactions
**Change to:** Create all rows first, then apply row-based filtering

```typescript
// Create all rows from all transactions
const allRows: Row<any>[] = useMemo(() => {
  if (!statement) return [];
  
  return statement.transactions.map((transaction, index) => ({
    rowId: transaction.id,
    height: 35,
    cells: [
      // ... existing cell definitions
    ]
  }));
}, [statement, columns, isCreditCard]);

// Apply row-based filtering
const filteredRows = useMemo(() => {
  if (!statement) return [];
  return applyGenericFilters(
    allRows,
    filters,
    columns,
    quickFilters
  );
}, [allRows, filters, columns, quickFilters]);

// Apply sorting to filtered rows
const sortedRows = useMemo(() => {
  return sortRows(filteredRows, sorting, columns);
}, [filteredRows, sorting, columns]);
```

### 9. Update Filter Handlers
**File:** `src/components/TransactionsTable.tsx`
**Lines:** ~310-330

**Current:**
```typescript
const handleApplyFilter = (filter: FilterCriteria | null) => {
  // ... existing implementation
};
```

**Change to:**
```typescript
const handleApplyFilter = (filter: GenericFilterCriteria | null) => {
  if (filter) {
    const existingFilters = filters.advancedFilters.filter(f => f.columnId !== filter.columnId);
    setFilters(prev => ({
      ...prev,
      advancedFilters: [...existingFilters, filter]
    }));
  } else {
    setFilters(prev => ({
      ...prev,
      advancedFilters: []
    }));
  }
};
```

### 10. Update JSX Components
**File:** `src/components/TransactionsTable.tsx`
**Lines:** ~800-850

**Current:** Uses TransactionFilter and TransactionFilterPopover
**Change to:** Use GenericFilter and GenericFilterPopover

```typescript
{/* Replace TransactionFilter with GenericFilter */}
<GenericFilter
  filters={filters}
  onFiltersChange={setFilters}
  columns={columns}
  quickFilterConfig={quickFilterConfig}
  searchPlaceholder="Search transactions..."
/>

{/* Replace TransactionFilterPopover with GenericFilterPopover */}
{activeFilterColumn && (() => {
  const column = columns.find(col => col.columnId === activeFilterColumn);
  if (!column) return null;
  
  return (
    <GenericFilterPopover
      anchorEl={filterAnchorEl}
      open={Boolean(filterAnchorEl)}
      onClose={() => setFilterAnchorEl(null)}
      column={column}
      currentFilter={filters.advancedFilters.find(f => f.columnId === activeFilterColumn)}
      onApplyFilter={handleApplyFilter}
    />
  );
})()}
```

### 11. Update ReactGrid Props
**File:** `src/components/TransactionsTable.tsx`
**Lines:** ~850-900

**Current:** Uses sortedRows
**Change to:** Use sortedRows (should already be correct)

```typescript
<ReactGrid
  rows={sortedRows}
  columns={columns}
  // ... other props
/>
```

## Testing Steps

1. **Build Check:** Run `npm run build` to ensure no TypeScript errors
2. **Import Verification:** Check that all imports are properly resolved
3. **Filter Functionality:** Test each filter type:
   - Global search
   - Quick filters (suspicious, new, income, expenses)
   - Advanced column filters
4. **Integration Test:** Verify filtering works with sorting
5. **Performance Test:** Ensure filtering is responsive with large datasets

## Expected Outcome

After implementing these changes:
- ✅ Filtering operates on ReactGrid Row objects
- ✅ Generic filtering system is reusable across different tables
- ✅ All existing functionality is preserved
- ✅ Performance is maintained or improved
- ✅ Type safety is maintained throughout

## Files Modified

1. `src/components/TransactionsTable.tsx` - Main implementation
2. `src/components/reactgrid/FilterableColumn.ts` - Already updated
3. `src/components/reactgrid/GenericFilterUtils.ts` - Already updated

## Notes

- The `edit_file` tool may have issues preserving imports, so manual verification of imports is recommended
- If imports are lost during editing, they can be manually added back
- The row-based approach should be more performant as it avoids recreating the entire data structure
- All existing functionality should be preserved, just implemented differently
