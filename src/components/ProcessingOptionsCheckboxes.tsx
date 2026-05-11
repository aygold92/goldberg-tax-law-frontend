import React from 'react';
import { Box, Tooltip, ToggleButton } from '@mui/material';
import { Replay, Build, FindReplace } from '@mui/icons-material';

interface ProcessingOptionsCheckboxesProps {
  forceReanalysis: boolean;
  forceRecreate: boolean;
  replaceOnRecreate: boolean;
  onChange: (options: { forceReanalysis: boolean; forceRecreate: boolean; replaceOnRecreate: boolean }) => void;
  disabled?: boolean;
}

const ProcessingOptionsCheckboxes: React.FC<ProcessingOptionsCheckboxesProps> = ({
  forceReanalysis,
  forceRecreate,
  replaceOnRecreate,
  onChange,
  disabled = false,
}) => (
  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
    <Tooltip title="Force reanalysis — re-run AI analysis even if already analyzed">
      <span>
        <ToggleButton
          value="forceReanalysis"
          selected={forceReanalysis}
          size="small"
          disabled={disabled}
          onChange={() => onChange({ forceReanalysis: !forceReanalysis, forceRecreate, replaceOnRecreate })}
        >
          <Replay fontSize="small" />
        </ToggleButton>
      </span>
    </Tooltip>
    <Tooltip title="Force recreate — recreate the output statement even if it already exists">
      <span>
        <ToggleButton
          value="forceRecreate"
          selected={forceRecreate}
          size="small"
          disabled={disabled}
          onChange={() => onChange({ forceReanalysis, forceRecreate: !forceRecreate, replaceOnRecreate })}
        >
          <Build fontSize="small" />
        </ToggleButton>
      </span>
    </Tooltip>
    <Tooltip title="Replace on recreate — replace the existing statement when recreating">
      <span>
        <ToggleButton
          value="replaceOnRecreate"
          selected={replaceOnRecreate}
          size="small"
          disabled={disabled || !forceRecreate}
          onChange={() => onChange({ forceReanalysis, forceRecreate, replaceOnRecreate: !replaceOnRecreate })}
        >
          <FindReplace fontSize="small" />
        </ToggleButton>
      </span>
    </Tooltip>
  </Box>
);

export default ProcessingOptionsCheckboxes;
