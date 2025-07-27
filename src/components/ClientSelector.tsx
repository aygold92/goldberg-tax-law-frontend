/**
 * Client Selector component for managing client selection and creation.
 * 
 * This component provides functionality for:
 * - Displaying a dropdown of available clients
 * - Creating new clients through a dialog
 * - Loading client list from the backend API
 * - Handling client selection changes
 * - Error handling and retry functionality
 * 
 * Features include:
 * - Automatic selection of first client when list loads
 * - Loading states during API calls
 * - Error display with retry option
 * - Dialog for creating new clients
 * - Form validation for client names
 * 
 * Used across the application to manage client context for document operations.
 */

import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectClients, selectSelectedClient, selectClientLoading, selectClientError } from '../redux/features/client/clientSelectors';
import { loadClients, createClient, setSelectedClient } from '../redux/features/client/clientSlice';

const ClientSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const clients = useAppSelector(selectClients);
  const selectedClient = useAppSelector(selectSelectedClient);
  const loading = useAppSelector(selectClientLoading);
  const error = useAppSelector(selectClientError);
  const [openDialog, setOpenDialog] = useState(false);
  const [newClientName, setNewClientName] = useState('');

  useEffect(() => {
    dispatch(loadClients());
  }, [dispatch]);

  const handleClientChange = (client: string) => {
    dispatch(setSelectedClient(client));
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;
    await dispatch(createClient(newClientName.trim()));
    setNewClientName('');
    setOpenDialog(false);
    dispatch(setSelectedClient(newClientName.trim()));
  };

  return (
    <Box sx={{ mb: 3 }}>
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => dispatch(loadClients())}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography variant="h6">Client:</Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Select Client</InputLabel>
          <Select
            value={selectedClient}
            label="Select Client"
            onChange={(e) => handleClientChange(e.target.value)}
            disabled={loading}
          >
            {clients.map((client) => (
              <MenuItem key={client} value={client}>
                {client}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
          disabled={loading}
        >
          New Client
        </Button>
        {loading && <CircularProgress size={20} />}
      </Box>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create New Client</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Client Name"
            fullWidth
            variant="outlined"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateClient()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateClient} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientSelector; 