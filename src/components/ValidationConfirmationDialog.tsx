import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';
import { ValidationError } from '../utils/validation';

interface ValidationConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  errors: ValidationError[];
}

const ValidationConfirmationDialog: React.FC<ValidationConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  errors,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ErrorIcon color="error" />
          <Typography variant="h6" component="span">
            Validation Errors Detected
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={500}>
            The statement has validation errors. Do you want to save anyway?
          </Typography>
        </Alert>
        
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          Validation Errors ({errors.length}):
        </Typography>
        
        <List dense sx={{ maxHeight: 400, overflow: 'auto', bgcolor: 'background.paper' }}>
          {errors.map((error, index) => (
            <ListItem key={index} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
              <ListItemText
                primary={
                  <Typography variant="body2" component="span" fontWeight={500}>
                    {error.field}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {error.message}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="warning" variant="contained">
          Save Anyway
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ValidationConfirmationDialog;







