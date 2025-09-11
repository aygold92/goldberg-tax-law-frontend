/**
 * DocumentClassificationEditor component exports.
 * 
 * This barrel file exports all components and utilities related to
 * document classification editing functionality.
 */

export { default as DocumentClassificationEditor } from './DocumentClassificationEditor';

// Hooks
export { useDocumentClassifications } from './hooks/useDocumentClassifications';
export { useAnalyzePage } from './hooks/useAnalyzePage';
export { useSnackbar } from './hooks/useSnackbar';
export { useValidation } from './hooks/useValidation';

// Components
export { default as ClassificationInput } from './components/ClassificationInput';
export { default as ClassificationList } from './components/ClassificationList';
export { default as ClassificationBadge } from './components/ClassificationBadge';
export { default as AnalyzePageResult } from './components/AnalyzePageResult';
export { default as ReloadConfirmationDialog } from './components/ReloadConfirmationDialog';

// Legacy exports (for backward compatibility)
export { default as PageSelector } from './PageRangeSelector';
export { default as ClassificationDropdown } from './ClassificationDropdown';
