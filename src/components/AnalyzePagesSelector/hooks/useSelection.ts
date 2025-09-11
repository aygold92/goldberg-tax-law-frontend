import { useState, useCallback } from 'react';
import { DocumentClassification } from '../../../types/api';

export const useSelection = () => {
  const [selectedClassifications, setSelectedClassifications] = useState<DocumentClassification[]>([]);

  // Helper function to compare classifications
  const classificationsEqual = (a: DocumentClassification, b: DocumentClassification): boolean => {
    return JSON.stringify(a.pages.sort()) === JSON.stringify(b.pages.sort()) && 
           a.classification === b.classification;
  };

  // Check if a classification is selected
  const isSelected = useCallback((classification: DocumentClassification): boolean => {
    return selectedClassifications.some(selected => classificationsEqual(selected, classification));
  }, [selectedClassifications]);

  // Toggle selection of a classification
  const toggleSelection = useCallback((classification: DocumentClassification) => {
    setSelectedClassifications(prev => {
      const isCurrentlySelected = prev.some(selected => classificationsEqual(selected, classification));
      
      if (isCurrentlySelected) {
        // Remove from selection
        return prev.filter(selected => !classificationsEqual(selected, classification));
      } else {
        // Add to selection
        return [...prev, classification];
      }
    });
  }, []);

  // Select all classifications
  const selectAll = useCallback((allClassifications: DocumentClassification[]) => {
    setSelectedClassifications([...allClassifications]);
  }, []);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedClassifications([]);
  }, []);

  // Get selection count
  const selectionCount = selectedClassifications.length;

  return {
    // State
    selectedClassifications,
    selectionCount,
    
    // Actions
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
  };
};
