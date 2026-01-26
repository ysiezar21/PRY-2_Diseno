import { useState } from 'react';
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
  CircularProgress
} from '@mui/material';
import { useAuthContext } from '../contexts/AuthContext';
import { Build, People, CarRepair, Settings } from '@mui/icons-material';
import type { CreateWorkshopData } from '../api/services/workshop.service';
import { workshopService } from '../api/services/workshop.service';

const AdminPage = () => {
  const { user } = useAuthContext();
  
  // Estados para el modal
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados para el formulario
  const [formData, setFormData] = useState<CreateWorkshopData>({
    nombre: '',
    cedulaDueno: '',
    nombreDueno: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });

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
      nombre: '',
      cedulaDueno: '',
      nombreDueno: '',
      email: '',
      password: '',
      phone: '',
      address: ''
    });
    setError(null);
    setSuccess(null);
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await workshopService.createWorkshop(formData);
      
      if (result.success) {
        setSuccess('¡Taller creado exitosamente!');
        setTimeout(() => {
          handleCloseModal();
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al crear el taller. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 4, mb: 4, backgroundColor: 'primary.main', color: 'white' }}>
        <Typography variant="h3" gutterBottom>
          👑 Panel del Dueño de la Página
        </Typography>
        <Typography variant="h5">
          Bienvenido, {user?.nombre_completo}
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Rol: <strong>Dueño de la Página (Administrador Principal)</strong>
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Cédula: {user?.cedula} | Email: {user?.email}
        </Typography>
      </Paper>

      <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
        Funcionalidades Disponibles:
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3 }}>
        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          <Build sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Gestionar Talleres
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Crear, editar y eliminar talleres registrados en la plataforma
          </Typography>
          <Button variant="contained" sx={{ mt: 2 }} onClick={handleOpenModal}>
            Crear Nuevo Taller
          </Button>
        </Paper>

        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          <People sx={{ fontSize: 50, color: 'secondary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Gestionar Usuarios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Controlar accesos y permisos de todos los usuarios del sistema
          </Typography>
          <Button variant="outlined" sx={{ mt: 2 }}>
            Ver Usuarios
          </Button>
        </Paper>

        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          <CarRepair sx={{ fontSize: 50, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Ver Reportes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Reportes globales de actividad y finanzas de todos los talleres
          </Typography>
          <Button variant="outlined" sx={{ mt: 2 }}>
            Generar Reportes
          </Button>
        </Paper>

        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          <Settings sx={{ fontSize: 50, color: 'warning.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Configuración
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configurar parámetros globales del sistema y políticas
          </Typography>
          <Button variant="outlined" sx={{ mt: 2 }}>
            Configurar Sistema
          </Button>
        </Paper>
      </Box>

      <Paper sx={{ p: 3, mt: 4, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom>
          📊 Resumen del Sistema:
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">Talleres Activos</Typography>
            <Typography variant="h4">12</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Usuarios Totales</Typography>
            <Typography variant="h4">45</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Reparaciones este mes</Typography>
            <Typography variant="h4">156</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Ingresos Totales</Typography>
            <Typography variant="h4">$12.5M</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Modal para crear taller */}
      <Dialog 
        open={openModal} 
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Crear Nuevo Taller</DialogTitle>
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
              label="Nombre del Taller"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Cédula del Dueño"
              name="cedulaDueno"
              value={formData.cedulaDueno}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Nombre del Dueño"
              name="nombreDueno"
              value={formData.nombreDueno}
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
              label="Dirección (opcional)"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              multiline
              rows={2}
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
              {loading ? 'Creando...' : 'Crear Taller'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AdminPage;