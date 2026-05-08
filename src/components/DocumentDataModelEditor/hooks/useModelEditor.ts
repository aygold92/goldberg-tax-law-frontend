import { useState, useEffect, useCallback } from 'react';
import apiService from '../../../services/api';

interface UseModelEditorProps {
  classificationId: string;
  classification: string; // for validation logic
  initialModel: any;
}

// Pure validation function — no React dependencies, easy to test
export function validateModel(json: string, classification: string): string | null {
  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch (e: any) {
    return `Invalid JSON: ${e.message}`;
  }

  // Every model type must have a top-level classification object (Classification from api.ts)
  const cls = parsed?.classification;
  if (!cls || typeof cls !== 'object') {
    return 'Missing required field: classification (must be a Classification object)';
  }
  if (!cls.info || typeof cls.info !== 'object') {
    return 'classification.info is missing or invalid';
  }
  if (typeof cls.info.classificationType !== 'string' || !cls.info.classificationType) {
    return 'classification.info.classificationType must be a non-empty string';
  }

  if (classification.startsWith('Checks')) {
    // All CheckDataModel fields are optional — only reject unknown keys
    const allowed = new Set([
      'classification',
      'accountNumber', 'checkNumber', 'to', 'description',
      'date', 'amount', 'batesStamp', 'checkEntries',
    ]);
    const unknown = Object.keys(parsed).filter(k => !allowed.has(k));
    if (unknown.length > 0) {
      return `CheckDataModel contains unknown fields: ${unknown.join(', ')}`;
    }
  } else if (classification.startsWith('Extra Pages')) {
    const extra = Object.keys(parsed).filter(k => k !== 'classification');
    if (extra.length > 0) {
      return `Extra Pages model must only contain classification, but found: ${extra.join(', ')}`;
    }
  } else {
    // Statement data model — validate against known keys
    const allowed = new Set([
      'classification',
      'documentType', 'date', 'accountNumber',
      'beginningBalance', 'endingBalance', 'feesCharged', 'interestCharged',
      'summaryOfAccountsTable',
      'transactionTableDepositWithdrawal', 'transactionTableAmount',
      'transactionTableCreditsCharges', 'transactionTableDebits',
      'transactionTableCredits', 'transactionTableChecks',
      'batesStampsTable',
    ]);
    const unknown = Object.keys(parsed).filter(k => !allowed.has(k));
    if (unknown.length > 0) {
      return `StatementDataModel contains unknown fields: ${unknown.join(', ')}`;
    }
  }

  return null;
}

// Returns soft warnings for statement data models when certain expected fields are absent.
// Only runs when the JSON is already valid (no hard errors).
export function warnModel(json: string, classification: string): string[] {
  if (classification.startsWith('Checks') || classification.startsWith('Extra Pages')) return [];
  let parsed: any;
  try { parsed = JSON.parse(json); } catch { return []; }

  const warnings: string[] = [];

  if (!parsed.date) {
    warnings.push('Missing: date');
  }

  // Need either summaryOfAccountsTable OR all three of accountNumber/beginningBalance/endingBalance
  if (!parsed.summaryOfAccountsTable) {
    const missing = ['accountNumber', 'beginningBalance', 'endingBalance']
      .filter(k => parsed[k] == null);
    if (missing.length > 0) {
      warnings.push(`Missing: ${missing.join(', ')} (or summaryOfAccountsTable)`);
    }
  }

  return warnings;
}

export const useModelEditor = ({ classificationId, classification, initialModel }: UseModelEditorProps) => {
  const [editedJson, setEditedJson] = useState<string>(() => JSON.stringify(initialModel, null, 2));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showDiff, setShowDiff] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  useEffect(() => {
    const err = validateModel(editedJson, classification);
    setValidationError(err);
    setIsValid(err === null);
    setWarnings(err === null ? warnModel(editedJson, classification) : []);
  }, [editedJson, classification]);

  const handleShowDiff = useCallback(() => {
    if (isValid) setShowDiff(true);
  }, [isValid]);

  const handleBackToEditor = useCallback(() => {
    setShowDiff(false);
    setSubmitError(null);
  }, []);

  const handleAccept = useCallback(async () => {
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      const parsed = JSON.parse(editedJson);
      const model = classification.startsWith('Checks')
        ? { checkDataModel: parsed }
        : classification.startsWith('Extra Pages')
        ? { extraPageDataModel: parsed }
        : { statementDataModel: parsed };

      await apiService.putDocumentDataModel({ classificationId, model });
      setSubmitSuccess(true);
    } catch (e: any) {
      setSubmitError(e.userMessage || e.message || 'Failed to save data model');
    } finally {
      setSubmitLoading(false);
    }
  }, [editedJson, classificationId, classification]);

  return {
    editedJson,
    setEditedJson,
    validationError,
    isValid,
    warnings,
    showDiff,
    submitLoading,
    submitError,
    submitSuccess,
    handleShowDiff,
    handleBackToEditor,
    handleAccept,
  };
};
