import React from 'react';
import { Chip, Box } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { DocumentClassification } from '../../../types/api';

interface ClassificationBadgeProps {
  classification: DocumentClassification;
  isDeleted?: boolean;
  isAdded?: boolean;
  onDelete?: () => void;
  onRestore?: () => void;
  readOnly?: boolean;
}

const ClassificationBadge: React.FC<ClassificationBadgeProps> = ({
  classification,
  isDeleted = false,
  isAdded = false,
  onDelete,
  onRestore,
  readOnly = false,
}) => {
  const handleClick = () => {
    if (isDeleted && onRestore) {
      onRestore();
    }
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  // Format pages for display (e.g., [1,3,4,5,6,7,10] -> "1,3-7,10")
  const formatPages = (pages: number[]): string => {
    if (pages.length === 0) return '';
    
    const sortedPages = [...pages].sort((a, b) => a - b);
    const ranges: string[] = [];
    let start = sortedPages[0];
    let end = sortedPages[0];

    for (let i = 1; i < sortedPages.length; i++) {
      if (sortedPages[i] === end + 1) {
        end = sortedPages[i];
      } else {
        ranges.push(start === end ? start.toString() : `${start}-${end}`);
        start = sortedPages[i];
        end = sortedPages[i];
      }
    }
    ranges.push(start === end ? start.toString() : `${start}-${end}`);
    
    return ranges.join(',');
  };

  const pagesText = formatPages(classification.pages);

  return (
    <Chip
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box component="span" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
            [{pagesText}]
          </Box>
          <Box component="span" sx={{ fontSize: '0.8rem', opacity: 0.8 }}>
            {classification.classification}
          </Box>
        </Box>
      }
      onClick={isDeleted ? handleClick : undefined}
      onDelete={!readOnly && !isDeleted ? handleDelete : undefined}
      deleteIcon={<Delete />}
      variant="outlined"
      sx={{
        cursor: isDeleted ? 'pointer' : 'default',
        borderColor: isDeleted ? 'error.main' : isAdded ? 'success.main' : undefined,
        color: isDeleted ? 'error.main' : isAdded ? 'success.main' : undefined,
        backgroundColor: isAdded ? 'success.light' : undefined,
        '&:hover': isDeleted ? {
          backgroundColor: 'error.light',
          color: 'error.contrastText',
        } : isAdded ? {
          backgroundColor: 'success.main',
          color: 'success.contrastText',
        } : undefined,
      }}
    />
  );
};

export default ClassificationBadge;
