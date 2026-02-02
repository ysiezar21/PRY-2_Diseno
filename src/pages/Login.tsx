// src/pages/Login.tsx

// ============================================
// PÁGINA: Inicio de Sesión
// ============================================
// Página donde los usuarios ingresan sus credenciales para acceder al sistema.
// Incluye validación de formulario, manejo de errores y redirección automática
// al dashboard después de un login exitoso.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useAuthContext } from '../contexts/AuthContext';

const Login = () => {
  
  // ============================================
  // ESTADOS DEL FORMULARIO
  // ============================================
  
  // Email del usuario - precargado con un valor de prueba para desarrollo
  const [email, setEmail] = useState('');
  
  // Contraseña del usuario - precargada con un valor de prueba para desarrollo
  const [password, setPassword] = useState('');
  
  // Obtiene funciones y estado del contexto de autenticación
  const { login, error, clearError, loading } = useAuthContext();
  
  // Hook para navegar a otras páginas después del login exitoso
  const navigate = useNavigate();

  // ============================================
  // FUNCIÓN: Manejar Envío del Formulario
  // ============================================
  // Se ejecuta cuando el usuario presiona el botón "Iniciar Sesión"
  const handleSubmit = async (e: React.FormEvent) => {
    // Previene el comportamiento por defecto del formulario (recargar la página)
    e.preventDefault();

    // Limpia cualquier error previo antes de intentar un nuevo login
    clearError();
    
    // Intenta iniciar sesión con las credenciales proporcionadas
    // La función login retorna un objeto con success y posibles datos del usuario
    const result = await login(email, password);
    
    // Si el login fue exitoso, redirige al usuario al dashboard
    if (result.success) {
      navigate('/dashboard');
    } 
    // Si falló, el error ya está siendo manejado por el contexto
    // y se mostrará automáticamente en el componente Alert
    else {
      // El error se muestra automáticamente mediante el estado 'error' del contexto
    }
  };

  return (
    // Container centrado con ancho máximo pequeño (xs) para el formulario
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,           // Espacio superior de 64px
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',   // Centra horizontalmente
        }}
      >
        <Paper
          elevation={3}  // Nivel de sombra (elevación visual)
          sx={{
            padding: 4,              // Espaciado interno de 32px
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          
          <Box
            sx={{
              backgroundColor: 'primary.main',  // Color azul del tema
              borderRadius: '50%',              // Hace el box completamente redondo
              padding: 2,                       // Espaciado interno de 16px
              mb: 2,                            // Margen inferior de 16px
            }}
          >
            <LockOutlined sx={{ color: 'white', fontSize: 40 }} />
          </Box>
          
          {/* Título de la página */}
          <Typography component="h1" variant="h5" gutterBottom>
            Iniciar Sesión
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            
            <TextField
              margin="normal"
              required              // Campo obligatorio
              fullWidth             // Ocupa todo el ancho disponible
              label="Correo Electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              disabled={loading}    // Deshabilitado mientras se procesa el login
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="Contraseña"
              type="password"       // Oculta el texto ingresado
              value={password}
              // trim() elimina espacios en blanco al inicio y final
              onChange={(e) => setPassword(e.target.value.trim())}
              disabled={loading}    // Deshabilitado mientras se procesa el login
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"   // Estilo de botón sólido (no outline)
              sx={{ mt: 3, mb: 2 }} // Márgenes superior e inferior
              disabled={loading}    // Deshabilitado mientras se procesa el login
            >
              {/* Muestra un spinner si está cargando, o el texto si no */}
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
            
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

// Exporta la página Login para ser usada en AppRouter
export default Login;