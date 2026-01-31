// src/pages/TallerPage.tsx
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
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
  Chip,
  MenuItem,
  Autocomplete,
  Divider,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Tooltip,
  Badge,
} from '@mui/material';
import { useAuthContext } from '../contexts/AuthContext';
import {
  People,
  CarRepair,
  DirectionsCar,
  Assignment,
  Assessment,
  Delete,
  Add,
  CheckCircle,
  AttachMoney,
  Task,
  Build,
  AccountCircle,
  AddCircle,
} from '@mui/icons-material';
import { mechanicService } from '../api/services/mechanic.service';
import { clientService } from '../api/services/client.service';
import { vehicleService } from '../api/services/vehicle.service';
import { valoracionService } from '../api/services/valoracion.service';
import { ordenTrabajoService, type OrdenTrabajo as OrdenTrabajoServiceType, type TareaOrdenTrabajo } from '../api/services/ordenTrabajo.service';

interface CreateMechanicData {
  cedula: string;
  nombre_completo: string;
  email: string;
  password: string;
  phone?: string;
  specialty?: string;
}

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

interface TareaValoracion {
  id: string;
  nombre: string;
  descripcion: string;
  precioEstimado: number;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  completada?: boolean;
}

interface Valoracion {
  id: string;
  vehiculoId: string;
  mecanicoId: string;
  workshopId: string;
  estado: string;
  estadoCliente?: string;
  tareas?: TareaValoracion[];
  costoEstimado?: number;
  fechaAsignacion: string;
  observaciones?: string;
}

// Usar la interfaz del servicio
type OrdenTrabajo = OrdenTrabajoServiceType;

const TallerPage = () => {
  const { user } = useAuthContext();

  // Estados de pestañas
  const [currentTab, setCurrentTab] = useState(0);

  // Estados generales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados de datos
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<OrdenTrabajo[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Estados de modales
  const [openMechanicModal, setOpenMechanicModal] = useState(false);
  const [openClientModal, setOpenClientModal] = useState(false);
  const [openAddVehicleToClientModal, setOpenAddVehicleToClientModal] = useState(false);
  const [openValoracionModal, setOpenValoracionModal] = useState(false);
  const [openOTModal, setOpenOTModal] = useState(false);
  
  // Modal crear OT desde valoración
  const [openCreateOTModal, setOpenCreateOTModal] = useState(false);
  const [selectedValoracion, setSelectedValoracion] = useState<Valoracion | null>(null);
  const [mecanicoSeleccionado, setMecanicoSeleccionado] = useState('');
  const [prioridad, setPrioridad] = useState<'baja' | 'media' | 'alta' | 'urgente'>('media');
  const [observaciones, setObservaciones] = useState('');

  // Estados para añadir vehículo a cliente existente
  const [selectedClientForVehicle, setSelectedClientForVehicle] = useState<any>(null);
  const [newVehicleFormData, setNewVehicleFormData] = useState({
    placa: '',
    marca: '',
    modelo: '',
    año: new Date().getFullYear(),
    color: '',
  });

  // Formularios
  const [mechanicFormData, setMechanicFormData] = useState<CreateMechanicData>({
    cedula: '',
    nombre_completo: '',
    email: '',
    password: '',
    phone: '',
    specialty: '',
  });

  const [clientFormData, setClientFormData] = useState<CreateClientWithVehicleData>({
    cedula: '',
    nombre_completo: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  });

  const [addVehicle, setAddVehicle] = useState(false);

  const [valoracionFormData, setValoracionFormData] = useState({
    vehiculoId: '',
    mecanicoId: '',
  });

  const [otFormData, setOTFormData] = useState({
    vehiculoId: '',
    mecanicoId: '',
    valoracionId: '',
    prioridad: 'media' as 'baja' | 'media' | 'alta' | 'urgente',
    descripcion: '',
  });

  // Cargar datos al montar
  useEffect(() => {
    if (user?.workshopId) {
      loadAllData();
    }
  }, [user?.workshopId]);

  const loadAllData = async () => {
    await Promise.all([
      loadMechanics(),
      loadClients(),
      loadVehicles(),
      loadValoraciones(),
      loadOrdenesTrabajo(),
    ]);
  };

  const loadMechanics = async () => {
    if (!user?.workshopId) return;
    setLoadingData(true);
    try {
      const result = await mechanicService.getMechanicsByWorkshop(user.workshopId);
      if (result.success && result.data) {
        setMechanics(result.data);
      }
    } catch (err) {
      console.error('Error cargando mecánicos:', err);
    } finally {
      setLoadingData(false);
    }
  };

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

  const loadValoraciones = async () => {
    if (!user?.workshopId) return;
    setLoadingData(true);
    try {
      const result = await valoracionService.getValoracionesByWorkshop(user.workshopId);
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
    if (!user?.workshopId) return;
    setLoadingData(true);
    try {
      const result = await ordenTrabajoService.getOrdenesByWorkshop(user.workshopId);
      if (result.success && result.data) {
        setOrdenesTrabajo(result.data);
      }
    } catch (err) {
      console.error('Error cargando órdenes de trabajo:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // ========== FUNCIONALIDAD PARA AÑADIR VEHÍCULO A CLIENTE EXISTENTE ==========

  const handleOpenAddVehicleToClient = (client: any) => {
    setSelectedClientForVehicle(client);
    setNewVehicleFormData({
      placa: '',
      marca: '',
      modelo: '',
      año: new Date().getFullYear(),
      color: '',
    });
    setOpenAddVehicleToClientModal(true);
  };

  const handleCloseAddVehicleToClientModal = () => {
    setOpenAddVehicleToClientModal(false);
    setSelectedClientForVehicle(null);
    setNewVehicleFormData({
      placa: '',
      marca: '',
      modelo: '',
      año: new Date().getFullYear(),
      color: '',
    });
  };

  const handleNewVehicleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewVehicleFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'año' ? parseInt(value) || new Date().getFullYear() : value 
    }));
  };

  const handleAddVehicleToClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForVehicle || !user?.workshopId) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const vehicleData = {
        placa: newVehicleFormData.placa,
        marca: newVehicleFormData.marca,
        modelo: newVehicleFormData.modelo,
        año: newVehicleFormData.año,
        color: newVehicleFormData.color || undefined,
        clienteId: selectedClientForVehicle.id,
        workshopId: user.workshopId,
      };

      const result = await vehicleService.createVehicle(vehicleData);

      if (result.success) {
        setSuccess(`¡Vehículo ${newVehicleFormData.placa} agregado exitosamente al cliente ${selectedClientForVehicle.nombre_completo}!`);
        await loadVehicles();
        setTimeout(() => {
          handleCloseAddVehicleToClientModal();
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      console.error('Error agregando vehículo:', err);
      setError(err.message || 'Error al agregar el vehículo');
    } finally {
      setLoading(false);
    }
  };

  // ========== MECÁNICOS ==========

  const handleOpenMechanicModal = () => {
    setOpenMechanicModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseMechanicModal = () => {
    setOpenMechanicModal(false);
    setMechanicFormData({
      cedula: '',
      nombre_completo: '',
      email: '',
      password: '',
      phone: '',
      specialty: '',
    });
    setError(null);
    setSuccess(null);
  };

  const handleMechanicInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMechanicFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitMechanic = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!user?.workshopId) {
      setError('No se encontró el ID del taller');
      setLoading(false);
      return;
    }

    try {
      const result = await mechanicService.createMechanic(user.workshopId, mechanicFormData);

      if (result.success) {
        setSuccess('¡Mecánico agregado exitosamente!');
        await loadMechanics();
        setTimeout(() => {
          handleCloseMechanicModal();
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al agregar el mecánico. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMechanic = async (mechanicId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este mecánico?')) return;

    try {
      const result = await mechanicService.deleteMechanic(mechanicId);
      if (result.success) {
        await loadMechanics();
        setSuccess('Mecánico eliminado exitosamente');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al eliminar el mecánico');
    }
  };

  // ========== CLIENTES ==========

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

    if (name.startsWith('vehiculo.')) {
      const vehicleField = name.replace('vehiculo.', '');

      setClientFormData((prev) => {
        const currentVehiculo = prev.vehiculo || {
          placa: '',
          marca: '',
          modelo: '',
          año: new Date().getFullYear(),
          color: '',
        };

        return {
          ...prev,
          vehiculo: {
            ...currentVehiculo,
            [vehicleField]: vehicleField === 'año' ? parseInt(value) || 0 : value,
          },
        };
      });
    } else {
      setClientFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmitClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Crear el cliente primero
      const clienteData = {
        cedula: clientFormData.cedula,
        nombre_completo: clientFormData.nombre_completo,
        email: clientFormData.email,
        password: clientFormData.password,
        phone: clientFormData.phone || undefined,
        address: clientFormData.address || undefined,
      };

      const result = await clientService.createClient(clienteData);

      if (result.success && result.data) {
        const clienteId = result.data.id;
        
        // 2. Si se debe agregar vehículo
        if (addVehicle && clientFormData.vehiculo && user?.workshopId) {
          const vehiculoData = {
            placa: clientFormData.vehiculo.placa,
            marca: clientFormData.vehiculo.marca,
            modelo: clientFormData.vehiculo.modelo,
            año: clientFormData.vehiculo.año,
            color: clientFormData.vehiculo.color || undefined,
            clienteId: clienteId,
            workshopId: user.workshopId,
          };

          // Crear el vehículo
          const vehiculoResult = await vehicleService.createVehicle(vehiculoData);
          
          if (vehiculoResult.success) {
            setSuccess('¡Cliente y vehículo creados exitosamente!');
            await Promise.all([loadClients(), loadVehicles()]);
          } else {
            setError(`Cliente creado pero error en vehículo: ${vehiculoResult.message}`);
          }
        } else {
          setSuccess('¡Cliente creado exitosamente!');
          await loadClients();
        }

        setTimeout(() => {
          handleCloseClientModal();
        }, 2000);
      } else {
        setError(result.message || 'Error al crear el cliente');
      }
    } catch (err: any) {
      console.error('Error detallado:', err);
      setError(err.message || 'Error al crear el cliente. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ========== VALORACIONES ==========

  const handleOpenValoracionModal = () => {
    setOpenValoracionModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseValoracionModal = () => {
    setOpenValoracionModal(false);
    setValoracionFormData({
      vehiculoId: '',
      mecanicoId: '',
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmitValoracion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!user?.id || !user?.workshopId) {
      setError('No se encontró información del usuario');
      setLoading(false);
      return;
    }

    try {
      const result = await valoracionService.createValoracion({
        vehiculoId: valoracionFormData.vehiculoId,
        mecanicoId: valoracionFormData.mecanicoId,
        tallerOwnerId: user.id,
        workshopId: user.workshopId,
      });

      if (result.success) {
        setSuccess('¡Valoración asignada exitosamente!');
        await loadValoraciones();
        setTimeout(() => {
          handleCloseValoracionModal();
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al asignar valoración. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ========== GESTIÓN DE ORDENES DE TRABAJO DESDE VALORACIONES ==========

  const handleOpenCreateOT = (valoracion: Valoracion) => {
    setSelectedValoracion(valoracion);
    
    // Verificar si ya existe OT para esta valoración
    const ordenExistente = getOrdenByValoracionId(valoracion.id);
    
    if (ordenExistente) {
      // Si existe y está pendiente de asignación, pre-seleccionar el mecánico de la valoración
      if (ordenExistente.estado === 'pendiente_asignacion' && !ordenExistente.mecanicoAsignado) {
        setMecanicoSeleccionado(valoracion.mecanicoId);
      } else if (ordenExistente.mecanicoId) {
        setMecanicoSeleccionado(ordenExistente.mecanicoId);
      }
    } else {
      // Si no existe OT, pre-seleccionar el mecánico de la valoración
      setMecanicoSeleccionado(valoracion.mecanicoId);
    }
    
    setPrioridad('media');
    setObservaciones('');
    setOpenCreateOTModal(true);
  };

  const handleCloseCreateOTModal = () => {
    setOpenCreateOTModal(false);
    setSelectedValoracion(null);
    setMecanicoSeleccionado('');
    setPrioridad('media');
    setObservaciones('');
  };

  const getOrdenByValoracionId = (valoracionId: string): OrdenTrabajo | undefined => {
    return ordenesTrabajo.find(ot => ot.valoracionId === valoracionId);
  };

  const handleCreateOrdenTrabajo = async () => {
    if (!selectedValoracion || !mecanicoSeleccionado || !user?.id || !user?.workshopId) {
      setError('Faltan datos necesarios');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Verificar si ya existe una OT para esta valoración
      const ordenExistente = getOrdenByValoracionId(selectedValoracion.id);

      if (ordenExistente) {
        // Si existe OT pero está pendiente de asignación, asignar mecánico
        if (ordenExistente.estado === 'pendiente_asignacion' && !ordenExistente.mecanicoAsignado) {
          const result = await ordenTrabajoService.asignarMecanico(ordenExistente.id, {
            mecanicoId: mecanicoSeleccionado,
            prioridad,
            observaciones,
          });

          if (result.success) {
            setSuccess(`✅ Mecánico asignado a la orden ${ordenExistente.numeroOT}`);
            await loadOrdenesTrabajo();
            handleCloseCreateOTModal();
            
            setTimeout(() => {
              setSuccess(null);
              setCurrentTab(3);
            }, 2000);
          } else {
            setError(result.message || 'Error al asignar mecánico');
          }
        } else {
          setError('Esta orden ya tiene un mecánico asignado');
        }
      } else {
        // Si no existe OT, crear una automáticamente primero
        // 1. Crear OT automática (sin mecánico asignado)
        const resultAutomatica = await ordenTrabajoService.createOrdenAutomatica(selectedValoracion.id);

        if (resultAutomatica.success && resultAutomatica.data) {
          // 2. Asignar mecánico inmediatamente
          const resultAsignacion = await ordenTrabajoService.asignarMecanico(resultAutomatica.data.id, {
            mecanicoId: mecanicoSeleccionado,
            prioridad,
            observaciones,
          });

          if (resultAsignacion.success) {
            setSuccess(`✅ Orden de trabajo ${resultAutomatica.data.numeroOT} creada y asignada al mecánico`);
            await loadOrdenesTrabajo();
            handleCloseCreateOTModal();
            
            setTimeout(() => {
              setSuccess(null);
              setCurrentTab(3);
            }, 2000);
          } else {
            setError(`Orden creada pero error al asignar mecánico: ${resultAsignacion.message}`);
          }
        } else {
          setError(resultAutomatica.message || 'Error al crear orden automática');
        }
      }
    } catch (err: any) {
      console.error('Error al procesar orden:', err);
      setError(err.message || 'Error al procesar la orden de trabajo');
    } finally {
      setLoading(false);
    }
  };

  // ========== CREAR ORDEN DE TRABAJO MANUAL (sin valoración) ==========

  const handleOpenOTModal = () => {
    setOpenOTModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseOTModal = () => {
    setOpenOTModal(false);
    setOTFormData({
      vehiculoId: '',
      mecanicoId: '',
      valoracionId: '',
      prioridad: 'media',
      descripcion: '',
    });
    setError(null);
    setSuccess(null);
  };

  const handleOTInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOTFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitOT = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!user?.id || !user?.workshopId) {
      setError('No se encontró información del usuario');
      setLoading(false);
      return;
    }

    try {
      // Para crear OT manual, necesitamos primero crear una valoración falsa o usar otro método
      // Por ahora, mostrar mensaje de que esta función está en desarrollo
      setError('La creación manual de órdenes de trabajo está en desarrollo. Por favor, use el sistema de valoraciones.');
    } catch (err) {
      setError('Error al crear orden de trabajo. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.nombre_completo : 'Desconocido';
  };

  const getMechanicName = (mechanicId: string) => {
    const mechanic = mechanics.find((m) => m.id === mechanicId);
    return mechanic ? mechanic.nombre_completo : 'Desconocido';
  };

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle ? `${vehicle.marca} ${vehicle.modelo} - ${vehicle.placa}` : 'Desconocido';
  };

  const getClientVehicles = (clientId: string) => {
    return vehicles.filter(v => v.clienteId === clientId);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completada':
      case 'totalmente_aceptada':
        return 'success';
      case 'en_proceso':
      case 'en_progreso':
      case 'parcialmente_aceptada':
      case 'asignada':
        return 'warning';
      case 'pendiente_aprobacion_cliente':
      case 'pendiente_asignacion':
        return 'info';
      case 'pendiente':
        return 'default';
      case 'rechazada':
      case 'cancelada':
      case 'pausada':
        return 'error';
      default:
        return 'default';
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

  const contarTareasAceptadas = (valoracion: Valoracion) => {
    if (!valoracion.tareas || valoracion.tareas.length === 0) return 0;
    return valoracion.tareas.filter((t) => t.estado === 'aceptada').length;
  };

  const calcularCostoAceptado = (valoracion: Valoracion) => {
    if (!valoracion.tareas || valoracion.tareas.length === 0) return 0;
    return valoracion.tareas
      .filter((t) => t.estado === 'aceptada')
      .reduce((sum, t) => sum + t.precioEstimado, 0);
  };

  const puedeCrearOT = (valoracion: Valoracion) => {
    const tareasAceptadas = contarTareasAceptadas(valoracion);
    const estadoValido = valoracion.estadoCliente === 'totalmente_aceptada' || 
                        valoracion.estadoCliente === 'parcialmente_aceptada';
    const yaExisteOT = ordenesTrabajo.some(ot => ot.valoracionId === valoracion.id);
    
    return estadoValido && tareasAceptadas > 0 && !yaExisteOT;
  };

  const yaExisteOT = (valoracionId: string) => {
    return ordenesTrabajo.some(ot => ot.valoracionId === valoracionId);
  };

  const getOrdenesPendientesAsignacion = () => {
    return ordenesTrabajo.filter(ot => 
      ot.estado === 'pendiente_asignacion' && !ot.mecanicoAsignado
    ).length;
  };

  // Funciones para calcular estadísticas
  const getValoracionesPendientes = () => {
    return valoraciones.filter(v => v.estado === 'pendiente' || v.estado === 'pendiente_aprobacion_cliente').length;
  };

  const getOrdenesActivas = () => {
    return ordenesTrabajo.filter(ot => 
      ot.estado !== 'completada' && 
      ot.estado !== 'cancelada'
    ).length;
  };

  const getIngresosPendientes = () => {
    return ordenesTrabajo
      .filter(ot => ot.estado === 'completada' && ot.costoTotal)
      .reduce((sum, ot) => sum + (ot.costoTotal || 0), 0);
  };

  const getVehiculosSinValoracion = () => {
    const vehiculosConValoracion = new Set(valoraciones.map(v => v.vehiculoId));
    return vehicles.filter(v => !vehiculosConValoracion.has(v.id)).length;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ 
        p: 4, 
        mb: 4, 
        background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
        color: 'white',
        borderRadius: 2,
        boxShadow: 3
      }}>
        <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Build fontSize="large" />
          Panel del Jefe de Taller
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <AccountCircle />
          <Typography variant="h5">Bienvenido, {user?.nombre_completo}</Typography>
        </Box>
        <Typography variant="body1">
          <strong>Rol:</strong> Jefe de Taller
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
          Cédula: {user?.cedula} | Email: {user?.email}
        </Typography>
      </Paper>

      {/* Mensajes globales */}
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
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <People sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4">{mechanics.length}</Typography>
              <Typography variant="body2" color="text.secondary">Mecánicos</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <DirectionsCar sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4">{vehicles.length}</Typography>
              <Typography variant="body2" color="text.secondary">Vehículos</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Assessment sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4">{getValoracionesPendientes()}</Typography>
              <Typography variant="body2" color="text.secondary">Valoraciones Pendientes</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Assignment sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4">{getOrdenesPendientesAsignacion()}</Typography>
              <Typography variant="body2" color="text.secondary">OTs por Asignar</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AttachMoney sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h4">₡{getIngresosPendientes().toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">Ingresos Pendientes</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs principales */}
      <Paper sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Tabs 
          value={currentTab} 
          onChange={(e, newValue) => setCurrentTab(newValue)}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontWeight: 'bold'
            }
          }}
        >
          <Tab label={`Clientes y Vehículos`} />
          <Tab label={
            <Badge badgeContent={mechanics.length} color="primary">
              Mecánicos
            </Badge>
          } />
          <Tab label={
            <Badge badgeContent={valoraciones.length} color="secondary">
              Valoraciones
            </Badge>
          } />
          <Tab label={
            <Badge badgeContent={ordenesTrabajo.length} color="info">
              Órdenes de Trabajo
            </Badge>
          } />
        </Tabs>

        {/* TAB 0: CLIENTES Y VEHÍCULOS */}
        {currentTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={handleOpenClientModal}
                sx={{ borderRadius: 2 }}
              >
                Agregar Cliente
              </Button>
            </Box>

            <Typography variant="h5" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <People /> Clientes ({clients.length})
            </Typography>
            
            {loadingData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : clients.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                No hay clientes registrados.
              </Alert>
            ) : (
              <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                  <TableHead sx={{ backgroundColor: 'primary.light' }}>
                    <TableRow>
                      <TableCell><strong>Nombre</strong></TableCell>
                      <TableCell><strong>Cédula</strong></TableCell>
                      <TableCell><strong>Email</strong></TableCell>
                      <TableCell><strong>Teléfono</strong></TableCell>
                      <TableCell><strong>Vehículos</strong></TableCell>
                      <TableCell align="center"><strong>Acciones</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clients.map((client) => {
                      const vehiculosCliente = getClientVehicles(client.id);
                      return (
                        <TableRow key={client.id} hover>
                          <TableCell>{client.nombre_completo}</TableCell>
                          <TableCell>{client.cedula}</TableCell>
                          <TableCell>{client.email}</TableCell>
                          <TableCell>{client.phone || '-'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={vehiculosCliente.length} 
                              size="small" 
                              color={vehiculosCliente.length > 0 ? "success" : "default"}
                              icon={<DirectionsCar />}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Agregar vehículo">
                              <IconButton
                                color="primary"
                                onClick={() => handleOpenAddVehicleToClient(client)}
                                size="small"
                              >
                                <AddCircle />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Typography variant="h5" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <DirectionsCar /> Vehículos ({vehicles.length})
            </Typography>
            
            {vehicles.length === 0 ? (
              <Alert severity="info">
                No hay vehículos registrados.
              </Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead sx={{ backgroundColor: 'primary.light' }}>
                    <TableRow>
                      <TableCell><strong>Placa</strong></TableCell>
                      <TableCell><strong>Marca</strong></TableCell>
                      <TableCell><strong>Modelo</strong></TableCell>
                      <TableCell><strong>Año</strong></TableCell>
                      <TableCell><strong>Cliente</strong></TableCell>
                      <TableCell><strong>Estado</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vehicles.map((vehicle) => {
                      const tieneValoracion = valoraciones.some(v => v.vehiculoId === vehicle.id);
                      const ordenesActivas = ordenesTrabajo.filter(ot => 
                        ot.vehiculoId === vehicle.id && 
                        ot.estado !== 'completada' && 
                        ot.estado !== 'cancelada'
                      ).length;
                      
                      return (
                        <TableRow key={vehicle.id} hover>
                          <TableCell>
                            <Chip label={vehicle.placa} size="small" color="primary" />
                          </TableCell>
                          <TableCell>{vehicle.marca}</TableCell>
                          <TableCell>{vehicle.modelo}</TableCell>
                          <TableCell>{vehicle.año}</TableCell>
                          <TableCell>{getClientName(vehicle.clienteId)}</TableCell>
                          <TableCell>
                            {ordenesActivas > 0 ? (
                              <Chip 
                                label={`${ordenesActivas} OT activa(s)`} 
                                size="small" 
                                color="warning"
                                variant="outlined"
                              />
                            ) : tieneValoracion ? (
                              <Chip 
                                label="Con Valoración" 
                                size="small" 
                                color="success"
                                variant="outlined"
                              />
                            ) : (
                              <Chip 
                                label="Sin Valoración" 
                                size="small" 
                                color="default"
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* TAB 1: MECÁNICOS */}
        {currentTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={handleOpenMechanicModal}
                sx={{ borderRadius: 2 }}
              >
                Agregar Mecánico
              </Button>
            </Box>

            {loadingData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : mechanics.length === 0 ? (
              <Alert severity="info">
                No hay mecánicos registrados.
              </Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead sx={{ backgroundColor: 'primary.light' }}>
                    <TableRow>
                      <TableCell><strong>Nombre</strong></TableCell>
                      <TableCell><strong>Cédula</strong></TableCell>
                      <TableCell><strong>Email</strong></TableCell>
                      <TableCell><strong>Teléfono</strong></TableCell>
                      <TableCell><strong>Especialidad</strong></TableCell>
                      <TableCell><strong>OTs Activas</strong></TableCell>
                      <TableCell align="center"><strong>Acciones</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mechanics.map((mechanic) => {
                      const ordenesActivas = ordenesTrabajo.filter(
                        ot => ot.mecanicoId === mechanic.id && 
                        ot.estado !== 'completada' && 
                        ot.estado !== 'cancelada'
                      ).length;
                      
                      return (
                        <TableRow key={mechanic.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CarRepair color="action" />
                              {mechanic.nombre_completo}
                            </Box>
                          </TableCell>
                          <TableCell>{mechanic.cedula}</TableCell>
                          <TableCell>{mechanic.email}</TableCell>
                          <TableCell>{mechanic.phone || '-'}</TableCell>
                          <TableCell>
                            {mechanic.specialty ? (
                              <Chip label={mechanic.specialty} size="small" color="secondary" />
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge badgeContent={ordenesActivas} color="error">
                              <Assignment color="action" />
                            </Badge>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Eliminar">
                              <IconButton
                                color="error"
                                onClick={() => handleDeleteMechanic(mechanic.id)}
                                size="small"
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* TAB 2: VALORACIONES */}
        {currentTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={handleOpenValoracionModal}
                sx={{ borderRadius: 2 }}
              >
                Asignar Valoración
              </Button>
            </Box>

            {loadingData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : valoraciones.length === 0 ? (
              <Alert severity="info">
                No hay valoraciones asignadas.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {valoraciones.map((valoracion) => {
                  const ordenExistente = getOrdenByValoracionId(valoracion.id);
                  const tareasAceptadas = contarTareasAceptadas(valoracion);
                  const puedeCrearOrden = puedeCrearOT(valoracion);
                  
                  return (
                    <Grid item xs={12} md={6} key={valoracion.id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DirectionsCar />
                              {getVehicleInfo(valoracion.vehiculoId)}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Chip 
                                label={valoracion.estado} 
                                color={getEstadoColor(valoracion.estado)} 
                                size="small" 
                              />
                              {valoracion.estadoCliente && (
                                <Chip
                                  label={valoracion.estadoCliente.replace(/_/g, ' ')}
                                  color={getEstadoColor(valoracion.estadoCliente)}
                                  size="small"
                                />
                              )}
                            </Box>
                          </Box>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Mecánico:</strong> {getMechanicName(valoracion.mecanicoId)}
                          </Typography>

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Tareas totales:</strong> {valoracion.tareas?.length || 0}
                            </Typography>
                            <Typography variant="body2" color="success.main">
                              <strong>Tareas aceptadas:</strong> {tareasAceptadas}
                            </Typography>
                          </Box>

                          {tareasAceptadas > 0 && (
                            <Typography variant="h6" color="primary.main" sx={{ mt: 2, mb: 2 }}>
                              <AttachMoney sx={{ verticalAlign: 'middle', mr: 1 }} />
                              Costo aprobado: ₡{calcularCostoAceptado(valoracion).toLocaleString()}
                            </Typography>
                          )}

                          <Divider sx={{ my: 2 }} />

                          {ordenExistente ? (
                            <Alert 
                              severity={ordenExistente.estado === 'pendiente_asignacion' ? "warning" : "info"} 
                              sx={{ mb: 2 }}
                              action={
                                ordenExistente.estado === 'pendiente_asignacion' && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="primary"
                                    onClick={() => handleOpenCreateOT(valoracion)}
                                    startIcon={<Assignment />}
                                  >
                                    Asignar Mecánico
                                  </Button>
                                )
                              }
                            >
                              {ordenExistente.estado === 'pendiente_asignacion' ? (
                                <>🔄 Orden {ordenExistente.numeroOT} pendiente de asignación</>
                              ) : (
                                <>✅ Orden {ordenExistente.numeroOT} ya asignada</>
                              )}
                            </Alert>
                          ) : puedeCrearOrden ? (
                            <Alert 
                              severity="success" 
                              sx={{ mb: 2 }}
                              action={
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => handleOpenCreateOT(valoracion)}
                                  startIcon={<Assignment />}
                                >
                                  Crear OT
                                </Button>
                              }
                            >
                              ✅ Cliente completó su revisión. Puedes crear la orden de trabajo.
                            </Alert>
                          ) : (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                              ⏳ Esperando respuesta del cliente
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        )}

        {/* TAB 3: ÓRDENES DE TRABAJO */}
        {currentTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={handleOpenOTModal}
                sx={{ borderRadius: 2 }}
              >
                Crear Orden de Trabajo
              </Button>
            </Box>

            {loadingData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : ordenesTrabajo.length === 0 ? (
              <Alert severity="info">
                No hay órdenes de trabajo creadas.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {ordenesTrabajo.map((ot) => (
                  <Grid item xs={12} md={6} lg={4} key={ot.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6">
                            <strong>{ot.numeroOT}</strong>
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                            <Chip 
                              label={ot.estado} 
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
                          <strong>Vehículo:</strong> {getVehicleInfo(ot.vehiculoId)}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Mecánico:</strong> {ot.mecanicoId ? getMechanicName(ot.mecanicoId) : 'Sin asignar'}
                          {!ot.mecanicoAsignado && (
                            <Chip label="Pendiente" size="small" color="warning" sx={{ ml: 1 }} />
                          )}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Fecha creación:</strong> {new Date(ot.fechaCreacion).toLocaleDateString()}
                        </Typography>

                        {ot.fechaAsignacion && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Fecha asignación:</strong> {new Date(ot.fechaAsignacion).toLocaleDateString()}
                          </Typography>
                        )}

                        <Divider sx={{ my: 2 }} />

                        {ot.tareasAprobadas && ot.tareasAprobadas.length > 0 && (
                          <>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              <Task sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1 }} />
                              Tareas aprobadas: {ot.tareasAprobadas.length}
                            </Typography>
                            <List dense>
                              {ot.tareasAprobadas.map((tarea: TareaOrdenTrabajo, index) => (
                                <ListItem key={tarea.id} sx={{ py: 0.5 }}>
                                  <Typography variant="body2">
                                    {index + 1}. {tarea.nombre}
                                    {tarea.completada && (
                                      <Chip
                                        label="✓"
                                        color="success"
                                        size="small"
                                        sx={{ ml: 1 }}
                                      />
                                    )}
                                  </Typography>
                                </ListItem>
                              ))}
                            </List>
                          </>
                        )}

                        {ot.descripcion && (
                          <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                            "{ot.descripcion}"
                          </Typography>
                        )}

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6" color="primary.main">
                            ₡{ot.costoTotal?.toLocaleString() || 0}
                          </Typography>
                          {ot.estado === 'completada' && (
                            <Chip
                              label="Pagado"
                              color="success"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Paper>

      {/* MODAL: AGREGAR VEHÍCULO A CLIENTE EXISTENTE */}
      <Dialog 
        open={openAddVehicleToClientModal} 
        onClose={handleCloseAddVehicleToClientModal} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ backgroundColor: 'success.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddCircle />
            Agregar Vehículo a Cliente
          </Box>
        </DialogTitle>
        <form onSubmit={handleAddVehicleToClient}>
          <DialogContent sx={{ pt: 3 }}>
            {selectedClientForVehicle && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Cliente:</strong> {selectedClientForVehicle.nombre_completo}
                </Typography>
                <Typography variant="body2">
                  <strong>Cédula:</strong> {selectedClientForVehicle.cedula}
                </Typography>
                <Typography variant="body2">
                  <strong>Vehículos actuales:</strong> {getClientVehicles(selectedClientForVehicle.id).length}
                </Typography>
              </Alert>
            )}

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <TextField 
              fullWidth 
              label="Placa" 
              name="placa" 
              value={newVehicleFormData.placa}
              onChange={handleNewVehicleInputChange} 
              required 
              sx={{ mb: 2 }} 
              InputProps={{ startAdornment: <InputAdornment position="start">🚗</InputAdornment> }}
            />
            <TextField 
              fullWidth 
              label="Marca" 
              name="marca" 
              value={newVehicleFormData.marca}
              onChange={handleNewVehicleInputChange} 
              required 
              sx={{ mb: 2 }}
            />
            <TextField 
              fullWidth 
              label="Modelo" 
              name="modelo" 
              value={newVehicleFormData.modelo}
              onChange={handleNewVehicleInputChange} 
              required 
              sx={{ mb: 2 }}
            />
            <TextField 
              fullWidth 
              label="Año" 
              name="año" 
              type="number"
              value={newVehicleFormData.año}
              onChange={handleNewVehicleInputChange} 
              required 
              sx={{ mb: 2 }}
              InputProps={{ inputProps: { min: 1900, max: new Date().getFullYear() + 1 } }}
            />
            <TextField 
              fullWidth 
              label="Color (opcional)" 
              name="color" 
              value={newVehicleFormData.color}
              onChange={handleNewVehicleInputChange} 
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={handleCloseAddVehicleToClientModal} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <AddCircle />}>
              {loading ? 'Agregando...' : 'Agregar Vehículo'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* MODAL: AGREGAR MECÁNICO */}
      <Dialog 
        open={openMechanicModal} 
        onClose={handleCloseMechanicModal} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
          Agregar Nuevo Mecánico
        </DialogTitle>
        <form onSubmit={handleSubmitMechanic}>
          <DialogContent sx={{ pt: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <TextField 
              fullWidth 
              label="Cédula" 
              name="cedula" 
              value={mechanicFormData.cedula}
              onChange={handleMechanicInputChange} 
              required 
              sx={{ mb: 2 }} 
              InputProps={{ startAdornment: <InputAdornment position="start">🔢</InputAdornment> }}
            />
            <TextField 
              fullWidth 
              label="Nombre Completo" 
              name="nombre_completo"
              value={mechanicFormData.nombre_completo} 
              onChange={handleMechanicInputChange} 
              required 
              sx={{ mb: 2 }}
              InputProps={{ startAdornment: <InputAdornment position="start">👤</InputAdornment> }}
            />
            <TextField 
              fullWidth 
              label="Correo Electrónico" 
              name="email" 
              type="email"
              value={mechanicFormData.email} 
              onChange={handleMechanicInputChange} 
              required 
              sx={{ mb: 2 }}
              InputProps={{ startAdornment: <InputAdornment position="start">📧</InputAdornment> }}
            />
            <TextField 
              fullWidth 
              label="Contraseña" 
              name="password" 
              type="password"
              value={mechanicFormData.password} 
              onChange={handleMechanicInputChange} 
              required 
              sx={{ mb: 2 }}
              InputProps={{ startAdornment: <InputAdornment position="start">🔐</InputAdornment> }}
            />
            <TextField 
              fullWidth 
              label="Teléfono (opcional)" 
              name="phone" 
              value={mechanicFormData.phone}
              onChange={handleMechanicInputChange} 
              sx={{ mb: 2 }}
              InputProps={{ startAdornment: <InputAdornment position="start">📱</InputAdornment> }}
            />
            <TextField 
              fullWidth 
              label="Especialidad (opcional)" 
              name="specialty" 
              value={mechanicFormData.specialty}
              onChange={handleMechanicInputChange} 
              placeholder="Ej: Motor, Frenos, Transmisión"
              InputProps={{ startAdornment: <InputAdornment position="start">🔧</InputAdornment> }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={handleCloseMechanicModal} disabled={loading}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}>
              {loading ? 'Agregando...' : 'Agregar Mecánico'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* MODAL: AGREGAR CLIENTE */}
      <Dialog 
        open={openClientModal} 
        onClose={handleCloseClientModal} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
          Agregar Nuevo Cliente
        </DialogTitle>
        <form onSubmit={handleSubmitClient}>
          <DialogContent sx={{ pt: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
              Información del Cliente
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField 
                  fullWidth 
                  label="Cédula" 
                  name="cedula" 
                  value={clientFormData.cedula}
                  onChange={handleClientInputChange} 
                  required 
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField 
                  fullWidth 
                  label="Nombre Completo" 
                  name="nombre_completo"
                  value={clientFormData.nombre_completo} 
                  onChange={handleClientInputChange} 
                  required 
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField 
                  fullWidth 
                  label="Correo Electrónico" 
                  name="email" 
                  type="email"
                  value={clientFormData.email} 
                  onChange={handleClientInputChange} 
                  required 
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField 
                  fullWidth 
                  label="Contraseña" 
                  name="password" 
                  type="password"
                  value={clientFormData.password} 
                  onChange={handleClientInputChange} 
                  required 
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField 
                  fullWidth 
                  label="Teléfono (opcional)" 
                  name="phone" 
                  value={clientFormData.phone}
                  onChange={handleClientInputChange} 
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField 
                  fullWidth 
                  label="Dirección (opcional)" 
                  name="address" 
                  value={clientFormData.address}
                  onChange={handleClientInputChange} 
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <input 
                type="checkbox" 
                id="addVehicleCheckbox" 
                checked={addVehicle}
                onChange={(e) => setAddVehicle(e.target.checked)} 
                style={{ marginRight: '8px', transform: 'scale(1.2)' }} 
              />
              <label htmlFor="addVehicleCheckbox">
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  ¿Agregar vehículo del cliente ahora?
                </Typography>
              </label>
            </Box>

            {addVehicle && (
              <>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                  Información del Vehículo
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Placa" 
                      name="vehiculo.placa"
                      value={clientFormData.vehiculo?.placa || ''} 
                      onChange={handleClientInputChange} 
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Marca" 
                      name="vehiculo.marca"
                      value={clientFormData.vehiculo?.marca || ''} 
                      onChange={handleClientInputChange} 
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Modelo" 
                      name="vehiculo.modelo"
                      value={clientFormData.vehiculo?.modelo || ''} 
                      onChange={handleClientInputChange} 
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Año" 
                      name="vehiculo.año" 
                      type="number"
                      value={clientFormData.vehiculo?.año || new Date().getFullYear()}
                      onChange={handleClientInputChange} 
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      label="Color (opcional)" 
                      name="vehiculo.color"
                      value={clientFormData.vehiculo?.color || ''} 
                      onChange={handleClientInputChange} 
                    />
                  </Grid>
                </Grid>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={handleCloseClientModal} disabled={loading}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}>
              {loading ? 'Creando...' : 'Crear Cliente'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* MODAL: ASIGNAR VALORACIÓN */}
      <Dialog 
        open={openValoracionModal} 
        onClose={handleCloseValoracionModal} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ backgroundColor: 'secondary.main', color: 'white' }}>
          Asignar Valoración a Mecánico
        </DialogTitle>
        <form onSubmit={handleSubmitValoracion}>
          <DialogContent sx={{ pt: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Autocomplete
              options={vehicles}
              getOptionLabel={(option) => `${option.marca} ${option.modelo} - ${option.placa}`}
              value={vehicles.find((v) => v.id === valoracionFormData.vehiculoId) || null}
              onChange={(event, newValue) => {
                setValoracionFormData((prev) => ({ ...prev, vehiculoId: newValue ? newValue.id : '' }));
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Vehículo" 
                  required 
                  placeholder="Selecciona un vehículo"
                  InputProps={{ 
                    ...params.InputProps,
                    startAdornment: <InputAdornment position="start">🚗</InputAdornment>
                  }}
                />
              )}
              sx={{ mb: 2 }}
            />

            <Autocomplete
              options={mechanics}
              getOptionLabel={(option) => `${option.nombre_completo} - ${option.specialty || 'Sin especialidad'}`}
              value={mechanics.find((m) => m.id === valoracionFormData.mecanicoId) || null}
              onChange={(event, newValue) => {
                setValoracionFormData((prev) => ({ ...prev, mecanicoId: newValue ? newValue.id : '' }));
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Mecánico" 
                  required 
                  placeholder="Selecciona un mecánico"
                  InputProps={{ 
                    ...params.InputProps,
                    startAdornment: <InputAdornment position="start">🔧</InputAdornment>
                  }}
                />
              )}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={handleCloseValoracionModal} disabled={loading}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}>
              {loading ? 'Asignando...' : 'Asignar Valoración'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* MODAL: CREAR ORDEN DE TRABAJO */}
      <Dialog 
        open={openOTModal} 
        onClose={handleCloseOTModal} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ backgroundColor: 'info.main', color: 'white' }}>
          Crear Orden de Trabajo
        </DialogTitle>
        <form onSubmit={handleSubmitOT}>
          <DialogContent sx={{ pt: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Alert severity="info" sx={{ mb: 2 }}>
              Para crear una orden de trabajo, primero debe asignar una valoración a un vehículo y 
              esperar a que el cliente revise y acepte las tareas propuestas.
            </Alert>

            <Autocomplete
              options={vehicles}
              getOptionLabel={(option) => `${option.marca} ${option.modelo} - ${option.placa}`}
              value={vehicles.find((v) => v.id === otFormData.vehiculoId) || null}
              onChange={(event, newValue) => {
                setOTFormData((prev) => ({ ...prev, vehiculoId: newValue ? newValue.id : '' }));
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Vehículo" 
                  required 
                  placeholder="Selecciona un vehículo"
                  InputProps={{ 
                    ...params.InputProps,
                    startAdornment: <InputAdornment position="start">🚗</InputAdornment>
                  }}
                />
              )}
              sx={{ mb: 2 }}
            />

            <Autocomplete
              options={mechanics}
              getOptionLabel={(option) => option.nombre_completo}
              value={mechanics.find((m) => m.id === otFormData.mecanicoId) || null}
              onChange={(event, newValue) => {
                setOTFormData((prev) => ({ ...prev, mecanicoId: newValue ? newValue.id : '' }));
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Mecánico" 
                  required 
                  placeholder="Selecciona un mecánico"
                  InputProps={{ 
                    ...params.InputProps,
                    startAdornment: <InputAdornment position="start">👷</InputAdornment>
                  }}
                />
              )}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              select
              label="Prioridad"
              name="prioridad"
              value={otFormData.prioridad}
              onChange={handleOTInputChange}
              required
              sx={{ mb: 2 }}
              InputProps={{ startAdornment: <InputAdornment position="start">⚠️</InputAdornment> }}
            >
              <MenuItem value="baja">Baja</MenuItem>
              <MenuItem value="media">Media</MenuItem>
              <MenuItem value="alta">Alta</MenuItem>
              <MenuItem value="urgente">Urgente</MenuItem>
            </TextField>

            <TextField
              fullWidth
              label="Descripción del trabajo"
              name="descripcion"
              value={otFormData.descripcion}
              onChange={handleOTInputChange}
              required
              multiline
              rows={4}
              placeholder="Describe el trabajo a realizar..."
              InputProps={{ startAdornment: <InputAdornment position="start">📝</InputAdornment> }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={handleCloseOTModal} disabled={loading}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}>
              {loading ? 'Creando...' : 'Crear Orden'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* MODAL: CREAR/ASIGNAR ORDEN DE TRABAJO DESDE VALORACIÓN */}
      <Dialog
        open={openCreateOTModal}
        onClose={handleCloseCreateOTModal}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ backgroundColor: 'success.main', color: 'white' }}>
          {selectedValoracion && getOrdenByValoracionId(selectedValoracion.id) 
            ? 'Asignar Mecánico a Orden de Trabajo' 
            : 'Crear Orden de Trabajo desde Valoración'}
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {selectedValoracion && (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  🚗 {getVehicleInfo(selectedValoracion.vehiculoId)}
                </Typography>
                <Typography variant="body2">
                  <strong>Tareas aceptadas por el cliente:</strong> {contarTareasAceptadas(selectedValoracion)}
                </Typography>
                <Typography variant="body2">
                  <strong>Costo total aprobado:</strong> ₡{calcularCostoAceptado(selectedValoracion).toLocaleString()}
                </Typography>
                {getOrdenByValoracionId(selectedValoracion.id) && (
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                    Orden existente: {getOrdenByValoracionId(selectedValoracion.id)?.numeroOT}
                  </Typography>
                )}
              </Alert>

              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                Tareas que se incluirán en la orden:
              </Typography>

              <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <List>
                  {selectedValoracion.tareas
                    ?.filter((t) => t.estado === 'aceptada')
                    .map((tarea, index) => (
                      <Box key={tarea.id}>
                        <ListItem sx={{ alignItems: 'flex-start' }}>
                          <Box sx={{ width: '100%' }}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {index + 1}. {tarea.nombre}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {tarea.descripcion}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                              <Typography variant="body2" color="primary.main">
                                ₡{tarea.precioEstimado.toLocaleString()}
                              </Typography>
                            </Box>
                          </Box>
                        </ListItem>
                        {index < (selectedValoracion.tareas?.filter((t) => t.estado === 'aceptada').length || 0) - 1 && (
                          <Divider sx={{ my: 1 }} />
                        )}
                      </Box>
                    ))}
                </List>
              </Paper>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Mecánico Asignado *</InputLabel>
                <Select
                  value={mecanicoSeleccionado}
                  onChange={(e) => setMecanicoSeleccionado(e.target.value)}
                  label="Mecánico Asignado *"
                >
                  {mechanics.map(mechanic => (
                    <MenuItem key={mechanic.id} value={mechanic.id}>
                      {mechanic.nombre_completo} {mechanic.specialty ? `(${mechanic.specialty})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Prioridad *</InputLabel>
                <Select
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value as any)}
                  label="Prioridad *"
                >
                  <MenuItem value="baja">Baja</MenuItem>
                  <MenuItem value="media">Media</MenuItem>
                  <MenuItem value="alta">Alta</MenuItem>
                  <MenuItem value="urgente">Urgente</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observaciones adicionales"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas adicionales para el mecánico..."
              />
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseCreateOTModal}>Cancelar</Button>
          <Button
            onClick={handleCreateOrdenTrabajo}
            variant="contained"
            color="success"
            disabled={loading || !mecanicoSeleccionado}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {loading 
              ? 'Procesando...' 
              : selectedValoracion && getOrdenByValoracionId(selectedValoracion.id)
                ? 'Asignar Mecánico'
                : 'Crear y Asignar OT'
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TallerPage;