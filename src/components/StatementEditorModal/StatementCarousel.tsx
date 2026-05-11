import React, { useEffect, useRef } from 'react';
import { Box, Tooltip, Chip } from '@mui/material';
import { FilterAlt } from '@mui/icons-material';
import { StatementSummary } from '../../types/api';
import StatementTooltip from '../AccountSummary/components/StatementTooltip';
import styles from '../../styles/components/StatementEditorModal.module.css';

interface StatementCarouselProps {
  statements: StatementSummary[];
  currentStatementId: string | null;
  onNavigate: (statementId: string) => void;
  onEditStatement?: (statement: StatementSummary, openInNewTab?: boolean) => void;
  showNotInFilterMessage?: boolean;
}

function getDotColor(s: StatementSummary): string {
  if ((s.suspiciousReasons?.length ?? 0) > 0) return styles.dotRed;
  if (s.missingChecks.length > 0 || s.numTransactions === 0) return styles.dotYellow;
  const isDuplicate = false; // duplicate detection is in the rows computation; not available in raw summary
  if (isDuplicate) return styles.dotYellow;
  return styles.dotGreen;
}

const DOT_SIZE_DEFAULT = 8;
const DOT_SIZE_SELECTED = 12;

const StatementCarousel: React.FC<StatementCarouselProps> = ({
  statements,
  currentStatementId,
  onNavigate,
  onEditStatement,
  showNotInFilterMessage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedRef.current && containerRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentStatementId]);

  if (statements.length === 0 && !showNotInFilterMessage) return null;

  return (
    <Box className={styles.carouselRow}>
      <Box className={styles.carouselInner} ref={containerRef}>
        {showNotInFilterMessage && (
          <Chip
            icon={<FilterAlt fontSize="small" />}
            label="Not in current filter"
            size="small"
            variant="outlined"
            color="warning"
            className={styles.notInFilterBadge}
          />
        )}
        {statements.map((s) => {
          const id = s.statementDetails.statementId;
          const isSelected = id === currentStatementId;
          const dotSize = isSelected ? DOT_SIZE_SELECTED : DOT_SIZE_DEFAULT;
          const colorClass = getDotColor(s);
          return (
            <Tooltip
              key={id}
              title={<StatementTooltip statements={[s]} onEditStatement={onEditStatement} />}
              placement="bottom"
              arrow
              enterDelay={300}
              leaveDelay={100}
              componentsProps={{
                tooltip: {
                  sx: {
                    backgroundColor: 'rgba(255, 255, 255, 0.97)',
                    color: '#333333',
                    fontSize: '0.75rem',
                    maxWidth: '300px',
                    border: '1px solid #e0e0e0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    '& .MuiTooltip-arrow': { color: 'rgba(255, 255, 255, 0.97)' },
                  },
                },
              }}
            >
              <Box
                ref={isSelected ? selectedRef : undefined}
                className={`${styles.dot} ${colorClass} ${isSelected ? styles.dotSelected : ''}`}
                sx={{ width: dotSize, height: dotSize }}
                onClick={() => onNavigate(id)}
              />
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
};

export default StatementCarousel;
