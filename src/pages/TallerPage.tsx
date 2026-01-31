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
} from '@mui/material';
import { useAuthContext } from '../contexts/AuthContext';
import { People, CarRepair, Inventory, Receipt, Delete } from '@mui/icons-material';
import { mechanicService } from '../api/services/mechanic.service';

interface CreateMechanicData {
  cedula: string;
  nombre_completo: string;
  email: string;
  password: string;
  phone?: string;
  specialty?: string;
}

const TallerPage = () => {
  const { user } = useAuthContext();

  // Estados para el modal de agregar mecánico
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estado para la lista de mecánicos
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [loadingMechanics, setLoadingMechanics] = useState(false);

  // Estados para el formulario
  const [formData, setFormData] = useState<CreateMechanicData>({
    cedula: '',
    nombre_completo: '',
    email: '',
    password: '',
    phone: '',
    specialty: '',
  });

  // Cargar mecánicos al montar el componente
  useEffect(() => {
    if (user?.workshopId) {
      loadMechanics();
    }
  }, [user?.workshopId]);

  // Función para cargar mecánicos
  const loadMechanics = async () => {
    if (!user?.workshopId) return;

    setLoadingMechanics(true);
    try {
      const result = await mechanicService.getMechanicsByWorkshop(user.workshopId);
      if (result.success && result.data) {
        setMechanics(result.data);
      }
    } catch (err) {
      console.error('Error cargando mecánicos:', err);
    } finally {
      setLoadingMechanics(false);
    }
  };

  // Abrir modal
  const handleOpenModal = () => {
    setOpenModal(true);
    setError(null);
    setSuccess(null);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setOpenModal(false);
    setFormData({
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

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
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
      const result = await mechanicService.createMechanic(user.workshopId, formData);

      if (result.success) {
        setSuccess('¡Mecánico agregado exitosamente!');
        await loadMechanics(); // Recargar lista
        setTimeout(() => {
          handleCloseModal();
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

  // Eliminar mecánico
  const handleDeleteMechanic = async (mechanicId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este mecánico?')) {
      return;
    }

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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 4, mb: 4, backgroundColor: 'secondary.main', color: 'white' }}>
        <Typography variant="h3" gutterBottom>
          🔧 Panel del Dueño de Taller
        </Typography>
        <Typography variant="h5">Bienvenido, {user?.nombre_completo}</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Rol: <strong>Dueño de Taller</strong>
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Cédula: {user?.cedula} | Email: {user?.email}
        </Typography>
      </Paper>

      {/* Mensajes globales */}
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
        Mi Taller - Funcionalidades:
      </Typography>

      {/* Grid de Tarjetas */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3 }}>
        {/* Tarjeta: Gestionar Reparaciones */}
        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          <CarRepair sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Gestionar Reparaciones
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ver, crear y administrar reparaciones en tu taller
          </Typography>
          <Button variant="outlined" sx={{ mt: 2 }}>
            Ver Reparaciones
          </Button>
        </Paper>

        {/* Tarjeta: Mis Mecánicos */}
        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          <People sx={{ fontSize: 50, color: 'secondary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Mis Mecánicos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administrar tu equipo de mecánicos y sus asignaciones
          </Typography>
          <Button variant="contained" sx={{ mt: 2 }} onClick={handleOpenModal}>
            Agregar Mecánico
          </Button>
        </Paper>

        
      </Box>

      {/* Lista de Mecánicos */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          👷 Mis Mecánicos ({mechanics.length})
        </Typography>

        {loadingMechanics ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : mechanics.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 3 }}>
            No hay mecánicos registrados. Haz clic en "Agregar Mecánico" para comenzar.
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Nombre</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Cédula</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Email</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Teléfono</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Especialidad</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Acciones</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mechanics.map((mechanic) => (
                  <TableRow key={mechanic.id}>
                    <TableCell>{mechanic.nombre_completo}</TableCell>
                    <TableCell>{mechanic.cedula}</TableCell>
                    <TableCell>{mechanic.email}</TableCell>
                    <TableCell>{mechanic.phone || '-'}</TableCell>
                    <TableCell>{mechanic.specialty || '-'}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteMechanic(mechanic.id)}
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
      </Paper>

      {/* Estadísticas */}
      <Paper sx={{ p: 3, mt: 4, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom>
          📈 Estadísticas de Mi Taller:
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Mecánicos Activos
            </Typography>
            <Typography variant="h4">{mechanics.length}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Reparaciones Activas
            </Typography>
            <Typography variant="h4">5</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Completadas Hoy
            </Typography>
            <Typography variant="h4">3</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Ingresos del Mes
            </Typography>
            <Typography variant="h4">$4.5M</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Modal para agregar mecánico */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Nuevo Mecánico</DialogTitle>
        <form onSubmit={handleSubmit}>
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
              label="Cédula"
              name="cedula"
              value={formData.cedula}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Nombre Completo"
              name="nombre_completo"
              value={formData.nombre_completo}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Correo Electrónico"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Contraseña"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Teléfono (opcional)"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Especialidad (opcional)"
              name="specialty"
              value={formData.specialty}
              onChange={handleInputChange}
              placeholder="Ej: Motor, Frenos, Transmisión"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? 'Agregando...' : 'Agregar Mecánico'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default TallerPage;