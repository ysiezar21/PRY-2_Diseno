// src/pages/ClientePage.tsx
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
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import { useAuthContext } from '../contexts/AuthContext';
import {
  CheckCircle,
  Cancel,
  Visibility,
} from '@mui/icons-material';
import { valoracionService, type Valoracion, type TareaValoracion } from '../api/services/valoracion.service';
import { vehicleService } from '../api/services/vehicle.service';
import { ordenTrabajoService } from '../api/services/ordenTrabajo.service';

const ClientePage = () => {
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
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<any[]>([]);

  // Modal de valoración
  const [openValoracionModal, setOpenValoracionModal] = useState(false);
  const [selectedValoracion, setSelectedValoracion] = useState<Valoracion | null>(null);

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
      loadOrdenesTrabajo(),
    ]);
  };

  const loadValoraciones = async () => {
    if (!user?.id) return;
    setLoadingData(true);
    try {
      const result = await valoracionService.getValoracionesByCliente(user.id);
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
    if (!user?.id) return;
    try {
      const result = await vehicleService.getVehiclesByClient(user.id);
      if (result.success && result.data) {
        setVehicles(result.data);
      }
    } catch (err) {
      console.error('Error cargando vehículos:', err);
    }
  };

  const loadOrdenesTrabajo = async () => {
    if (!user?.id) return;
    try {
      // Obtener todas las OTs de los vehículos del cliente
      const vehicleResult = await vehicleService.getVehiclesByClient(user.id);
      if (vehicleResult.success && vehicleResult.data) {
        const vehicleIds = vehicleResult.data.map((v: any) => v.id);
        
        const allOTs: any[] = [];
        for (const vehicleId of vehicleIds) {
          const otResult = await ordenTrabajoService.getOrdenesByVehiculo(vehicleId);
          if (otResult.success && otResult.data) {
            allOTs.push(...otResult.data);
          }
        }
        
        setOrdenesTrabajo(allOTs);
      }
    } catch (err) {
      console.error('Error cargando órdenes de trabajo:', err);
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

  const handleResponderTarea = async (tareaId: string, aceptada: boolean) => {
    if (!selectedValoracion) return;

    setLoading(true);
    setError(null);

    try {
      const result = await valoracionService.responderTarea(
        selectedValoracion.id,
        tareaId,
        aceptada
      );

      if (result.success) {
        const mensaje = aceptada ? 'Tarea aceptada' : 'Tarea rechazada';
        
        // Si todas las tareas fueron respondidas
        if (result.data?.todasRespondidas) {
          if (result.data.estadoCliente === 'totalmente_aceptada') {
            setSuccess(`${mensaje} ✅ ¡Has aceptado todas las tareas! El taller procederá a crear la orden de trabajo.`);
          } else if (result.data.estadoCliente === 'parcialmente_aceptada') {
            setSuccess(`${mensaje} ✅ Has completado tu revisión. Aceptaste ${result.data.tareasAceptadas} de ${result.data.tareasAceptadas + result.data.tareasRechazadas} tareas.`);
          } else if (result.data.estadoCliente === 'rechazada') {
            setSuccess(`${mensaje} ❌ Has rechazado todas las tareas. El taller será notificado.`);
          }
        } else {
          setSuccess(mensaje);
        }
        
        await loadValoraciones();
        
        // Actualizar la valoración seleccionada
        const updatedValoracion = await valoracionService.getValoracionById(selectedValoracion.id);
        if (updatedValoracion.success && updatedValoracion.data) {
          setSelectedValoracion(updatedValoracion.data);
        }

        setTimeout(() => {
          setSuccess(null);
          // Si completó todas las respuestas, cerrar el modal
          if (result.data?.todasRespondidas) {
            setTimeout(() => {
              handleCloseValoracionModal();
            }, 2000);
          }
        }, 5000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al responder tarea');
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle
      ? `${vehicle.marca} ${vehicle.modelo} (${vehicle.placa})`
      : 'Vehículo desconocido';
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completada':
        return 'success';
      case 'en_proceso':
      case 'en_progreso':
        return 'warning';
      case 'pendiente_aprobacion_cliente':
        return 'info';
      case 'pendiente':
      case 'asignada':
        return 'default';
      default:
        return 'default';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'Mecánico trabajando';
      case 'en_proceso':
        return 'En valoración';
      case 'completada':
        return 'Completada';
      case 'pendiente_aprobacion_cliente':
        return '⏳ Esperando tu respuesta';
      case 'asignada':
        return 'Asignada';
      case 'en_progreso':
        return 'En progreso';
      default:
        return estado;
    }
  };

  const getEstadoClienteLabel = (estado?: string) => {
    switch (estado) {
      case 'pendiente_revision':
        return '⏳ Pendiente de revisión';
      case 'revisada':
        return '👀 Revisada';
      case 'parcialmente_aceptada':
        return '⚠️ Parcialmente aceptada';
      case 'totalmente_aceptada':
        return '✅ Totalmente aceptada';
      case 'rechazada':
        return '❌ Rechazada';
      default:
        return '';
    }
  };

  const calcularCostoTotal = (tareas: TareaValoracion[]) => {
    if (!tareas || tareas.length === 0) return 0;
    return tareas.reduce((sum, tarea) => sum + tarea.precioEstimado, 0);
  };

  const calcularTareasAceptadas = (tareas: TareaValoracion[]) => {
    if (!tareas || tareas.length === 0) return 0;
    return tareas.filter((t) => t.estado === 'aceptada').reduce((sum, t) => sum + t.precioEstimado, 0);
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

  const contarTareasPorEstado = (tareas: TareaValoracion[]) => {
    if (!tareas || tareas.length === 0) {
      return { aceptadas: 0, rechazadas: 0, pendientes: 0, total: 0 };
    }
    
    return {
      aceptadas: tareas.filter((t) => t.estado === 'aceptada').length,
      rechazadas: tareas.filter((t) => t.estado === 'rechazada').length,
      pendientes: tareas.filter((t) => t.estado === 'propuesta').length,
      total: tareas.length,
    };
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 4, mb: 4, backgroundColor: 'success.main', color: 'white' }}>
        <Typography variant="h3" gutterBottom>
          🚗 Panel del Cliente
        </Typography>
        <Typography variant="h5">Bienvenido, {user?.nombre_completo}</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Rol: <strong>Cliente</strong>
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
        <Tabs value={currentTab} onChange={(_e, newValue) => setCurrentTab(newValue)}>
          <Tab label={`Valoraciones (${valoraciones.length})`} />
          <Tab label={`Mis Vehículos (${vehicles.length})`} />
          <Tab label={`Órdenes de Trabajo (${ordenesTrabajo.length})`} />
        </Tabs>

        {/* TAB 0: VALORACIONES */}
        {currentTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Valoraciones de tus Vehículos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Aquí puedes ver las valoraciones que los mecánicos han realizado a tus vehículos. Revisa las tareas propuestas y acepta las que deseas realizar.
            </Typography>

            {loadingData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : valoraciones.length === 0 ? (
              <Alert severity="info">
                No tienes valoraciones en este momento.
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
                        </Box>

                        <Chip
                          label={getEstadoLabel(valoracion.estado)}
                          color={getEstadoColor(valoracion.estado)}
                          size="small"
                          sx={{ mb: 1 }}
                        />

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Fecha:</strong>{' '}
                          {new Date(valoracion.fechaAsignacion).toLocaleDateString()}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Tareas propuestas:</strong> {valoracion.tareas?.length || 0}
                        </Typography>

                        {valoracion.tareas && valoracion.tareas.length > 0 && (
                          <>
                            <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Costo total: ₡{calcularCostoTotal(valoracion.tareas).toLocaleString()}
                            </Typography>

                            {valoracion.estadoCliente && valoracion.estadoCliente !== 'pendiente_revision' && (
                              <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                                Tareas aceptadas: ₡{calcularTareasAceptadas(valoracion.tareas).toLocaleString()}
                              </Typography>
                            )}
                          </>
                        )}

                        {valoracion.estadoCliente && (
                          <Box sx={{ mt: 2 }}>
                            <Chip
                              label={getEstadoClienteLabel(valoracion.estadoCliente)}
                              color={
                                valoracion.estadoCliente === 'totalmente_aceptada'
                                  ? 'success'
                                  : valoracion.estadoCliente === 'parcialmente_aceptada'
                                  ? 'warning'
                                  : valoracion.estadoCliente === 'pendiente_revision'
                                  ? 'info'
                                  : 'default'
                              }
                              size="small"
                            />
                          </Box>
                        )}

                        {valoracion.estado === 'pendiente_aprobacion_cliente' && (
                          <>
                            {(() => {
                              const stats = contarTareasPorEstado(valoracion.tareas || []);
                              const pendientes = stats.pendientes;
                              
                              return (
                                <>
                                  {pendientes > 0 ? (
                                    <Alert severity="warning" sx={{ mt: 2 }}>
                                      ⏰ Tienes {pendientes} {pendientes === 1 ? 'tarea pendiente' : 'tareas pendientes'} de revisar
                                    </Alert>
                                  ) : (
                                    <Alert severity="success" sx={{ mt: 2 }}>
                                      ✅ Revisión completada
                                    </Alert>
                                  )}
                                </>
                              );
                            })()}
                          </>
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
                          Ver Detalles
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* TAB 1: MIS VEHÍCULOS */}
        {currentTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Mis Vehículos Registrados
            </Typography>

            {vehicles.length === 0 ? (
              <Alert severity="info">No tienes vehículos registrados.</Alert>
            ) : (
              <Grid container spacing={3}>
                {vehicles.map((vehicle) => (
                  <Grid item xs={12} md={6} key={vehicle.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          🚗 {vehicle.marca} {vehicle.modelo}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Placa:</strong> {vehicle.placa}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Año:</strong> {vehicle.año}
                        </Typography>
                        {vehicle.color && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Color:</strong> {vehicle.color}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* TAB 2: ÓRDENES DE TRABAJO */}
        {currentTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Estado de Reparaciones
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Aquí puedes ver el progreso de las reparaciones aprobadas.
            </Typography>

            {ordenesTrabajo.length === 0 ? (
              <Alert severity="info">
                No tienes órdenes de trabajo activas.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {ordenesTrabajo.map((ot) => (
                  <Grid item xs={12} md={6} key={ot.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6">{ot.numeroOT}</Typography>
                          <Chip
                            label={ot.estado}
                            color={getEstadoColor(ot.estado)}
                            size="small"
                          />
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Vehículo:</strong> {getVehicleInfo(ot.vehiculoId)}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Fecha:</strong>{' '}
                          {new Date(ot.fechaAsignacion).toLocaleDateString()}
                        </Typography>

                        <Chip
                          label={ot.prioridad}
                          color={getPrioridadColor(ot.prioridad)}
                          size="small"
                          sx={{ mt: 1 }}
                        />

                        {ot.costoTotal && (
                          <Typography variant="h6" color="primary.main" sx={{ mt: 2 }}>
                            Total: ₡{ot.costoTotal.toLocaleString()}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
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
                <strong>Fecha de valoración:</strong>{' '}
                {new Date(selectedValoracion.fechaAsignacion).toLocaleDateString()}
              </Typography>

              {/* Barra de progreso de respuestas */}
              {selectedValoracion.tareas && selectedValoracion.tareas.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  {(() => {
                    const estadisticas = contarTareasPorEstado(selectedValoracion.tareas);
                    const porcentajeRespondido = Math.round(
                      ((estadisticas.aceptadas + estadisticas.rechazadas) / estadisticas.total) * 100
                    );

                    return (
                      <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Progreso de Revisión
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Box sx={{ flex: 1, height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' }}>
                            <Box
                              sx={{
                                height: '100%',
                                width: `${porcentajeRespondido}%`,
                                backgroundColor: porcentajeRespondido === 100 ? '#4caf50' : '#2196f3',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 50 }}>
                            {porcentajeRespondido}%
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          <Chip
                            label={`✅ Aceptadas: ${estadisticas.aceptadas}`}
                            color="success"
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={`❌ Rechazadas: ${estadisticas.rechazadas}`}
                            color="error"
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={`⏳ Pendientes: ${estadisticas.pendientes}`}
                            color="warning"
                            size="small"
                            variant="outlined"
                          />
                        </Box>

                        {estadisticas.pendientes === 0 && (
                          <Alert severity="success" sx={{ mt: 2 }}>
                            ✅ ¡Has completado tu revisión! El taller ya puede proceder.
                          </Alert>
                        )}
                      </Paper>
                    );
                  })()}
                </Box>
              )}

              {selectedValoracion.diagnostico && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Diagnóstico:
                  </Typography>
                  <Typography variant="body2">{selectedValoracion.diagnostico}</Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" sx={{ mb: 2 }}>
                Tareas Propuestas por el Mecánico
              </Typography>

              {!selectedValoracion.tareas || selectedValoracion.tareas.length === 0 ? (
                <Alert severity="info">
                  El mecánico aún no ha agregado tareas a esta valoración.
                </Alert>
              ) : (
                <List>
                  {selectedValoracion.tareas.map((tarea, index) => (
                    <Paper key={tarea.id} sx={{ p: 2, mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {index + 1}. {tarea.nombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {tarea.descripcion}
                        </Typography>
                        <Typography variant="h6" color="primary.main" sx={{ mt: 1 }}>
                          ₡{tarea.precioEstimado.toLocaleString()}
                        </Typography>

                        {tarea.estado === 'propuesta' &&
                         selectedValoracion.estado === 'pendiente_aprobacion_cliente' && (
                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Button
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircle />}
                              onClick={() => handleResponderTarea(tarea.id, true)}
                              disabled={loading}
                              size="small"
                            >
                              Aceptar
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<Cancel />}
                              onClick={() => handleResponderTarea(tarea.id, false)}
                              disabled={loading}
                              size="small"
                            >
                              Rechazar
                            </Button>
                          </Box>
                        )}

                        {tarea.estado !== 'propuesta' && (
                          <Chip
                            label={
                              tarea.estado === 'aceptada'
                                ? '✅ Aceptada'
                                : '❌ Rechazada'
                            }
                            color={tarea.estado === 'aceptada' ? 'success' : 'error'}
                            size="small"
                            sx={{ mt: 2 }}
                          />
                        )}
                      </Box>
                    </Paper>
                  ))}
                </List>
              )}

              {selectedValoracion.tareas && selectedValoracion.tareas.length > 0 && (
                <>
                  <Paper sx={{ p: 2, mt: 2, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="h6">
                      Costo Total: ₡{calcularCostoTotal(selectedValoracion.tareas).toLocaleString()}
                    </Typography>
                  </Paper>

                  {selectedValoracion.estadoCliente !== 'pendiente_revision' && (
                    <Paper sx={{ p: 2, mt: 2, backgroundColor: '#e8f5e9' }}>
                      <Typography variant="h6" color="success.main">
                        Tareas Aceptadas: ₡{calcularTareasAceptadas(selectedValoracion.tareas).toLocaleString()}
                      </Typography>
                    </Paper>
                  )}
                </>
              )}

              {selectedValoracion.estado === 'pendiente_aprobacion_cliente' && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  💡 Revisa cada tarea y acepta las que deseas realizar. El taller creará una orden de trabajo con las tareas aceptadas.
                </Alert>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseValoracionModal}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientePage;