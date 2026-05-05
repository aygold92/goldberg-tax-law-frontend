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
  Tooltip,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import styles from '../styles/components/ClientSelector.module.css';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectClients, selectSelectedClient, selectClientLoading, selectClientError } from '../redux/features/client/clientSelectors';
import { loadClients, createClient, setSelectedClient } from '../redux/features/client/clientSlice';
import { Client } from '../types/api';

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

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.clientId === clientId) ?? null;
    if (client) dispatch(setSelectedClient(client));
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;
    const result = await dispatch(createClient(newClientName.trim()));
    setNewClientName('');
    setOpenDialog(false);
    if (result.payload && typeof result.payload === 'object' && 'clientId' in result.payload) {
      dispatch(setSelectedClient(result.payload as Client));
    }
  };

  return (
    <Box className={styles.container}>
      {error && (
        <Alert
          severity="error"
          className={styles.errorAlert}
          action={
            <Button color="inherit" size="small" onClick={() => dispatch(loadClients())}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      <Box className={styles.controlsContainer}>
        <Typography variant="h6">Client:</Typography>
        <FormControl className={styles.formControl}>
          <InputLabel>Select Client</InputLabel>
          <Select
            value={selectedClient?.clientId ?? ''}
            label="Select Client"
            onChange={(e) => handleClientChange(e.target.value)}
            disabled={loading}
          >
            {clients.map((client) => (
              <MenuItem key={client.clientId} value={client.clientId}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body1">{client.clientName}</Typography>
                  <Tooltip title={client.clientId} placement="right">
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      {client.clientId.slice(0, 8)}…
                    </Typography>
                  </Tooltip>
                </Box>
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
            onKeyDown={(e) => e.key === 'Enter' && handleCreateClient()}
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
