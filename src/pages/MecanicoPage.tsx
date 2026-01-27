// src/pages/MecanicoPage.tsx
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tabs,
  Tab,
  MenuItem,
  Divider,
  Autocomplete,
} from '@mui/material';
import { useAuthContext } from '../contexts/AuthContext';
import { CarRepair, Schedule, DirectionsCar, Inventory, Delete, Add } from '@mui/icons-material';
import { clientService } from '../api/services/client.service';
import { vehicleService } from '../api/services/vehicle.service';

interface CreateClientWithVehicleData {
  cedula: string;
  nombre_completo: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  vehiculo?: {
    placa: string;
    marca: string;
    modelo: string;
    año: number;
    color?: string;
  };
}

interface CreateVehicleData {
  placa: string;
  marca: string;
  modelo: string;
  año: number;
  color?: string;
  clienteId: string;
}

const MecanicoPage = () => {
  const { user } = useAuthContext();

  // Estados para modales
  const [openClientModal, setOpenClientModal] = useState(false);
  const [openVehicleModal, setOpenVehicleModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados para listas
  const [clients, setClients] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Tab actual
  const [currentTab, setCurrentTab] = useState(0);

  // Formulario de cliente (con vehículo opcional)
  const [clientFormData, setClientFormData] = useState<CreateClientWithVehicleData>({
    cedula: '',
    nombre_completo: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  });

  // Checkbox para agregar vehículo al crear cliente
  const [addVehicle, setAddVehicle] = useState(false);

  // Formulario de vehículo
  const [vehicleFormData, setVehicleFormData] = useState<CreateVehicleData>({
    placa: '',
    marca: '',
    modelo: '',
    año: new Date().getFullYear(),
    color: '',
    clienteId: '',
  });

  // Cargar datos al montar
  useEffect(() => {
    loadClients();
    loadVehicles();
  }, []);

  const loadClients = async () => {
    setLoadingData(true);
    try {
      const result = await clientService.getAllClients();
      if (result.success && result.data) {
        setClients(result.data);
      }
    } catch (err) {
      console.error('Error cargando clientes:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const loadVehicles = async () => {
    setLoadingData(true);
    try {
      const result = await vehicleService.getVehicles();
      if (result.success && result.data) {
        setVehicles(result.data);
      }
    } catch (err) {
      console.error('Error cargando vehículos:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // ========== CLIENTE ==========

  const handleOpenClientModal = () => {
    setOpenClientModal(true);
    setError(null);
    setSuccess(null);
    setAddVehicle(false);
  };

  const handleCloseClientModal = () => {
    setOpenClientModal(false);
    setClientFormData({
      cedula: '',
      nombre_completo: '',
      email: '',
      password: '',
      phone: '',
      address: '',
    });
    setAddVehicle(false);
    setError(null);
    setSuccess(null);
  };

  const handleClientInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Si es un campo del vehículo
    if (name.startsWith('vehiculo.')) {
      const vehicleField = name.replace('vehiculo.', '');
      setClientFormData((prev) => ({
        ...prev,
        vehiculo: {
          ...prev.vehiculo,
          placa: prev.vehiculo?.placa || '',
          marca: prev.vehiculo?.marca || '',
          modelo: prev.vehiculo?.modelo || '',
          año: prev.vehiculo?.año || new Date().getFullYear(),
          color: prev.vehiculo?.color || '',
          [vehicleField]: vehicleField === 'año' ? parseInt(value) || 0 : value,
        },
      }));
    } else {
      setClientFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmitClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const dataToSend = { ...clientFormData };
      
      // Si no se va a agregar vehículo, remover el campo
      if (!addVehicle) {
        delete dataToSend.vehiculo;
      }

      const result = await clientService.createClient(dataToSend);

      if (result.success) {
        setSuccess(addVehicle ? '¡Cliente y vehículo creados exitosamente!' : '¡Cliente creado exitosamente!');
        await loadClients();
        if (addVehicle) await loadVehicles();
        setTimeout(() => {
          handleCloseClientModal();
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al crear el cliente. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ========== VEHÍCULO ==========

  const handleOpenVehicleModal = () => {
    setOpenVehicleModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseVehicleModal = () => {
    setOpenVehicleModal(false);
    setVehicleFormData({
      placa: '',
      marca: '',
      modelo: '',
      año: new Date().getFullYear(),
      color: '',
      clienteId: '',
    });
    setError(null);
    setSuccess(null);
  };

  const handleVehicleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVehicleFormData((prev) => ({
      ...prev,
      [name]: name === 'año' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmitVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await vehicleService.createVehicle(vehicleFormData);

      if (result.success) {
        setSuccess('¡Vehículo creado exitosamente!');
        await loadVehicles();
        setTimeout(() => {
          handleCloseVehicleModal();
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al crear el vehículo. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este vehículo?')) {
      return;
    }

    try {
      const result = await vehicleService.deleteVehicle(vehicleId);
      if (result.success) {
        await loadVehicles();
        setSuccess('Vehículo eliminado exitosamente');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al eliminar el vehículo');
    }
  };

  // Obtener nombre del cliente
  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.nombre_completo : 'Desconocido';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 4, mb: 4, backgroundColor: 'info.main', color: 'white' }}>
        <Typography variant="h3" gutterBottom>
          Panel del Mecánico
        </Typography>
        <Typography variant="h5">Bienvenido, {user?.nombre_completo}</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Rol: <strong>Mecánico</strong> | Especialidad: {user?.specialty || 'General'}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Cédula: {user?.cedula} | Email: {user?.email}
        </Typography>
      </Paper>

      {/* Mensajes */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
        Mis Funciones:
      </Typography>

      {/* Grid de Tarjetas */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3 }}>
        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          <CarRepair sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Mis Trabajos Asignados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ver y gestionar reparaciones asignadas a ti
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Chip label="3 trabajos pendientes" color="primary" sx={{ mr: 1 }} />
            <Chip label="1 en progreso" color="warning" />
          </Box>
          <Button variant="outlined" sx={{ mt: 2 }}>
            Ver Trabajos
          </Button>
        </Paper>

        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          <Schedule sx={{ fontSize: 50, color: 'secondary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Agenda y Horarios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Organizar tu tiempo y ver próximas asignaciones
          </Typography>
          <Button variant="outlined" sx={{ mt: 2 }}>
            Ver Agenda
          </Button>
        </Paper>

        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          <DirectionsCar sx={{ fontSize: 50, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Gestión de Vehículos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Agregar clientes y sus vehículos al sistema
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexDirection: 'column' }}>
            <Button variant="contained" onClick={handleOpenClientModal} startIcon={<Add />}>
              Agregar Cliente
            </Button>
            <Button variant="outlined" onClick={handleOpenVehicleModal} startIcon={<Add />}>
              Agregar Vehículo
            </Button>
          </Box>
        </Paper>

        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          <Inventory sx={{ fontSize: 50, color: 'warning.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Herramientas y Repuestos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Solicitar herramientas y repuestos necesarios
          </Typography>
          <Button variant="outlined" sx={{ mt: 2 }}>
            Solicitar Materiales
          </Button>
        </Paper>
      </Box>

      {/* Tabs para Clientes y Vehículos */}
      <Paper sx={{ mt: 4 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label={`Clientes (${clients.length})`} />
          <Tab label={`Vehículos (${vehicles.length})`} />
        </Tabs>

        {/* Tab 1: Clientes */}
        {currentTab === 0 && (
          <Box sx={{ p: 3 }}>
            {loadingData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : clients.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 3 }}>
                No hay clientes registrados. Haz clic en "Agregar Cliente" para comenzar.
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Nombre</strong></TableCell>
                      <TableCell><strong>Cédula</strong></TableCell>
                      <TableCell><strong>Email</strong></TableCell>
                      <TableCell><strong>Teléfono</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>{client.nombre_completo}</TableCell>
                        <TableCell>{client.cedula}</TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.phone || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* Tab 2: Vehículos */}
        {currentTab === 1 && (
          <Box sx={{ p: 3 }}>
            {loadingData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : vehicles.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 3 }}>
                No hay vehículos registrados. Haz clic en "Agregar Vehículo" para comenzar.
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Placa</strong></TableCell>
                      <TableCell><strong>Marca</strong></TableCell>
                      <TableCell><strong>Modelo</strong></TableCell>
                      <TableCell><strong>Año</strong></TableCell>
                      <TableCell><strong>Cliente</strong></TableCell>
                      <TableCell><strong>Trabajos</strong></TableCell>
                      <TableCell align="center"><strong>Acciones</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell>{vehicle.placa}</TableCell>
                        <TableCell>{vehicle.marca}</TableCell>
                        <TableCell>{vehicle.modelo}</TableCell>
                        <TableCell>{vehicle.año}</TableCell>
                        <TableCell>{getClientName(vehicle.clienteId)}</TableCell>
                        <TableCell>{vehicle.trabajos?.length || 0}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteVehicle(vehicle.id)}
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Paper>

      {/* Estadísticas */}
      <Paper sx={{ p: 3, mt: 4, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom>
          Mi Rendimiento:
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Trabajos Completados
            </Typography>
            <Typography variant="h4">156</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Eficiencia
            </Typography>
            <Typography variant="h4">92%</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Horas Trabajadas (Mes)
            </Typography>
            <Typography variant="h4">168h</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Satisfacción Clientes
            </Typography>
            <Typography variant="h4">4.8/5</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Modal: Agregar Cliente */}
      <Dialog open={openClientModal} onClose={handleCloseClientModal} maxWidth="md" fullWidth>
        <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
        <form onSubmit={handleSubmitClient}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <Typography variant="h6" gutterBottom>
              Información del Cliente
            </Typography>

            <TextField
              fullWidth
              label="Cédula"
              name="cedula"
              value={clientFormData.cedula}
              onChange={handleClientInputChange}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Nombre Completo"
              name="nombre_completo"
              value={clientFormData.nombre_completo}
              onChange={handleClientInputChange}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Correo Electrónico"
              name="email"
              type="email"
              value={clientFormData.email}
              onChange={handleClientInputChange}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Contraseña"
              name="password"
              type="password"
              value={clientFormData.password}
              onChange={handleClientInputChange}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Teléfono (opcional)"
              name="phone"
              value={clientFormData.phone}
              onChange={handleClientInputChange}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Dirección (opcional)"
              name="address"
              value={clientFormData.address}
              onChange={handleClientInputChange}
              sx={{ mb: 2 }}
            />

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <input
                type="checkbox"
                id="addVehicleCheckbox"
                checked={addVehicle}
                onChange={(e) => setAddVehicle(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              <label htmlFor="addVehicleCheckbox">
                <Typography variant="body1">¿Agregar vehículo del cliente ahora?</Typography>
              </label>
            </Box>

            {addVehicle && (
              <>
                <Typography variant="h6" gutterBottom>
                  Información del Vehículo (Opcional)
                </Typography>

                <TextField
                  fullWidth
                  label="Placa"
                  name="vehiculo.placa"
                  value={clientFormData.vehiculo?.placa || ''}
                  onChange={handleClientInputChange}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Marca"
                  name="vehiculo.marca"
                  value={clientFormData.vehiculo?.marca || ''}
                  onChange={handleClientInputChange}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Modelo"
                  name="vehiculo.modelo"
                  value={clientFormData.vehiculo?.modelo || ''}
                  onChange={handleClientInputChange}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Año"
                  name="vehiculo.año"
                  type="number"
                  value={clientFormData.vehiculo?.año || new Date().getFullYear()}
                  onChange={handleClientInputChange}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Color (opcional)"
                  name="vehiculo.color"
                  value={clientFormData.vehiculo?.color || ''}
                  onChange={handleClientInputChange}
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseClientModal} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? 'Creando...' : 'Crear Cliente'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal: Agregar Vehículo */}
      {/* Modal: Agregar Vehículo */}
      <Dialog open={openVehicleModal} onClose={handleCloseVehicleModal} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Nuevo Vehículo</DialogTitle>
        <form onSubmit={handleSubmitVehicle}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}

              {/* Autocomplete para seleccionar cliente */}
              <Autocomplete
                options={clients}
                getOptionLabel={(option) => `${option.nombre_completo} - ${option.cedula}`}
                value={clients.find((c) => c.id === vehicleFormData.clienteId) || null}
                onChange={(event, newValue) => {
                  setVehicleFormData((prev) => ({
                    ...prev,
                    clienteId: newValue ? newValue.id : '',
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cliente"
                    required
                    placeholder="Escribe para buscar..."
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box>
                      <Typography variant="body1">{option.nombre_completo}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Cédula: {option.cedula} | Email: {option.email}
                      </Typography>
                    </Box>
                  </li>
                )}
                noOptionsText="No se encontraron clientes"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Placa"
                name="placa"
                value={vehicleFormData.placa}
                onChange={handleVehicleInputChange}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Marca"
                name="marca"
                value={vehicleFormData.marca}
                onChange={handleVehicleInputChange}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Modelo"
                name="modelo"
                value={vehicleFormData.modelo}
                onChange={handleVehicleInputChange}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Año"
                name="año"
                type="number"
                value={vehicleFormData.año}
                onChange={handleVehicleInputChange}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Color (opcional)"
                name="color"
                value={vehicleFormData.color}
                onChange={handleVehicleInputChange}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseVehicleModal} disabled={loading}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {loading ? 'Creando...' : 'Crear Vehículo'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default MecanicoPage;