// src/components/layout/Header.tsx

// ============================================
// COMPONENTE: Header (Barra Superior)
// ============================================
// Barra de navegación superior que se muestra en todas las páginas.
// Incluye el botón de menú para móviles, título de la aplicación
// y menú de usuario con opciones de perfil y cerrar sesión.

import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Box,
  Avatar,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// ============================================
// INTERFACE: Props del Header
// ============================================
interface HeaderProps {
  // Función que se ejecuta al presionar el botón de menú hamburguesa
  // Abre/cierra el sidebar en dispositivos móviles
  onDrawerToggle: () => void;
}

const Header = ({ onDrawerToggle }: HeaderProps) => {
  
  // ============================================
  // ESTADO: Menú de Usuario
  // ============================================
  // Controla la posición y visibilidad del menú desplegable del usuario
  // null = menú cerrado, HTMLElement = menú abierto en esa posición
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  
  // Obtiene la información del usuario actual y la función de logout del contexto
  const { user, logout } = useAuth();

  // ============================================
  // FUNCIÓN: Abrir Menú de Usuario
  // ============================================
  // Se ejecuta al hacer clic en el avatar del usuario
  // Guarda la posición del elemento clickeado para mostrar el menú ahí
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  // ============================================
  // FUNCIÓN: Cerrar Menú de Usuario
  // ============================================
  // Cierra el menú desplegable al hacer clic fuera o seleccionar una opción
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  // ============================================
  // FUNCIÓN: Cerrar Sesión
  // ============================================
  // Ejecuta el logout para cerrar la sesión del usuario
  // y cierra el menú desplegable
  const handleLogout = () => {
    logout();
    handleCloseUserMenu();
  };

  return (
    // ============================================
    // BARRA SUPERIOR (AppBar)
    // ============================================
    // Barra fija en la parte superior de la pantalla
    <AppBar
      position="fixed"
      sx={{
        // En pantallas pequeñas (xs) ocupa todo el ancho
        // En pantallas medianas y grandes (sm+) deja espacio para el sidebar (240px)
        width: { sm: `calc(100% - ${240}px)` },
        
        // Margen izquierdo de 240px en pantallas sm+ para no superponerse con el sidebar
        ml: { sm: `${240}px` },
      }}
    >
      <Toolbar>
        
        {/* ============================================ */}
        {/* BOTÓN DE MENÚ HAMBURGUESA (Solo Móvil) */}
        {/* ============================================ */}
        {/* Botón que abre/cierra el sidebar en dispositivos móviles */}
        {/* Se oculta en pantallas sm+ porque el sidebar siempre está visible */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}  // Visible solo en pantallas xs
        >
          <MenuIcon />
        </IconButton>
        
        {/* ============================================ */}
        {/* TÍTULO DE LA APLICACIÓN */}
        {/* ============================================ */}
        {/* Muestra el nombre de la aplicación en el centro/izquierda */}
        {/* flexGrow: 1 hace que ocupe todo el espacio disponible */}
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Gestión de Talleres
        </Typography>

        {/* ============================================ */}
        {/* SECCIÓN DE USUARIO (Avatar y Menú) */}
        {/* ============================================ */}
        <Box sx={{ flexGrow: 0 }}>
          
          {/* Tooltip que muestra texto al pasar el mouse sobre el avatar */}
          <Tooltip title="Abrir configuración">
            {/* Botón con el avatar del usuario */}
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
              <Avatar 
                alt={user?.nombre_completo}       // Texto alternativo con el nombre del usuario
                sx={{ bgcolor: 'secondary.main' }}  // Color de fondo rosa/rojo del tema
              >
                {/* Si no hay imagen, muestra la primera letra del nombre */}
                {user?.nombre_completo?.charAt(0)}
                
              </Avatar>
            </IconButton>
          </Tooltip>
          
          {/* ============================================ */}
          {/* MENÚ DESPLEGABLE DEL USUARIO */}
          {/* ============================================ */}
          {/* Menú que aparece al hacer clic en el avatar */}
          <Menu
            sx={{ mt: '45px' }}  // Margen superior para que aparezca debajo del avatar
            anchorEl={anchorElUser}  // Elemento HTML donde se ancla el menú
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted  // Mantiene el menú en el DOM aunque esté cerrado (mejora rendimiento)
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorElUser)}  // Abierto cuando anchorElUser no es null
            onClose={handleCloseUserMenu}  // Cierra el menú al hacer clic fuera
          >
            
            {/* Opción: Ver/Editar Perfil */}
            {/* TODO: Implementar navegación a página de perfil */}
            <MenuItem onClick={handleCloseUserMenu}>
              <Typography textAlign="center">Perfil</Typography>
            </MenuItem>
            
            {/* Opción: Configuración */}
            {/* TODO: Implementar navegación a página de configuración */}
            <MenuItem onClick={handleCloseUserMenu}>
              <Typography textAlign="center">Configuración</Typography>
            </MenuItem>
            
            {/* Opción: Cerrar Sesión */}
            {/* Ejecuta logout y redirige al usuario a la página de login */}
            <MenuItem onClick={handleLogout}>
              <Typography textAlign="center">Cerrar Sesión</Typography>
            </MenuItem>
            
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

// Exporta el Header para ser usado en Layout
export default Header;