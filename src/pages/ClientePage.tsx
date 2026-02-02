// src/pages/ClientePage.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Badge,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { DirectionsCar, Receipt } from '@mui/icons-material';

import { useAuthContext } from '../contexts/AuthContext';
import { cotizacionService, type Cotizacion } from '../api/services/cotizacion.service';
import { vehicleService, type Vehicle } from '../api/services/vehicle.service';
import { ordenTrabajoService, type OrdenTrabajo } from '../api/services/ordenTrabajo.service';

const ClientePage = () => {
  const { user } = useAuthContext();

  const [currentTab, setCurrentTab] = useState(0);
  const [loadingData, setLoadingData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<OrdenTrabajo[]>([]);

  const [openCotizacionModal, setOpenCotizacionModal] = useState(false);
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);
  const [selectedOpcionales, setSelectedOpcionales] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user?.id) {
      void loadAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadAll = async () => {
    setLoadingData(true);
    setError(null);
    try {
      await Promise.all([loadVehicles(), loadCotizaciones()]);
      await loadOrdenesTrabajo();
    } catch (err: any) {
      console.error(err);
      setError('Error cargando datos.');
    } finally {
      setLoadingData(false);
    }
  };

  const loadVehicles = async () => {
    if (!user?.id) return;
    const res = await vehicleService.getVehiclesByClient(user.id);
    if (res.success && res.data) {
      setVehicles(res.data);
    }
  };

  const loadCotizaciones = async () => {
    if (!user?.id) return;
    const res = await cotizacionService.getCotizacionesByCliente(user.id);
    if (res.success && res.data) {
      // ordenar por fecha
      const sorted = [...res.data].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setCotizaciones(sorted);
    }
  };

  const loadOrdenesTrabajo = async () => {
    // No hay un endpoint por cliente, así que se construye por vehículo
    const all: OrdenTrabajo[] = [];
    for (const v of vehicles) {
      const res = await ordenTrabajoService.getOrdenesByVehiculo(v.id);
      if (res.success && res.data) {
        all.push(...res.data);
      }
    }
    // eliminar duplicados por id
    const map = new Map<string, OrdenTrabajo>();
    all.forEach((ot) => map.set(ot.id, ot));
    setOrdenesTrabajo(Array.from(map.values()).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
  };

  const getVehicleInfo = (vehiculoId: string) => {
    const v = vehicles.find((x) => x.id === vehiculoId);
    return v ? `${v.marca} ${v.modelo} - ${v.placa}` : 'Vehículo';
  };

  const cotizacionTotal = useMemo(() => {
    if (!selectedCotizacion) return 0;
    const items = selectedCotizacion.items || [];
    const repuestos = selectedCotizacion.repuestos || [];

    const itemsTotal = items.reduce((sum, it) => {
      const included = it.obligatorio ? true : !!selectedOpcionales[it.id];
      return sum + (included ? (it.precio || 0) : 0);
    }, 0);

    const repuestosTotal = repuestos.reduce((sum, r) => sum + (r.cantidad || 0) * (r.precioUnitario || 0), 0);

    return itemsTotal + repuestosTotal;
  }, [selectedCotizacion, selectedOpcionales]);

  const openResponderCotizacion = (c: Cotizacion) => {
    setSelectedCotizacion(c);
    // por defecto: opcionales desmarcadas
    const init: Record<string, boolean> = {};
    (c.items || []).forEach((it) => {
      if (!it.obligatorio) init[it.id] = false;
    });
    setSelectedOpcionales(init);
    setOpenCotizacionModal(true);
    setError(null);
    setSuccess(null);
  };

  const closeResponderCotizacion = () => {
    setOpenCotizacionModal(false);
    setSelectedCotizacion(null);
    setSelectedOpcionales({});
  };

  const toggleOpcional = (itemId: string, checked: boolean) => {
    setSelectedOpcionales((prev) => ({ ...prev, [itemId]: checked }));
  };

  const aceptarCotizacion = async () => {
    if (!selectedCotizacion) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const opc = Object.entries(selectedOpcionales)
        .filter(([, v]) => v)
        .map(([k]) => k);

      const res = await cotizacionService.responderCotizacion(selectedCotizacion.id, {
        aceptada: true,
        itemsOpcionalesSeleccionados: opc,
      });
      if (res.success) {
        setSuccess('✅ Cotización aprobada. Se generó una Orden de Trabajo.');
        await Promise.all([loadCotizaciones(), loadOrdenesTrabajo()]);
        setTimeout(() => closeResponderCotizacion(), 900);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      console.error(err);
      setError('Error aprobando cotización.');
    } finally {
      setLoading(false);
    }
  };

  const rechazarCotizacion = async () => {
    if (!selectedCotizacion) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await cotizacionService.responderCotizacion(selectedCotizacion.id, {
        aceptada: false,
        itemsOpcionalesSeleccionados: [],
      });
      if (res.success) {
        setSuccess('❌ Cotización rechazada.');
        await loadCotizaciones();
        setTimeout(() => closeResponderCotizacion(), 900);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      console.error(err);
      setError('Error rechazando cotización.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Debes iniciar sesión para acceder.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'white' }}>
          <Typography variant="h5">Portal del Cliente</Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Revisa cotizaciones, tus vehículos y órdenes de trabajo.
          </Typography>
        </Box>

        <Tabs value={currentTab} onChange={(_e, v) => setCurrentTab(v)}>
          <Tab
            label={
              <Badge badgeContent={cotizaciones.filter(c => c.estado === 'pendiente_aprobacion_cliente').length} color="warning">
                Cotizaciones
              </Badge>
            }
          />
          <Tab label={`Mis Vehículos (${vehicles.length})`} />
          <Tab
            label={
              <Badge badgeContent={ordenesTrabajo.length} color="secondary">
                Órdenes de Trabajo
              </Badge>
            }
          />
        </Tabs>

        {/* TAB 0: COTIZACIONES */}
        {currentTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cotizaciones
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Aquí aparecen las cotizaciones creadas por el administrador del taller a partir de la valoración del mecánico.
              Puedes aprobarlas o rechazarlas.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            {loadingData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : cotizaciones.length === 0 ? (
              <Alert severity="info">Aún no tienes cotizaciones.</Alert>
            ) : (
              <Grid container spacing={2}>
                {cotizaciones.map((c) => (
                  <Grid item xs={12} md={6} key={c.id}>
                    <Card sx={{ borderRadius: 2 }} variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DirectionsCar fontSize="small" /> {getVehicleInfo(c.vehiculoId)}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                          <Chip
                            label={`Estado: ${c.estado}`}
                            color={c.estado === 'pendiente_aprobacion_cliente' ? 'warning' : c.estado === 'aprobada' ? 'success' : 'error'}
                            size="small"
                          />
                          <Chip
                            icon={<Receipt fontSize="small" />}
                            label={`Total estimado: ₡${(c.totalEstimado || 0).toLocaleString()}`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'flex-end' }}>
                        <Button size="small" variant="contained" onClick={() => openResponderCotizacion(c)}>
                          Ver detalle
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* TAB 1: VEHÍCULOS */}
        {currentTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Mis Vehículos
            </Typography>

            {loadingData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : vehicles.length === 0 ? (
              <Alert severity="info">No tienes vehículos registrados.</Alert>
            ) : (
              <Grid container spacing={2}>
                {vehicles.map((v) => (
                  <Grid item xs={12} md={6} key={v.id}>
                    <Card sx={{ borderRadius: 2 }} variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DirectionsCar fontSize="small" /> {v.marca} {v.modelo}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Placa: <strong>{v.placa}</strong>
                        </Typography>
                        {v.estadoProceso && (
                          <Chip label={v.estadoProceso} size="small" sx={{ mt: 1 }} />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* TAB 2: ÓRDENES */}
        {currentTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Órdenes de Trabajo
            </Typography>

            {loadingData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : ordenesTrabajo.length === 0 ? (
              <Alert severity="info">Aún no tienes órdenes de trabajo.</Alert>
            ) : (
              <Grid container spacing={2}>
                {ordenesTrabajo.map((ot) => (
                  <Grid item xs={12} md={6} key={ot.id}>
                    <Card sx={{ borderRadius: 2 }} variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Receipt fontSize="small" /> {ot.numeroOT}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Vehículo: <strong>{getVehicleInfo(ot.vehiculoId)}</strong>
                        </Typography>
                        <Chip label={ot.estado} size="small" sx={{ mt: 1 }} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Paper>

      {/* MODAL: RESPONDER COTIZACIÓN */}
      <Dialog open={openCotizacionModal} onClose={closeResponderCotizacion} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalle de Cotización
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {selectedCotizacion && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Vehículo: <strong>{getVehicleInfo(selectedCotizacion.vehiculoId)}</strong>
              </Alert>

              <Typography variant="h6" gutterBottom>Reparaciones</Typography>
              {(selectedCotizacion.items || []).length === 0 ? (
                <Alert severity="warning">No hay reparaciones en la cotización.</Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {selectedCotizacion.items.map((it) => (
                    <Paper key={it.id} sx={{ p: 2, borderRadius: 2 }} variant="outlined">
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                        <Box>
                          <Typography variant="subtitle1"><strong>{it.nombre}</strong></Typography>
                          <Typography variant="body2" color="text.secondary">{it.descripcion}</Typography>
                          <Chip
                            label={it.obligatorio ? 'Obligatoria' : 'Opcional'}
                            color={it.obligatorio ? 'warning' : 'info'}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </Box>

                        {!it.obligatorio ? (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!selectedOpcionales[it.id]}
                                onChange={(e) => toggleOpcional(it.id, e.target.checked)}
                              />
                            }
                            label="Incluir"
                          />
                        ) : (
                          <Chip label="Incluida" size="small" variant="outlined" />
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Precio: <strong>₡{(it.precio || 0).toLocaleString()}</strong>
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}

              {((selectedCotizacion.repuestos || []).length > 0) && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>Repuestos</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedCotizacion.repuestos.map((r) => (
                      <Paper key={r.id} sx={{ p: 2, borderRadius: 2 }} variant="outlined">
                        <Typography variant="subtitle2"><strong>{r.nombre}</strong></Typography>
                        <Typography variant="body2" color="text.secondary">
                          Cantidad: {r.cantidad} · Precio unitario: ₡{(r.precioUnitario || 0).toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                          Total: <strong>₡{((r.cantidad || 0) * (r.precioUnitario || 0)).toLocaleString()}</strong>
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </>
              )}

              <Divider sx={{ my: 2 }} />
              <Alert severity="success">
                Total seleccionado: <strong>₡{cotizacionTotal.toLocaleString()}</strong>
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeResponderCotizacion} disabled={loading}>Cerrar</Button>
          {selectedCotizacion?.estado === 'pendiente_aprobacion_cliente' && (
            <>
              <Button variant="outlined" color="error" onClick={rechazarCotizacion} disabled={loading}>
                Rechazar
              </Button>
              <Button variant="contained" color="success" onClick={aceptarCotizacion} disabled={loading}>
                Aprobar
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientePage;
