// src/components/layout/Layout.tsx

// ============================================
// COMPONENTE: Layout Principal
// ============================================
// Este componente define la estructura visual base de toda la aplicación.
// Incluye el Header (barra superior), Sidebar (menú lateral) y el área
// de contenido principal donde se renderizan las diferentes páginas.

import { Outlet } from 'react-router-dom';
import { Box, Container, Toolbar } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import { useState } from 'react';

// ============================================
// CONSTANTE: Ancho del Menú Lateral
// ============================================
// Define el ancho en píxeles del sidebar cuando está abierto
// Este valor se usa para calcular el espacio disponible para el contenido
const drawerWidth = 240;

const Layout = () => {
  
  // ============================================
  // ESTADO: Control del Menú en Móvil
  // ============================================
  // Controla si el menú lateral está abierto o cerrado en dispositivos móviles
  // true = menú visible, false = menú oculto
  const [mobileOpen, setMobileOpen] = useState(false);

  // ============================================
  // FUNCIÓN: Toggle del Menú Móvil
  // ============================================
  // Alterna entre abrir y cerrar el menú lateral en pantallas pequeñas
  // Se activa al presionar el botón de menú hamburguesa en el header
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    // ============================================
    // CONTENEDOR PRINCIPAL
    // ============================================
    // Box principal que usa flexbox para organizar header, sidebar y contenido
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      
      {/* ============================================ */}
      {/* HEADER: Barra Superior */}
      {/* ============================================ */}
      {/* Muestra el logo, título y botón para abrir/cerrar el menú móvil */}
      <Header onDrawerToggle={handleDrawerToggle} />
      
      {/* ============================================ */}
      {/* SIDEBAR: Menú Lateral */}
      {/* ============================================ */}
      {/* Muestra las opciones de navegación según el rol del usuario */}
      {/* En escritorio siempre visible, en móvil se oculta/muestra con toggle */}
      <Sidebar 
        mobileOpen={mobileOpen}           // Estado actual del menú en móvil
        onDrawerToggle={handleDrawerToggle}  // Función para cerrar el menú
        drawerWidth={drawerWidth}         // Ancho del sidebar (240px)
      />
      
      {/* ============================================ */}
      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      {/* ============================================ */}
      {/* Aquí se renderizan todas las páginas de la aplicación */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,  // Ocupa todo el espacio disponible después del sidebar
          p: 3,         // Padding de 24px en todos los lados
          
          // En pantallas pequeñas (xs) usa el 100% del ancho
          // En pantallas medianas y grandes (sm+) resta el ancho del sidebar
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          
          // Color de fondo definido en el tema (gris claro #f5f5f5)
          backgroundColor: 'background.default',
          
          // Altura mínima de toda la pantalla para que ocupe toda la vista
          minHeight: '100vh',
        }}
      >
        
        {/* ============================================ */}
        {/* ESPACIO PARA EL HEADER FIJO */}
        {/* ============================================ */}
        {/* Toolbar vacío que crea espacio para que el contenido */}
        {/* no quede oculto detrás del header que está en posición fija */}
        <Toolbar />
        
        {/* ============================================ */}
        {/* CONTENEDOR DEL CONTENIDO */}
        {/* ============================================ */}
        {/* Container que limita el ancho máximo del contenido */}
        {/* y centra el contenido en pantallas grandes */}
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          
          {/* Outlet: Aquí se renderizan las páginas hijas definidas en AppRouter */}
          {/* Puede ser Dashboard, AdminPage, TallerPage, etc. */}
          <Outlet />
          
        </Container>
      </Box>
    </Box>
  );
};

// Exporta el Layout para ser usado en AppRouter
export default Layout;