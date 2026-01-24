// src/theme.ts

// ============================================
// CONFIGURACIÓN DEL TEMA VISUAL DE LA APLICACIÓN
// ============================================
// Este archivo define todos los estilos globales y personalizaciones
// visuales de Material-UI que se aplican en toda la aplicación.
// Importa la función para crear temas personalizados de Material-UI

import { createTheme } from '@mui/material/styles';

// ============================================
// CREACIÓN DEL TEMA PERSONALIZADO
// ============================================
// Aquí se configura el aspecto visual completo de la aplicación
const theme = createTheme({
  
  // ============================================
  // PALETA DE COLORES
  // ============================================
  // Define los colores principales que se usan en toda la aplicación
  palette: {
    
    // Colores primarios: Se usan en botones principales, headers, elementos destacados
    primary: {
      main: '#1976d2',    // Azul principal que identifica la marca
      light: '#42a5f5',   // Azul claro para estados hover y elementos secundarios
      dark: '#1565c0',    // Azul oscuro para énfasis y contraste
    },
    
    // Colores secundarios: Se usan para acciones de alerta, botones de acción secundaria
    secondary: {
      main: '#dc004e',    // Rosa/rojo para llamados a la acción importantes
      light: '#ff4081',   // Rosa claro para variaciones
      dark: '#9a0036',    // Rosa oscuro para estados activos
    },
    
    // Colores de fondo: Definen el aspecto general de la interfaz
    background: {
      default: '#f5f5f5', // Gris muy claro para el fondo general de la app
      paper: '#ffffff',   // Blanco para tarjetas, modales y componentes elevados
    },
  },

  // ============================================
  // TIPOGRAFÍA
  // ============================================
  // Configuración de fuentes y tamaños de texto
  typography: {
    // Familia de fuentes que se usa en toda la aplicación (con fallbacks)
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    
    // Estilo para títulos principales de página (h1)
    h1: {
      fontSize: '2.5rem',  // 40px - Para títulos grandes
      fontWeight: 500,      // Semi-negrita para dar importancia
    },
    
    // Estilo para subtítulos y secciones importantes (h2)
    h2: {
      fontSize: '2rem',    // 32px - Para subtítulos de sección
      fontWeight: 500,      // Semi-negrita para jerarquía visual
    },
  },

  // ============================================
  // FORMAS Y BORDES
  // ============================================
  shape: {
    // Radio de borde predeterminado para todos los componentes (botones, cards, inputs)
    // 8px da un aspecto moderno y suave sin ser demasiado redondeado
    borderRadius: 8,
  },

  // ============================================
  // PERSONALIZACIONES DE COMPONENTES
  // ============================================
  // Sobrescribe estilos predeterminados de componentes específicos de Material-UI
  components: {
    
    // Personalización de todos los botones de la aplicación
    MuiButton: {
      styleOverrides: {
        root: {
          // Desactiva la transformación automática a mayúsculas en los botones
          // Esto hace que el texto se muestre tal como lo escribimos
          textTransform: 'none',
        },
      },
    },
  },
});

// Exporta el tema para que pueda ser usado en toda la aplicación
// Se importa en App.tsx y se envuelve con ThemeProvider
export default theme;