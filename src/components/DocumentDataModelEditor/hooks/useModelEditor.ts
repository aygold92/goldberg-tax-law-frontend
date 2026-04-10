import { useState, useEffect, useCallback } from 'react';
import { ClassifiedPdfMetadata } from '../../../types/bankStatement';
import apiService from '../../../services/api';

interface UseModelEditorProps {
  clientName: string;
  pdfMetadata: ClassifiedPdfMetadata;
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

  // pageMetadata must be present and well-formed
  const pm = parsed?.pageMetadata;
  if (!pm || typeof pm !== 'object') {
    return 'Missing required field: pageMetadata';
  }
  if (typeof pm.filename !== 'string' || !pm.filename) {
    return 'pageMetadata.filename must be a non-empty string';
  }
  if (!Array.isArray(pm.pages) || pm.pages.some((p: any) => typeof p !== 'number')) {
    return 'pageMetadata.pages must be an array of numbers';
  }
  if (typeof pm.classification !== 'string' || !pm.classification) {
    return 'pageMetadata.classification must be a non-empty string';
  }

  if (classification.startsWith('Checks')) {
    // All CheckDataModel fields are optional — only check for unknown keys
    const allowed = new Set(['accountNumber', 'checkNumber', 'to', 'description', 'date', 'amount', 'batesStamp', 'pageMetadata']);
    const unknown = Object.keys(parsed).filter(k => !allowed.has(k));
    if (unknown.length > 0) {
      return `CheckDataModel contains unknown fields: ${unknown.join(', ')}`;
    }
  } else if (classification.startsWith('Extra Pages')) {
    const keys = Object.keys(parsed);
    const extra = keys.filter(k => k !== 'pageMetadata');
    if (extra.length > 0) {
      return `Extra Pages model must only contain pageMetadata, but found: ${extra.join(', ')}`;
    }
  }

  return null;
}

export const useModelEditor = ({ clientName, pdfMetadata, initialModel }: UseModelEditorProps) => {
  const [editedJson, setEditedJson] = useState<string>(() => JSON.stringify(initialModel, null, 2));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [showDiff, setShowDiff] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Real-time validation on every change
  useEffect(() => {
    const error = validateModel(editedJson, pdfMetadata.classification);
    setValidationError(error);
    setIsValid(error === null);
  }, [editedJson, pdfMetadata.classification]);

  const handleShowDiff = useCallback(() => {
    if (isValid) {
      setShowDiff(true);
    }
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
      const { classification } = pdfMetadata;
      const model = classification.startsWith('Checks')
        ? { checkDataModel: parsed }
        : classification.startsWith('Extra Pages')
        ? { extraPageDataModel: parsed }
        : { statementDataModel: parsed };

      await apiService.putDocumentDataModel({ clientName, model });
      setSubmitSuccess(true);
    } catch (e: any) {
      setSubmitError(e.userMessage || e.message || 'Failed to save data model');
    } finally {
      setSubmitLoading(false);
    }
  }, [editedJson, clientName, pdfMetadata]);

  return {
    editedJson,
    setEditedJson,
    validationError,
    isValid,
    showDiff,
    submitLoading,
    submitError,
    submitSuccess,
    handleShowDiff,
    handleBackToEditor,
    handleAccept,
  };
};
