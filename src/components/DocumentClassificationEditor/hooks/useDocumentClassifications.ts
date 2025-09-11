import { useState, useEffect, useCallback } from 'react';
import { DocumentClassification } from '../../../types/api';
import apiService from '../../../services/api';

export const useDocumentClassifications = (clientName: string, filename: string) => {
  const [classifications, setClassifications] = useState<DocumentClassification[]>([]);
  const [originalClassifications, setOriginalClassifications] = useState<DocumentClassification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Helper function to compare classifications
  const classificationsEqual = (a: DocumentClassification, b: DocumentClassification): boolean => {
    return JSON.stringify(a.pages.sort()) === JSON.stringify(b.pages.sort()) && 
           a.classification === b.classification;
  };

  // Calculate added and deleted classifications dynamically
  const calculateAddedDeleted = () => {
    const added = classifications.filter(current => 
      !originalClassifications.some(original => classificationsEqual(current, original))
    );
    const deleted = originalClassifications.filter(original => 
      !classifications.some(current => classificationsEqual(current, original))
    );
    return { added, deleted };
  };

  const { added: addedClassifications, deleted: deletedClassifications } = calculateAddedDeleted();

  // Check if there are unsaved changes
  const hasUnsavedChanges = addedClassifications.length > 0 || deletedClassifications.length > 0;

  // Load classifications from API
  const loadClassifications = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getDocumentClassification({ clientName, filename });
      setClassifications(data);
      setOriginalClassifications(data);
    } catch (err: any) {
      setError(err.userMessage || 'Failed to load classifications');
    } finally {
      setLoading(false);
    }
  }, [clientName, filename]);

  // Save classifications to API
  const saveClassifications = useCallback(async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await apiService.putDocumentClassification({
        clientName,
        classification: classifications,
        overwriteAll: true,
      });

      setSuccess('Classifications saved successfully!');
      return true;
    } catch (err: any) {
      setError(err.userMessage || 'Failed to save classifications');
      return false;
    } finally {
      setSaving(false);
    }
  }, [clientName, classifications]);

  // Add a new classification
  const addClassification = useCallback((pages: number[], classification: string) => {
    const newClassification: DocumentClassification = {
      filename,
      pages: [...pages].sort((a, b) => a - b),
      classification,
    };

    // Remove any existing classifications that overlap with the new pages
    const filteredClassifications = classifications.filter(existing => {
      const hasOverlap = existing.pages.some(page => pages.includes(page));
      return !hasOverlap;
    });

    // Add the new classification
    const updatedClassifications = [...filteredClassifications, newClassification];
    
    // Sort by first page
    updatedClassifications.sort((a, b) => a.pages[0] - b.pages[0]);
    
    setClassifications(updatedClassifications);
  }, [classifications, filename]);

  // Remove a classification by index
  const removeClassification = useCallback((index: number) => {
    const updatedClassifications = classifications.filter((_, i) => i !== index);
    setClassifications(updatedClassifications);
  }, [classifications]);

  // Restore a deleted classification
  const restoreClassification = useCallback((deletedClassification: DocumentClassification) => {
    addClassification(deletedClassification.pages, deletedClassification.classification);
  }, [addClassification]);

  // Reload from server (discard changes)
  const reloadClassifications = useCallback(async () => {
    await loadClassifications();
  }, [loadClassifications]);

  // Load classifications on mount
  useEffect(() => {
    loadClassifications();
  }, [loadClassifications]);

  return {
    // State
    classifications,
    originalClassifications,
    addedClassifications,
    deletedClassifications,
    loading,
    saving,
    error,
    success,
    hasUnsavedChanges,
    
    // Actions
    loadClassifications,
    saveClassifications,
    addClassification,
    removeClassification,
    restoreClassification,
    reloadClassifications,
    
    // Setters for external control
    setError,
    setSuccess,
  };
};
