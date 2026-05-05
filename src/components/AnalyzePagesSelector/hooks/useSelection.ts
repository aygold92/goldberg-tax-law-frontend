import { useState, useCallback } from 'react';
import { ClassificationInfo } from '../../../types/api';

export const useSelection = () => {
  const [selectedClassifications, setSelectedClassifications] = useState<ClassificationInfo[]>([]);

  const classificationsEqual = (a: ClassificationInfo, b: ClassificationInfo): boolean => {
    if (a.classificationId && b.classificationId) return a.classificationId === b.classificationId;
    return JSON.stringify([...a.pages].sort()) === JSON.stringify([...b.pages].sort()) &&
      a.classificationType === b.classificationType;
  };

  const isSelected = useCallback((c: ClassificationInfo): boolean =>
    selectedClassifications.some(s => classificationsEqual(s, c)),
    [selectedClassifications]);

  const toggleSelection = useCallback((c: ClassificationInfo) => {
    setSelectedClassifications(prev => {
      const found = prev.some(s => classificationsEqual(s, c));
      return found ? prev.filter(s => !classificationsEqual(s, c)) : [...prev, c];
    });
  }, []);

  const selectAll = useCallback((all: ClassificationInfo[]) => {
    setSelectedClassifications([...all]);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedClassifications([]);
  }, []);

  return {
    selectedClassifications,
    selectionCount: selectedClassifications.length,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
  };
};
