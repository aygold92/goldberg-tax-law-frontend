import React from 'react';
import { Chip, Box } from '@mui/material';
import { DocumentClassification } from '../../../types/api';

interface SelectionBadgeProps {
  classification: DocumentClassification;
  isSelected: boolean;
  onToggle: () => void;
}

const SelectionBadge: React.FC<SelectionBadgeProps> = ({
  classification,
  isSelected,
  onToggle,
}) => {
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
      onClick={onToggle}
      variant={isSelected ? "filled" : "outlined"}
      sx={{
        cursor: 'pointer',
        borderColor: isSelected ? 'primary.main' : undefined,
        backgroundColor: isSelected ? 'primary.light' : undefined,
        color: isSelected ? 'primary.contrastText' : undefined,
        '&:hover': {
          backgroundColor: isSelected ? 'primary.main' : 'action.hover',
          color: isSelected ? 'primary.contrastText' : undefined,
        },
      }}
    />
  );
};

export default SelectionBadge;
