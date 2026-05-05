import { useState, useEffect, useCallback } from 'react';
import { ClassificationInfo } from '../../../types/api';
import apiService from '../../../services/api';

export const useDocumentClassifications = (fileId: string) => {
  const [classifications, setClassifications] = useState<ClassificationInfo[]>([]);
  const [originalClassifications, setOriginalClassifications] = useState<ClassificationInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const classificationsEqual = (a: ClassificationInfo, b: ClassificationInfo): boolean =>
    a.classificationId === b.classificationId;

  const calculateAddedDeleted = () => {
    // "Added" = in current but not in original (by classificationId)
    // For newly added (not yet saved), they have no classificationId yet — we store them as
    // temporary objects with classificationId = '' so the badge shows them as new.
    const added = classifications.filter(
      c => !c.classificationId || !originalClassifications.some(o => o.classificationId === c.classificationId)
    );
    const deleted = originalClassifications.filter(
      o => !classifications.some(c => c.classificationId === o.classificationId)
    );
    return { added, deleted };
  };

  const { added: addedClassifications, deleted: deletedClassifications } = calculateAddedDeleted();
  const hasUnsavedChanges = addedClassifications.length > 0 || deletedClassifications.length > 0;

  const loadClassifications = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getDocumentClassification(fileId);
      setClassifications(data);
      setOriginalClassifications(data);
    } catch (err: any) {
      setError(err.userMessage || 'Failed to load classifications');
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  const saveClassifications = useCallback(async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const { added, deleted } = calculateAddedDeleted();

      await apiService.putDocumentClassification({
        file: {
          fileId,
          classifications: added.map(c => ({
            pages: c.pages,
            classificationType: c.classificationType,
          })),
        },
        classificationsToRemove: deleted.map(c => c.classificationId),
      });

      setSuccess('Classifications saved successfully!');
      return true;
    } catch (err: any) {
      setError(err.userMessage || 'Failed to save classifications');
      return false;
    } finally {
      setSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, classifications, originalClassifications]);

  // Add a new classification (not yet persisted — classificationId is empty)
  const addClassification = useCallback((pages: number[], classification: string) => {
    const newClassification: ClassificationInfo = {
      classificationId: '',
      pages: [...pages].sort((a, b) => a - b),
      classificationType: classification,
      modelLocation: null,
      createdAt: 0,
      updatedAt: 0,
    };

    // Remove any existing classifications that overlap with the new pages
    const filtered = classifications.filter(
      existing => !existing.pages.some(p => pages.includes(p))
    );

    const updated = [...filtered, newClassification].sort((a, b) => a.pages[0] - b.pages[0]);
    setClassifications(updated);
  }, [classifications]);

  const removeClassification = useCallback((index: number) => {
    setClassifications(prev => prev.filter((_, i) => i !== index));
  }, []);

  const restoreClassification = useCallback((deleted: ClassificationInfo) => {
    setClassifications(prev => {
      const filtered = prev.filter(c => !c.pages.some(p => deleted.pages.includes(p)));
      return [...filtered, deleted].sort((a, b) => a.pages[0] - b.pages[0]);
    });
  }, []);

  const reloadClassifications = useCallback(async () => {
    await loadClassifications();
  }, [loadClassifications]);

  useEffect(() => {
    loadClassifications();
  }, [loadClassifications]);

  return {
    classifications,
    originalClassifications,
    addedClassifications,
    deletedClassifications,
    loading,
    saving,
    error,
    success,
    hasUnsavedChanges,
    loadClassifications,
    saveClassifications,
    addClassification,
    removeClassification,
    restoreClassification,
    reloadClassifications,
    setError,
    setSuccess,
  };
};
