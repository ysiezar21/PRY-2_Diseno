// src/pages/Dashboard/Dashboard.tsx

// ============================================
// PÁGINA: Dashboard (Redirección Inteligente)
// ============================================
// Esta página funciona como un punto de entrada central después del login.
// No muestra contenido real, sino que redirige automáticamente al usuario
// a su panel específico según su rol en el sistema.

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { CircularProgress, Box, Typography } from '@mui/material';

const Dashboard = () => {
  
  // Obtiene la información del usuario actualmente logueado
  const { user } = useAuthContext();
  
  // Hook para navegar programáticamente a otras rutas
  const navigate = useNavigate();

  // ============================================
  // EFECTO: Redirección Automática por Rol
  // ============================================
  // Se ejecuta cada vez que cambia el usuario o la función navigate
  useEffect(() => {
    // Si no hay usuario logueado, no hace nada
    // (el ProtectedRoute en AppRouter ya debería haber redirigido al login)
    if (!user) return;

    // ============================================
    // LÓGICA DE REDIRECCIÓN SEGÚN ROL
    // ============================================
    // Cada rol tiene una página principal diferente donde trabajará
    switch (user.role) {
      
      // Administrador de la plataforma: va al panel de administración general
      // Desde ahí puede gestionar todos los talleres y usuarios del sistema
      case 'web_owner':
        navigate('/admin');
        break;
      
      // Dueño de taller: va a la página de gestión de su taller
      // Puede administrar mecánicos, reparaciones y configuración del taller
      case 'workshop_owner':
        navigate('/taller');
        break;
      
      // Mecánico: va a su página de trabajos asignados
      // Puede ver y actualizar el estado de las reparaciones que le asignaron
      case 'mechanic':
        navigate('/mecanico');
        break;
      
      // Cliente: va a su página de vehículos y reparaciones
      // Puede solicitar servicios y ver el estado de sus reparaciones
      case 'client':
        navigate('/cliente');
        break;
      
      // Si el rol no es reconocido (caso de error), redirige al login
      // Esto no debería ocurrir en producción si la BD está bien configurada
      default:
        navigate('/login');
    }
  }, [user, navigate]); // Se ejecuta cuando cambia el usuario o la función navigate

  // ============================================
  // INTERFAZ TEMPORAL DURANTE LA REDIRECCIÓN
  // ============================================
  // Muestra un spinner y mensaje mientras se procesa la redirección
  // El usuario solo ve esto por una fracción de segundo
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',      // Centra horizontalmente
        justifyContent: 'center',  // Centra verticalmente
        minHeight: '60vh',         // Ocupa al menos el 60% de la altura de la ventana
      }}
    >
      {/* Spinner de carga circular animado */}
      <CircularProgress size={60} />
      
      {/* Mensaje informativo para el usuario */}
      <Typography variant="h6" sx={{ mt: 3 }}>
        Redirigiendo a tu panel...
      </Typography>
    </Box>
  );
};

// Exporta el Dashboard para ser usado en AppRouter
export default Dashboard;