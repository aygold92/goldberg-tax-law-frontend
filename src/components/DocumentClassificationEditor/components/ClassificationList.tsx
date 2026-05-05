import React from 'react';
import { Box, Typography } from '@mui/material';
import { ClassificationInfo } from '../../../types/api';
import ClassificationBadge from './ClassificationBadge';

interface ClassificationListProps {
  activeClassifications: ClassificationInfo[];
  deletedClassifications: ClassificationInfo[];
  addedClassifications: ClassificationInfo[];
  onRemoveClassification: (index: number) => void;
  onRestoreClassification: (classification: ClassificationInfo) => void;
  readOnly?: boolean;
}

const ClassificationList: React.FC<ClassificationListProps> = ({
  activeClassifications,
  deletedClassifications,
  addedClassifications,
  onRemoveClassification,
  onRestoreClassification,
  readOnly = false,
}) => {
  // Helper function to check if a classification is added (new)
  const isAddedClassification = (classification: ClassificationInfo): boolean => {
    return addedClassifications.some(added => 
      JSON.stringify(added.pages.sort()) === JSON.stringify(classification.pages.sort()) && 
      added.classificationType === classification.classificationType
    );
  };

  return (
    <Box>
      {/* Active classifications */}
      {activeClassifications.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            Active ({activeClassifications.length}):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {activeClassifications.map((classification, index) => (
              <ClassificationBadge
                key={`active-${index}`}
                classification={classification}
                isAdded={isAddedClassification(classification)}
                onDelete={() => onRemoveClassification(index)}
                readOnly={readOnly}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Deleted classifications */}
      {deletedClassifications.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            Deleted ({deletedClassifications.length}) - Click to restore:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {deletedClassifications.map((classification, index) => (
              <ClassificationBadge
                key={`deleted-${index}`}
                classification={classification}
                isDeleted={true}
                onRestore={() => onRestoreClassification(classification)}
                readOnly={readOnly}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Empty state */}
      {activeClassifications.length === 0 && deletedClassifications.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
          No classifications found
        </Typography>
      )}
    </Box>
  );
};

export default ClassificationList;
