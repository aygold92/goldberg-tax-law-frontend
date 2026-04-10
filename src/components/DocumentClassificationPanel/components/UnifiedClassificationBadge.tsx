import React from 'react';
import { Chip, Box } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { DocumentClassification } from '../../../types/api';

interface UnifiedClassificationBadgeProps {
  classification: DocumentClassification;
  // Selection state
  isSelected?: boolean;
  onToggle?: () => void;
  // Edit state
  isAdded?: boolean;
  isDeleted?: boolean;
  onDelete?: () => void;
  onRestore?: () => void;
  // Data model
  onFetchDataModel?: (classification: DocumentClassification) => void;
  readOnly?: boolean;
}

export const formatPages = (pages: number[]): string => {
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

const UnifiedClassificationBadge: React.FC<UnifiedClassificationBadgeProps> = ({
  classification,
  isSelected = false,
  onToggle,
  isAdded = false,
  isDeleted = false,
  onDelete,
  onRestore,
  onFetchDataModel,
  readOnly = false,
}) => {
  const pagesText = formatPages(classification.pages);

  const handleClick = (event: React.MouseEvent) => {
    if (isDeleted) {
      if (onRestore) onRestore();
    } else if (event.detail === 2) {
      if (onFetchDataModel) onFetchDataModel(classification);
    } else {
      if (onToggle) onToggle();
    }
  };

  const handleRightClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (onFetchDataModel) onFetchDataModel(classification);
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onDelete) onDelete();
  };

  // Compute sx styles based on state priority
  let chipSx: object;
  if (isDeleted) {
    chipSx = {
      cursor: 'pointer',
      borderColor: 'error.main',
      color: 'error.main',
      backgroundColor: 'background.paper',
      '&:hover': { backgroundColor: 'error.light', color: 'error.contrastText' },
    };
  } else if (isAdded && isSelected) {
    chipSx = {
      cursor: 'pointer',
      borderColor: 'success.main',
      backgroundColor: 'success.main',
      color: 'success.contrastText',
      '&:hover': { backgroundColor: 'success.dark' },
    };
  } else if (isAdded) {
    chipSx = {
      cursor: 'pointer',
      borderColor: 'success.main',
      color: 'success.main',
      backgroundColor: 'background.paper',
      '&:hover': { backgroundColor: 'success.light', color: 'success.contrastText' },
    };
  } else if (isSelected) {
    chipSx = {
      cursor: 'pointer',
      borderColor: 'primary.main',
      backgroundColor: 'primary.light',
      color: 'primary.contrastText',
      '&:hover': { backgroundColor: 'primary.main' },
    };
  } else {
    chipSx = {
      cursor: onToggle ? 'pointer' : 'default',
      '&:hover': onToggle ? { backgroundColor: 'action.hover' } : undefined,
    };
  }

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
      onClick={handleClick}
      onContextMenu={onFetchDataModel ? handleRightClick : undefined}
      onDelete={!readOnly && !isDeleted && onDelete ? handleDelete : undefined}
      deleteIcon={<Delete />}
      variant="outlined"
      sx={chipSx}
    />
  );
};

export default UnifiedClassificationBadge;
