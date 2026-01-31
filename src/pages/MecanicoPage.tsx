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
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  Grid,
} from '@mui/material';
import { useAuthContext } from '../contexts/AuthContext';
import {
  Add,
  Delete,
  Send,
  Visibility,
  Edit,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { valoracionService, type Valoracion, type TareaValoracion } from '../api/services/valoracion.service';
import { vehicleService } from '../api/services/vehicle.service';
import { clientService } from '../api/services/client.service';

const MecanicoPage = () => {
  const { user } = useAuthContext();

  // Estados principales
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Datos
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  // Modal de valoración
  const [openValoracionModal, setOpenValoracionModal] = useState(false);
  const [selectedValoracion, setSelectedValoracion] = useState<Valoracion | null>(null);

  // Modal de tarea
  const [openTareaModal, setOpenTareaModal] = useState(false);
  const [tareaFormData, setTareaFormData] = useState({
    nombre: '',
    descripcion: '',
    precioEstimado: 0,
  });

  // Cargar datos al montar
  useEffect(() => {
    if (user?.id) {
      loadAllData();
    }
  }, [user?.id]);

  const loadAllData = async () => {
    await Promise.all([
      loadValoraciones(),
      loadVehicles(),
      loadClients(),
    ]);
  };

  const loadValoraciones = async () => {
    if (!user?.id) return;
    setLoadingData(true);
    try {
      const result = await valoracionService.getValoracionesByMecanico(user.id);
      if (result.success && result.data) {
        setValoraciones(result.data);
      }
    } catch (err) {
      console.error('Error cargando valoraciones:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const result = await vehicleService.getVehicles();
      if (result.success && result.data) {
        setVehicles(result.data);
      }
    } catch (err) {
      console.error('Error cargando vehículos:', err);
    }
  };

  const loadClients = async () => {
    try {
      const result = await clientService.getAllClients();
      if (result.success && result.data) {
        setClients(result.data);
      }
    } catch (err) {
      console.error('Error cargando clientes:', err);
    }
  };

  // ========== GESTIÓN DE VALORACIONES ==========

  const handleOpenValoracion = (valoracion: Valoracion) => {
    setSelectedValoracion(valoracion);
    setOpenValoracionModal(true);
  };

  const handleCloseValoracionModal = () => {
    setOpenValoracionModal(false);
    setSelectedValoracion(null);
  };

  // ========== GESTIÓN DE TAREAS ==========

  const handleOpenTareaModal = () => {
    setOpenTareaModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseTareaModal = () => {
    setOpenTareaModal(false);
    setTareaFormData({
      nombre: '',
      descripcion: '',
      precioEstimado: 0,
    });
    setError(null);
  };

  const handleTareaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTareaFormData((prev) => ({
      ...prev,
      [name]: name === 'precioEstimado' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmitTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedValoracion) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await valoracionService.addTarea(
        selectedValoracion.id,
        tareaFormData
      );

      if (result.success) {
        setSuccess('¡Tarea agregada exitosamente!');
        await loadValoraciones();
        
        // Actualizar la valoración seleccionada
        const updatedValoracion = await valoracionService.getValoracionById(selectedValoracion.id);
        if (updatedValoracion.success && updatedValoracion.data) {
          setSelectedValoracion(updatedValoracion.data);
        }

        setTimeout(() => {
          handleCloseTareaModal();
        }, 1500);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al agregar tarea. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTarea = async (tareaId: string) => {
    if (!selectedValoracion) return;
    if (!window.confirm('¿Estás seguro de eliminar esta tarea?')) return;

    try {
      const result = await valoracionService.removeTarea(selectedValoracion.id, tareaId);
      if (result.success) {
        setSuccess('Tarea eliminada exitosamente');
        await loadValoraciones();
        
        // Actualizar la valoración seleccionada
        const updatedValoracion = await valoracionService.getValoracionById(selectedValoracion.id);
        if (updatedValoracion.success && updatedValoracion.data) {
          setSelectedValoracion(updatedValoracion.data);
        }

        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al eliminar tarea');
    }
  };

  const handleEnviarACliente = async () => {
    if (!selectedValoracion) return;

    if (!window.confirm('¿Enviar valoración al cliente para aprobación? Ya no podrás modificar las tareas.')) {
      return;
    }

    setLoading(true);
    try {
      const result = await valoracionService.enviarACliente(selectedValoracion.id);
      if (result.success) {
        setSuccess('¡Valoración enviada al cliente!');
        await loadValoraciones();
        handleCloseValoracionModal();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al enviar valoración');
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle ? `${vehicle.marca} ${vehicle.modelo} - ${vehicle.placa}` : 'Vehículo desconocido';
  };

  const getClientName = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return 'Cliente desconocido';
    const client = clients.find((c) => c.id === vehicle.clienteId);
    return client ? client.nombre_completo : 'Cliente desconocido';
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completada':
        return 'success';
      case 'en_proceso':
        return 'warning';
      case 'pendiente_aprobacion_cliente':
        return 'info';
      case 'pendiente':
        return 'default';
      default:
        return 'default';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_proceso':
        return 'En Proceso';
      case 'completada':
        return 'Completada';
      case 'pendiente_aprobacion_cliente':
        return 'Enviada al Cliente';
      default:
        return estado;
    }
  };

  const calcularCostoTotal = (tareas: TareaValoracion[]) => {
    if (!tareas || tareas.length === 0) return 0;
    return tareas.reduce((sum, tarea) => sum + tarea.precioEstimado, 0);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 4, mb: 4, backgroundColor: 'info.main', color: 'white' }}>
        <Typography variant="h3" gutterBottom>
          🔧 Panel del Mecánico
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
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label={`Valoraciones Asignadas (${valoraciones.length})`} />
          <Tab label="Órdenes de Trabajo" />
        </Tabs>

        {/* TAB 0: VALORACIONES */}
        {currentTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Vehículos Asignados para Valoración
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Aquí puedes ver los vehículos que te han asignado para valorar. Crea una lista de tareas necesarias con su precio estimado.
            </Typography>

            {loadingData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : valoraciones.length === 0 ? (
              <Alert severity="info">
                No tienes valoraciones asignadas en este momento.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {valoraciones.map((valoracion) => (
                  <Grid item xs={12} md={6} lg={4} key={valoracion.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6" component="div">
                            🚗 {getVehicleInfo(valoracion.vehiculoId)}
                          </Typography>
                          <Chip
                            label={getEstadoLabel(valoracion.estado)}
                            color={getEstadoColor(valoracion.estado)}
                            size="small"
                          />
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Cliente:</strong> {getClientName(valoracion.vehiculoId)}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Fecha Asignación:</strong>{' '}
                          {new Date(valoracion.fechaAsignacion).toLocaleDateString()}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Tareas propuestas:</strong> {valoracion.tareas?.length || 0}
                        </Typography>

                        {valoracion.tareas && valoracion.tareas.length > 0 && (
                          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'bold' }}>
                            Costo estimado: ₡{calcularCostoTotal(valoracion.tareas).toLocaleString()}
                          </Typography>
                        )}

                        {valoracion.estadoCliente && valoracion.estadoCliente !== 'pendiente_revision' && (
                          <Box sx={{ mt: 2 }}>
                            <Chip
                              label={
                                valoracion.estadoCliente === 'totalmente_aceptada'
                                  ? '✅ Cliente aceptó todas las tareas'
                                  : valoracion.estadoCliente === 'parcialmente_aceptada'
                                  ? '⚠️ Cliente aceptó algunas tareas'
                                  : '❌ Cliente rechazó las tareas'
                              }
                              color={
                                valoracion.estadoCliente === 'totalmente_aceptada'
                                  ? 'success'
                                  : valoracion.estadoCliente === 'parcialmente_aceptada'
                                  ? 'warning'
                                  : 'error'
                              }
                              size="small"
                            />
                          </Box>
                        )}
                      </CardContent>

                      <CardActions>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Visibility />}
                          onClick={() => handleOpenValoracion(valoracion)}
                          fullWidth
                        >
                          Ver / Editar Tareas
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* TAB 1: ÓRDENES DE TRABAJO */}
        {currentTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Mis Órdenes de Trabajo
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              Próximamente: Aquí verás las órdenes de trabajo que te asignen después de que el cliente apruebe las tareas.
            </Alert>
          </Box>
        )}
      </Paper>

      {/* MODAL: DETALLES DE VALORACIÓN */}
      <Dialog
        open={openValoracionModal}
        onClose={handleCloseValoracionModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Valoración: {selectedValoracion && getVehicleInfo(selectedValoracion.vehiculoId)}
            </Typography>
            {selectedValoracion && (
              <Chip
                label={getEstadoLabel(selectedValoracion.estado)}
                color={getEstadoColor(selectedValoracion.estado)}
              />
            )}
          </Box>
        </DialogTitle>

        <DialogContent>
          {selectedValoracion && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <strong>Cliente:</strong> {getClientName(selectedValoracion.vehiculoId)}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Lista de Tareas</Typography>
                {selectedValoracion.estado !== 'pendiente_aprobacion_cliente' && (
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleOpenTareaModal}
                    size="small"
                  >
                    Agregar Tarea
                  </Button>
                )}
              </Box>

              {selectedValoracion.tareas && selectedValoracion.tareas.length === 0 ? (
                <Alert severity="info">
                  No hay tareas agregadas. Haz clic en "Agregar Tarea" para comenzar.
                </Alert>
              ) : (
                <List>
                  {selectedValoracion.tareas?.map((tarea, index) => (
                    <Paper key={tarea.id} sx={{ p: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {index + 1}. {tarea.nombre}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {tarea.descripcion}
                          </Typography>
                          <Typography variant="body1" color="primary.main" sx={{ mt: 1, fontWeight: 'bold' }}>
                            Precio estimado: ₡{tarea.precioEstimado.toLocaleString()}
                          </Typography>
                          {tarea.estado !== 'propuesta' && (
                            <Chip
                              label={
                                tarea.estado === 'aceptada'
                                  ? '✅ Aceptada por cliente'
                                  : '❌ Rechazada por cliente'
                              }
                              color={tarea.estado === 'aceptada' ? 'success' : 'error'}
                              size="small"
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Box>
                        {selectedValoracion.estado !== 'pendiente_aprobacion_cliente' && (
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteTarea(tarea.id)}
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </Box>
                    </Paper>
                  ))}
                </List>
              )}

              {selectedValoracion.tareas && selectedValoracion.tareas.length > 0 && (
                <Paper sx={{ p: 2, mt: 2, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="h6">
                    Costo Total Estimado: ₡{calcularCostoTotal(selectedValoracion.tareas).toLocaleString()}
                  </Typography>
                </Paper>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseValoracionModal}>Cerrar</Button>
          {selectedValoracion && 
           selectedValoracion.estado !== 'pendiente_aprobacion_cliente' && 
           selectedValoracion.tareas && 
           selectedValoracion.tareas.length > 0 && (
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={handleEnviarACliente}
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar al Cliente'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* MODAL: AGREGAR TAREA */}
      <Dialog open={openTareaModal} onClose={handleCloseTareaModal} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Nueva Tarea</DialogTitle>
        <form onSubmit={handleSubmitTarea}>
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

            <TextField
              fullWidth
              label="Nombre de la Tarea"
              name="nombre"
              value={tareaFormData.nombre}
              onChange={handleTareaInputChange}
              required
              placeholder="Ej: Cambio de aceite"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Descripción"
              name="descripcion"
              value={tareaFormData.descripcion}
              onChange={handleTareaInputChange}
              required
              multiline
              rows={3}
              placeholder="Describe detalladamente el trabajo a realizar..."
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Precio Estimado (₡)"
              name="precioEstimado"
              type="number"
              value={tareaFormData.precioEstimado}
              onChange={handleTareaInputChange}
              required
              InputProps={{ inputProps: { min: 0, step: 100 } }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseTareaModal} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? 'Agregando...' : 'Agregar Tarea'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default MecanicoPage;