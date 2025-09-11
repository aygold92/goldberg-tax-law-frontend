/**
 * Component for rendering the yearly timeline of statements.
 * Displays months in a grid format with visual indicators for statement status.
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { Timeline } from '@mui/icons-material';
import { BankStatementMetadata } from '../../../types/api';
import { YearlyTimeline as YearlyTimelineType } from '../types/accountSummary';
import MonthBlock from './MonthBlock';
import styles from '../AccountSummary.module.css';

interface YearlyTimelineProps {
  yearlyTimeline: YearlyTimelineType;
  onEditStatement: (statement: BankStatementMetadata) => void;
}

const YearlyTimeline: React.FC<YearlyTimelineProps> = ({ yearlyTimeline, onEditStatement }) => {
  return (
    <Box className={styles.timelineSection}>
      <Typography variant="subtitle1" gutterBottom className={styles.sectionTitle}>
        <Timeline fontSize="small" sx={{ mr: 1 }} />
        Statement Timeline by Year
      </Typography>
      
      {Object.entries(yearlyTimeline)
        .sort(([yearA], [yearB]) => yearA.localeCompare(yearB))
        .map(([year, yearData]) => (
          <Box key={year} className={styles.yearRow}>
            <Typography variant="h6" className={styles.yearLabel}>
              {year}
            </Typography>
            <Box className={styles.monthsContainer}>
              {yearData.months.map((monthBlock, index) => (
                <MonthBlock
                  key={index}
                  monthBlock={monthBlock}
                  onEditStatement={onEditStatement}
                />
              ))}
            </Box>
          </Box>
        ))}
    </Box>
  );
};

export default YearlyTimeline;
