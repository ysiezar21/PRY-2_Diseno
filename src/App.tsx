// src/App.tsx

// ============================================
// COMPONENTE PRINCIPAL DE LA APLICACIÓN
// ============================================
// Este es el componente raíz que envuelve toda la aplicación.
// Configura los providers globales y el sistema de rutas.

import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './routes/AppRouter';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

// ============================================
// CONFIGURACIÓN DEL TEMA VISUAL
// ============================================
// Define los colores principales de Material-UI para toda la aplicación
const theme = createTheme({
  palette: {
    // Color azul para botones principales, headers y elementos destacados
    primary: { main: '#1976d2' },
    
    // Color rosa/rojo para acciones secundarias y alertas importantes
    secondary: { main: '#dc004e' },
    
    // Color gris claro para el fondo general de toda la aplicación
    background: { default: '#f5f5f5' },
  },
});

// ============================================
// COMPONENTE APP
// ============================================
// Función principal que estructura toda la aplicación con sus providers
function App() {
  return (
    // ThemeProvider: Aplica el tema de Material-UI a todos los componentes hijos
    <ThemeProvider theme={theme}>
      
      {/* CssBaseline: Normaliza los estilos CSS en todos los navegadores */}
      {/* Elimina márgenes por defecto y aplica estilos base consistentes */}
      <CssBaseline />
      
      {/* AuthProvider: Proporciona el contexto de autenticación a toda la app */}
      {/* Permite que cualquier componente acceda a la info del usuario logueado */}
      <AuthProvider>
        
        {/* AppRouter: Maneja todas las rutas y navegación de la aplicación */}
        {/* Define qué componente se muestra según la URL actual */}
        <AppRouter />
        
      </AuthProvider>
    </ThemeProvider>
  );
}

// Exporta el componente para ser usado en main.tsx
export default App;