import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { FactCheck } from '@mui/icons-material';

interface DeleteStatementConfirmDialogProps {
  open: boolean;
  totalCount: number;
  manuallyReviewedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteStatementConfirmDialog: React.FC<DeleteStatementConfirmDialogProps> = ({
  open,
  totalCount,
  manuallyReviewedCount,
  onConfirm,
  onCancel,
}) => {
  const statementsWord = totalCount === 1 ? 'statement' : 'statements';
  const reviewedWord = manuallyReviewedCount === 1 ? 'statement has' : 'statements have';

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FactCheck color="warning" />
        Delete Manually Reviewed {totalCount === 1 ? 'Statement' : 'Statements'}?
      </DialogTitle>
      <DialogContent>
        <Typography>
          {manuallyReviewedCount === totalCount
            ? `${manuallyReviewedCount === 1 ? 'This' : `All ${manuallyReviewedCount}`} ${reviewedWord} been manually reviewed.`
            : `${manuallyReviewedCount} of the ${totalCount} selected ${statementsWord} ${reviewedWord} been manually reviewed.`}
          {' '}Deleting cannot be undone. Are you sure?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} variant="outlined">Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">Delete</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteStatementConfirmDialog;
