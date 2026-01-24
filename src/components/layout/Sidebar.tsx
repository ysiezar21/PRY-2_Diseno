// src/components/layout/Sidebar.tsx

// ============================================
// COMPONENTE: Sidebar (Menú Lateral)
// ============================================
// Menú de navegación lateral que muestra diferentes opciones según el rol del usuario.
// En móvil se muestra/oculta con un toggle, en escritorio está siempre visible.

import React from 'react';
// Importación de todos los iconos utilizados en el menú
import DashboardIcon from '@mui/icons-material/Dashboard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BuildIcon from '@mui/icons-material/Build';
import PeopleIcon from '@mui/icons-material/People';
import CarRepairIcon from '@mui/icons-material/CarRepair';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuthContext } from '../../contexts/AuthContext';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// ============================================
// INTERFACE: Props del Sidebar
// ============================================
const Sidebar: React.FC<{
  // Indica si el menú está abierto en dispositivos móviles
  mobileOpen: boolean; 
  
  // Función para abrir/cerrar el menú en móviles
  onDrawerToggle: () => void; 
  
  // Ancho del menú lateral en píxeles (240px por defecto)
  drawerWidth: number;
}> = ({ mobileOpen, onDrawerToggle, drawerWidth }) => {
  
  // Obtiene la información del usuario actual para determinar qué opciones mostrar
  const { user } = useAuthContext();
  
  // Hook para navegar entre páginas programáticamente
  const navigate = useNavigate();

  // ============================================
  // FUNCIÓN: Generar Opciones del Menú según Rol
  // ============================================
  // Construye dinámicamente el array de opciones del menú
  // basándose en el rol del usuario actualmente logueado
  const getMenuItems = () => {
    
    // Opciones base que todos los usuarios ven sin importar su rol
    const baseItems = [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    ];

    // ============================================
    // OPCIONES PARA: Administrador de la Plataforma (web_owner)
    // ============================================
    // Puede ver y gestionar todos los talleres y usuarios del sistema
    if (user?.role === 'web_owner') {
      baseItems.push(
        { text: 'Panel Admin', icon: <AdminPanelSettingsIcon />, path: '/admin' },
        { text: 'Talleres', icon: <BuildIcon />, path: '/talleres' },
        { text: 'Usuarios', icon: <PeopleIcon />, path: '/usuarios' }
      );
    } 
    
    // ============================================
    // OPCIONES PARA: Dueño de Taller (workshop_owner)
    // ============================================
    // Puede gestionar su taller, sus mecánicos y las reparaciones
    else if (user?.role === 'workshop_owner') {
      baseItems.push(
        { text: 'Mi Taller', icon: <BuildIcon />, path: '/taller' },
        { text: 'Mis Mecánicos', icon: <PeopleIcon />, path: '/mecanicos' },
        { text: 'Reparaciones', icon: <CarRepairIcon />, path: '/reparaciones' }
      );
    } 
    
    // ============================================
    // OPCIONES PARA: Mecánico (mechanic)
    // ============================================
    // Puede ver sus trabajos asignados y gestionar su agenda
    else if (user?.role === 'mechanic') {
      baseItems.push(
        { text: 'Mis Trabajos', icon: <CarRepairIcon />, path: '/mecanico' },
        { text: 'Mi Agenda', icon: <ScheduleIcon />, path: '/agenda' }
      );
    } 
    
    // ============================================
    // OPCIONES PARA: Cliente (client)
    // ============================================
    // Puede ver sus vehículos y el estado de sus reparaciones
    else if (user?.role === 'client') {
      baseItems.push(
        { text: 'Mis Vehículos', icon: <DirectionsCarIcon />, path: '/cliente' },
        { text: 'Mis Reparaciones', icon: <CarRepairIcon />, path: '/mis-reparaciones' }
      );
    }

    // ============================================
    // OPCIONES COMUNES PARA TODOS LOS ROLES
    // ============================================
    // Estas opciones se muestran al final del menú para todos los usuarios
    baseItems.push(
      { text: 'Mi Perfil', icon: <PersonIcon />, path: '/perfil' },
      { text: 'Configuración', icon: <SettingsIcon />, path: '/configuracion' }
    );

    return baseItems;
  };

  // ============================================
  // FUNCIÓN: Manejar Navegación
  // ============================================
  // Se ejecuta al hacer clic en cualquier opción del menú
  const handleNavigation = (path: string) => {
    // Navega a la ruta seleccionada
    navigate(path);
    
    // Cierra el drawer en dispositivos móviles después de navegar
    // Esto mejora la experiencia de usuario en pantallas pequeñas
    onDrawerToggle();
  };

  // Obtiene el array de opciones del menú según el rol del usuario
  const menuItems = getMenuItems();

  return (
    // ============================================
    // DRAWER: Contenedor del Menú Lateral
    // ============================================
    // Drawer de Material-UI que contiene todas las opciones de navegación
    <Drawer
      variant="temporary"  // Tipo temporal: se puede abrir/cerrar (ideal para móviles)
      open={mobileOpen}    // Estado de apertura controlado por el componente padre
      onClose={onDrawerToggle}  // Se ejecuta al hacer clic fuera del drawer
      
      ModalProps={{
        // keepMounted mejora el rendimiento en móviles manteniendo el drawer en el DOM
        keepMounted: true,
      }}
      
      sx={{
        '& .MuiDrawer-paper': { 
          boxSizing: 'border-box', 
          width: drawerWidth  // Ancho fijo de 240px
        },
      }}
    >
      
      {/* ============================================ */}
      {/* LISTA DE OPCIONES DEL MENÚ */}
      {/* ============================================ */}
      <List>
        {/* Itera sobre cada opción del menú generada dinámicamente */}
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            {/* Botón clickeable de cada opción del menú */}
            <ListItemButton onClick={() => handleNavigation(item.path)}>
              
              {/* Icono de la opción (varía según la funcionalidad) */}
              <ListItemIcon>{item.icon}</ListItemIcon>
              
              {/* Texto descriptivo de la opción */}
              <ListItemText primary={item.text} />
              
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

// Exporta el Sidebar para ser usado en Layout
export default Sidebar;