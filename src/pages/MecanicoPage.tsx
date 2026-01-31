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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Badge,
  LinearProgress,
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
  PlayArrow,
  Pause,
  Stop,
  Build,
  DirectionsCar,
  Assignment,
  AttachMoney,
  Schedule,
  ShoppingCart,
  Task,
} from '@mui/icons-material';
import { valoracionService, type Valoracion, type TareaValoracion } from '../api/services/valoracion.service';
import { vehicleService } from '../api/services/vehicle.service';
import { clientService } from '../api/services/client.service';
import { ordenTrabajoService, type OrdenTrabajo, type TareaOrdenTrabajo, type RepuestoUsado } from '../api/services/ordenTrabajo.service';

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
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<OrdenTrabajo[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  // Modal de valoración
  const [openValoracionModal, setOpenValoracionModal] = useState(false);
  const [selectedValoracion, setSelectedValoracion] = useState<Valoracion | null>(null);

  // Modal de tarea (valoración)
  const [openTareaModal, setOpenTareaModal] = useState(false);
  const [tareaFormData, setTareaFormData] = useState({
    nombre: '',
    descripcion: '',
    precioEstimado: 0,
  });

  // Modal de trabajar en OT
  const [openTrabajarOTModal, setOpenTrabajarOTModal] = useState(false);
  const [selectedOT, setSelectedOT] = useState<OrdenTrabajo | null>(null);

  // Modal de ver detalles OT
  const [openDetallesOTModal, setOpenDetallesOTModal] = useState(false);

  // Estado para trabajar en OT
  const [trabajoOTData, setTrabajoOTData] = useState({
    repuestosUsados: [] as RepuestoUsado[],
    nuevoRepuesto: { nombre: '', cantidad: 0, precio: 0 },
    horasTrabajadas: 0,
    costoManoObra: 0,
    observaciones: '',
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
      loadOrdenesTrabajo(),
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

  const loadOrdenesTrabajo = async () => {
    if (!user?.id) return;
    setLoadingData(true);
    try {
      const result = await ordenTrabajoService.getOrdenesByMecanico(user.id);
      if (result.success && result.data) {
        setOrdenesTrabajo(result.data);
      }
    } catch (err) {
      console.error('Error cargando órdenes de trabajo:', err);
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

  // ========== GESTIÓN DE TAREAS (VALORACIÓN) ==========

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

  // ========== GESTIÓN DE ÓRDENES DE TRABAJO ==========

  const handleIniciarOT = async (ot: OrdenTrabajo) => {
    if (!window.confirm('¿Iniciar trabajo en esta orden?')) return;

    setLoading(true);
    try {
      const result = await ordenTrabajoService.updateOrdenTrabajo(ot.id, {
        estado: 'en_progreso',
      });

      if (result.success) {
        setSuccess('¡Orden de trabajo iniciada!');
        await loadOrdenesTrabajo();
        
        // Abrir modal de trabajo
        const updatedOT = await ordenTrabajoService.getOrdenById(ot.id);
        if (updatedOT.success && updatedOT.data) {
          handleOpenTrabajarOT(updatedOT.data);
        }
        
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al iniciar orden');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTrabajarOT = (ot: OrdenTrabajo) => {
    setSelectedOT(ot);
    setTrabajoOTData({
      repuestosUsados: ot.repuestosUsados || [],
      nuevoRepuesto: { nombre: '', cantidad: 0, precio: 0 },
      horasTrabajadas: ot.horasTrabajadas || 0,
      costoManoObra: ot.costoManoObra || 0,
      observaciones: ot.observaciones || '',
    });
    setOpenTrabajarOTModal(true);
  };

  const handleCloseTrabajarOTModal = () => {
    setOpenTrabajarOTModal(false);
    setSelectedOT(null);
    setTrabajoOTData({
      repuestosUsados: [],
      nuevoRepuesto: { nombre: '', cantidad: 0, precio: 0 },
      horasTrabajadas: 0,
      costoManoObra: 0,
      observaciones: '',
    });
  };

  const handleOpenDetallesOT = (ot: OrdenTrabajo) => {
    setSelectedOT(ot);
    setOpenDetallesOTModal(true);
  };

  const handleCloseDetallesOTModal = () => {
    setOpenDetallesOTModal(false);
    setSelectedOT(null);
  };

  const handleCompletarTarea = async (tareaId: string) => {
    if (!selectedOT) return;

    try {
      const result = await ordenTrabajoService.completarTarea(selectedOT.id, tareaId);
      if (result.success) {
        setSuccess('✅ Tarea completada');
        
        // Recargar OT actualizada
        const updated = await ordenTrabajoService.getOrdenById(selectedOT.id);
        if (updated.success && updated.data) {
          setSelectedOT(updated.data);
        }
        
        await loadOrdenesTrabajo();
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al completar tarea');
    }
  };

  const handleAgregarRepuesto = () => {
    const { nombre, cantidad, precio } = trabajoOTData.nuevoRepuesto;
    if (nombre.trim() && cantidad > 0 && precio >= 0) {
      setTrabajoOTData(prev => ({
        ...prev,
        repuestosUsados: [...prev.repuestosUsados, { nombre, cantidad, precio }],
        nuevoRepuesto: { nombre: '', cantidad: 0, precio: 0 },
      }));
    }
  };

  const handleEliminarRepuesto = (index: number) => {
    setTrabajoOTData(prev => ({
      ...prev,
      repuestosUsados: prev.repuestosUsados.filter((_, i) => i !== index),
    }));
  };

  const handlePausarOT = async () => {
    if (!selectedOT) return;
    if (!window.confirm('¿Pausar esta orden de trabajo?')) return;

    setLoading(true);
    try {
      const costoRepuestos = trabajoOTData.repuestosUsados.reduce(
        (sum, rep) => sum + (rep.precio * rep.cantidad), 
        0
      );

      const result = await ordenTrabajoService.updateOrdenTrabajo(selectedOT.id, {
        estado: 'pausada',
        repuestosUsados: trabajoOTData.repuestosUsados,
        horasTrabajadas: trabajoOTData.horasTrabajadas,
        costoManoObra: trabajoOTData.costoManoObra,
        costoRepuestos: costoRepuestos,
        observaciones: trabajoOTData.observaciones,
      });

      if (result.success) {
        setSuccess('⏸️ Orden pausada y guardada');
        await loadOrdenesTrabajo();
        handleCloseTrabajarOTModal();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al pausar orden');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizarOT = async () => {
    if (!selectedOT) return;

    // Verificar que todas las tareas estén completadas
    const tareasIncompletas = selectedOT.tareasAprobadas?.filter(t => !t.completada) || [];
    
    if (tareasIncompletas.length > 0) {
      setError(`Debes completar todas las tareas antes de finalizar. Faltan ${tareasIncompletas.length} tarea(s).`);
      return;
    }

    if (!window.confirm('¿Finalizar esta orden de trabajo? Esta acción marcará el trabajo como completado.')) return;

    setLoading(true);
    try {
      const costoRepuestos = trabajoOTData.repuestosUsados.reduce(
        (sum, rep) => sum + (rep.precio * rep.cantidad), 
        0
      );

      const result = await ordenTrabajoService.updateOrdenTrabajo(selectedOT.id, {
        estado: 'completada',
        repuestosUsados: trabajoOTData.repuestosUsados,
        horasTrabajadas: trabajoOTData.horasTrabajadas,
        costoManoObra: trabajoOTData.costoManoObra,
        costoRepuestos: costoRepuestos,
        observaciones: trabajoOTData.observaciones,
      });

      if (result.success) {
        setSuccess('✅ ¡Orden de trabajo completada!');
        await loadOrdenesTrabajo();
        handleCloseTrabajarOTModal();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al finalizar orden');
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
      case 'en_progreso':
        return 'warning';
      case 'asignada':
        return 'info';
      case 'pausada':
        return 'default';
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
      case 'en_progreso':
        return 'En Progreso';
      case 'asignada':
        return 'Asignada';
      case 'completada':
        return 'Completada';
      case 'pausada':
        return 'Pausada';
      case 'pendiente_aprobacion_cliente':
        return 'Enviada al Cliente';
      default:
        return estado;
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'urgente':
        return 'error';
      case 'alta':
        return 'warning';
      case 'media':
        return 'info';
      case 'baja':
        return 'default';
      default:
        return 'default';
    }
  };

  const calcularCostoTotal = (tareas: TareaValoracion[]) => {
    if (!tareas || tareas.length === 0) return 0;
    return tareas.reduce((sum, tarea) => sum + tarea.precioEstimado, 0);
  };

  const calcularProgresoTareas = (tareas?: TareaOrdenTrabajo[]) => {
    if (!tareas || tareas.length === 0) return 0;
    const completadas = tareas.filter(t => t.completada).length;
    return (completadas / tareas.length) * 100;
  };

  const getOTsActivas = () => {
    return ordenesTrabajo.filter(ot => 
      ot.estado !== 'completada' && ot.estado !== 'cancelada'
    ).length;
  };

  const getOTsEnProgreso = () => {
    return ordenesTrabajo.filter(ot => ot.estado === 'en_progreso').length;
  };

  const getOTsCompletadas = () => {
    return ordenesTrabajo.filter(ot => ot.estado === 'completada').length;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ 
        p: 4, 
        mb: 4, 
        background: 'linear-gradient(135deg, #00897b 0%, #00695c 100%)',
        color: 'white',
        borderRadius: 2
      }}>
        <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Build fontSize="large" />
          Panel del Mecánico
        </Typography>
        <Typography variant="h5">Bienvenido, {user?.nombre_completo}</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          <strong>Especialidad:</strong> {user?.specialty || 'General'}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
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

      {/* Estadísticas rápidas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Assignment sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4">{getOTsActivas()}</Typography>
              <Typography variant="body2" color="text.secondary">OTs Activas</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Build sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4">{getOTsEnProgreso()}</Typography>
              <Typography variant="body2" color="text.secondary">En Progreso</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4">{getOTsCompletadas()}</Typography>
              <Typography variant="body2" color="text.secondary">Completadas</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 4, borderRadius: 2 }}>
        <Tabs 
          value={currentTab} 
          onChange={(e, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={
            <Badge badgeContent={valoraciones.length} color="secondary">
              Valoraciones
            </Badge>
          } />
          <Tab label={
            <Badge badgeContent={ordenesTrabajo.length} color="primary">
              Órdenes de Trabajo
            </Badge>
          } />
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
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Gestiona las órdenes de trabajo asignadas. Completa las tareas aprobadas por el cliente.
            </Typography>

            {loadingData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : ordenesTrabajo.length === 0 ? (
              <Alert severity="info">
                No tienes órdenes de trabajo asignadas en este momento.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {ordenesTrabajo.map((ot) => {
                  const progreso = calcularProgresoTareas(ot.tareasAprobadas);
                  const tareasCompletadas = ot.tareasAprobadas?.filter(t => t.completada).length || 0;
                  const totalTareas = ot.tareasAprobadas?.length || 0;

                  return (
                    <Grid item xs={12} md={6} lg={4} key={ot.id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Typography variant="h6">
                              <strong>{ot.numeroOT}</strong>
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                              <Chip 
                                label={getEstadoLabel(ot.estado)} 
                                color={getEstadoColor(ot.estado)} 
                                size="small" 
                              />
                              <Chip 
                                label={ot.prioridad} 
                                color={getPrioridadColor(ot.prioridad)} 
                                size="small" 
                                variant="outlined"
                              />
                            </Box>
                          </Box>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <DirectionsCar sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                            {getVehicleInfo(ot.vehiculoId)}
                          </Typography>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Cliente:</strong> {getClientName(ot.vehiculoId)}
                          </Typography>

                          <Divider sx={{ my: 2 }} />

                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">
                                <strong>Progreso de tareas:</strong>
                              </Typography>
                              <Typography variant="body2" color="primary.main">
                                {tareasCompletadas}/{totalTareas}
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={progreso} 
                              sx={{ height: 8, borderRadius: 1 }}
                            />
                          </Box>

                          <Typography variant="h6" color="primary.main" sx={{ mt: 2 }}>
                            ₡{ot.costoTotal?.toLocaleString() || 0}
                          </Typography>
                        </CardContent>

                        <CardActions sx={{ flexDirection: 'column', gap: 1, p: 2 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Visibility />}
                            onClick={() => handleOpenDetallesOT(ot)}
                            fullWidth
                          >
                            Ver Detalles
                          </Button>

                          {ot.estado === 'asignada' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<PlayArrow />}
                              onClick={() => handleIniciarOT(ot)}
                              fullWidth
                            >
                              Iniciar Trabajo
                            </Button>
                          )}

                          {(ot.estado === 'en_progreso' || ot.estado === 'pausada') && (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<Build />}
                              onClick={() => handleOpenTrabajarOT(ot)}
                              fullWidth
                            >
                              Continuar Trabajo
                            </Button>
                          )}
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
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

      {/* MODAL: VER DETALLES DE OT (Solo lectura) */}
      <Dialog
        open={openDetallesOTModal}
        onClose={handleCloseDetallesOTModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {selectedOT?.numeroOT}
            </Typography>
            {selectedOT && (
              <Chip
                label={getEstadoLabel(selectedOT.estado)}
                color={getEstadoColor(selectedOT.estado)}
              />
            )}
          </Box>
        </DialogTitle>

        <DialogContent>
          {selectedOT && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Vehículo:</strong> {getVehicleInfo(selectedOT.vehiculoId)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <strong>Cliente:</strong> {getClientName(selectedOT.vehiculoId)}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" sx={{ mb: 2 }}>Tareas Aprobadas</Typography>
              {selectedOT.tareasAprobadas && selectedOT.tareasAprobadas.length > 0 ? (
                <List>
                  {selectedOT.tareasAprobadas.map((tarea, index) => (
                    <Paper key={tarea.id} sx={{ p: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {index + 1}. {tarea.nombre}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {tarea.descripcion}
                          </Typography>
                          <Typography variant="body2" color="primary.main" sx={{ mt: 1 }}>
                            ₡{tarea.precioEstimado.toLocaleString()}
                          </Typography>
                        </Box>
                        {tarea.completada && (
                          <Chip label="✓ Completada" color="success" size="small" />
                        )}
                      </Box>
                    </Paper>
                  ))}
                </List>
              ) : (
                <Alert severity="info">No hay tareas asignadas</Alert>
              )}

              {selectedOT.repuestosUsados && selectedOT.repuestosUsados.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>Repuestos Utilizados</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Repuesto</TableCell>
                          <TableCell align="center">Cantidad</TableCell>
                          <TableCell align="right">Precio Unit.</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOT.repuestosUsados.map((rep, index) => (
                          <TableRow key={index}>
                            <TableCell>{rep.nombre}</TableCell>
                            <TableCell align="center">{rep.cantidad}</TableCell>
                            <TableCell align="right">₡{rep.precio.toLocaleString()}</TableCell>
                            <TableCell align="right">₡{(rep.precio * rep.cantidad).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Horas trabajadas:</strong> {selectedOT.horasTrabajadas || 0}h
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Costo mano de obra:</strong> ₡{selectedOT.costoManoObra?.toLocaleString() || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Costo repuestos:</strong> ₡{selectedOT.costoRepuestos?.toLocaleString() || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6" color="primary.main">
                    <strong>Total:</strong> ₡{selectedOT.costoTotal?.toLocaleString() || 0}
                  </Typography>
                </Grid>
              </Grid>

              {selectedOT.observaciones && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2">Observaciones:</Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                    {selectedOT.observaciones}
                  </Typography>
                </>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDetallesOTModal}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: TRABAJAR EN OT */}
      <Dialog
        open={openTrabajarOTModal}
        onClose={handleCloseTrabajarOTModal}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { maxHeight: '90vh' } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Trabajando en: {selectedOT?.numeroOT}
            </Typography>
            <Chip
              label={getEstadoLabel(selectedOT?.estado || '')}
              color={getEstadoColor(selectedOT?.estado || '')}
            />
          </Box>
        </DialogTitle>

        <DialogContent>
          {selectedOT && (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Vehículo:</strong> {getVehicleInfo(selectedOT.vehiculoId)} | <strong>Cliente:</strong> {getClientName(selectedOT.vehiculoId)}
                </Typography>
              </Alert>

              {/* SECCIÓN: TAREAS */}
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Task /> Tareas a Realizar
              </Typography>

              {selectedOT.tareasAprobadas && selectedOT.tareasAprobadas.length > 0 ? (
                <Box sx={{ mb: 3 }}>
                  {selectedOT.tareasAprobadas.map((tarea, index) => (
                    <Paper 
                      key={tarea.id} 
                      sx={{ 
                        p: 2, 
                        mb: 2,
                        backgroundColor: tarea.completada ? '#e8f5e9' : 'white',
                        border: tarea.completada ? '2px solid #4caf50' : '1px solid #e0e0e0'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontWeight: 'bold',
                              textDecoration: tarea.completada ? 'line-through' : 'none'
                            }}
                          >
                            {index + 1}. {tarea.nombre}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {tarea.descripcion}
                          </Typography>
                          <Typography variant="body2" color="primary.main" sx={{ mt: 1, fontWeight: 'bold' }}>
                            ₡{tarea.precioEstimado.toLocaleString()}
                          </Typography>
                        </Box>
                        
                        {tarea.completada ? (
                          <Chip 
                            label="✓ Completada" 
                            color="success" 
                            size="small"
                            icon={<CheckCircle />}
                          />
                        ) : (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleCompletarTarea(tarea.id)}
                            startIcon={<CheckCircle />}
                          >
                            Completar
                          </Button>
                        )}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  No hay tareas asignadas a esta orden.
                </Alert>
              )}

              

              
                    
                
             

             

             
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
          <Button onClick={handleCloseTrabajarOTModal} disabled={loading}>
            Cerrar
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="warning"
              onClick={handlePausarOT}
              disabled={loading}
              startIcon={<Pause />}
            >
              Pausar
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleFinalizarOT}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
            >
              {loading ? 'Finalizando...' : 'Finalizar'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MecanicoPage;