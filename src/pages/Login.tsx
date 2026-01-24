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
  const [email, setEmail] = useState('admin@taller.com');
  
  // Contraseña del usuario - precargada con un valor de prueba para desarrollo
  const [password, setPassword] = useState('password123');
  
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

    // ============================================
    // MANEJO DE RESULTADO DEL LOGIN
    // ============================================
    
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
    // ============================================
    // CONTENEDOR PRINCIPAL
    // ============================================
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
        
        {/* ============================================ */}
        {/* TARJETA DEL FORMULARIO */}
        {/* ============================================ */}
        {/* Paper es una superficie elevada de Material-UI (como una tarjeta) */}
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
          
          {/* ============================================ */}
          {/* ICONO DE CANDADO */}
          {/* ============================================ */}
          {/* Círculo azul con un icono de candado para identificar la página */}
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
          
          {/* ============================================ */}
          {/* ALERTA DE ERROR */}
          {/* ============================================ */}
          {/* Solo se muestra si hay un error (ej: credenciales incorrectas) */}
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* ============================================ */}
          {/* FORMULARIO DE LOGIN */}
          {/* ============================================ */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            
            {/* ============================================ */}
            {/* CAMPO: Email */}
            {/* ============================================ */}
            <TextField
              margin="normal"
              required              // Campo obligatorio
              fullWidth             // Ocupa todo el ancho disponible
              label="Correo Electrónico"
              value={email}
              // trim() elimina espacios en blanco al inicio y final
              onChange={(e) => setEmail(e.target.value.trim())}
              disabled={loading}    // Deshabilitado mientras se procesa el login
              helperText="admin@taller.com"  // Texto de ayuda debajo del campo
            />
            
            {/* ============================================ */}
            {/* CAMPO: Contraseña */}
            {/* ============================================ */}
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
              helperText="password123"  // Texto de ayuda debajo del campo
            />
            
            {/* ============================================ */}
            {/* BOTÓN: Enviar Formulario */}
            {/* ============================================ */}
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
            
            {/* ============================================ */}
            {/* INFORMACIÓN DE USUARIOS DE PRUEBA */}
            {/* ============================================ */}
            {/* Sección informativa para desarrolladores y testers */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" align="center">
                Usuarios de prueba (usa los valores predefinidos):
              </Typography>
              <Typography variant="body2" color="primary" align="center" sx={{ mt: 1 }}>
                Email: admin@taller.com
                <br />
                Contraseña: password123
              </Typography>
              <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 1, display: 'block' }}>
                Abre la consola (F12) para ver logs de depuración
              </Typography>
            </Box>
            
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

// Exporta la página Login para ser usada en AppRouter
export default Login;