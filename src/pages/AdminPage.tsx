// src/pages/AdminPage.tsx

// ============================================
// PÁGINA: Panel de Administración Principal
// ============================================
// Esta página es exclusiva para usuarios con rol 'web_owner'.
// Permite gestionar toda la plataforma: talleres, usuarios, reportes globales
// y configuración del sistema. Es el nivel más alto de administración.

import { Box, Typography, Paper, Button } from '@mui/material';
import { useAuthContext } from '../contexts/AuthContext';
import { Build, People, CarRepair, Settings } from '@mui/icons-material';

const AdminPage = () => {
  
  // Obtiene la información del usuario administrador actualmente logueado
  const { user } = useAuthContext();

  return (
    // ============================================
    // CONTENEDOR PRINCIPAL DE LA PÁGINA
    // ============================================
    <Box sx={{ p: 3 }}>  {/* Padding de 24px en todos los lados */}
      
      {/* ============================================ */}
      {/* HEADER: Información del Administrador */}
      {/* ============================================ */}
      {/* Tarjeta destacada con fondo azul que muestra la info del admin */}
      <Paper sx={{ p: 4, mb: 4, backgroundColor: 'primary.main', color: 'white' }}>
        
        {/* Título principal con emoji de corona para enfatizar el rol */}
        <Typography variant="h3" gutterBottom>
          👑 Panel del Dueño de la Página
        </Typography>
        
        {/* Saludo personalizado con el nombre del administrador */}
        <Typography variant="h5">
          Bienvenido, {user?.nombre_completo}
        </Typography>
        
        {/* Información del rol del usuario */}
        <Typography variant="body1" sx={{ mt: 2 }}>
          Rol: <strong>Dueño de la Página (Administrador Principal)</strong>
        </Typography>
        
        {/* Detalles adicionales: cédula y email del administrador */}
        <Typography variant="body2" sx={{ mt: 1 }}>
          Cédula: {user?.cedula} | Email: {user?.email}
        </Typography>
      </Paper>

      {/* ============================================ */}
      {/* TÍTULO DE SECCIÓN: Funcionalidades */}
      {/* ============================================ */}
      <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
        Funcionalidades Disponibles:
      </Typography>

      {/* ============================================ */}
      {/* GRID DE TARJETAS DE FUNCIONALIDADES */}
      {/* ============================================ */}
      {/* Contenedor flexible que organiza las tarjetas en filas que se ajustan */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3 }}>
        
        {/* ============================================ */}
        {/* TARJETA 1: Gestionar Talleres */}
        {/* ============================================ */}
        {/* Permite crear, editar, eliminar y ver todos los talleres del sistema */}
        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          {/* Icono de herramienta en color azul */}
          <Build sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Gestionar Talleres
          </Typography>
          
          {/* Descripción de la funcionalidad */}
          <Typography variant="body2" color="text.secondary">
            Crear, editar y eliminar talleres registrados en la plataforma
          </Typography>
          
          {/* Botón para acceder a la funcionalidad */}
          {/* TODO: Agregar onClick para navegar a la página de gestión de talleres */}
          <Button variant="outlined" sx={{ mt: 2 }}>
            Administrar Talleres
          </Button>
        </Paper>

        {/* ============================================ */}
        {/* TARJETA 2: Gestionar Usuarios */}
        {/* ============================================ */}
        {/* Permite administrar todos los usuarios de la plataforma */}
        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          {/* Icono de personas en color rosa/rojo */}
          <People sx={{ fontSize: 50, color: 'secondary.main', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Gestionar Usuarios
          </Typography>
          
          {/* Descripción de la funcionalidad */}
          <Typography variant="body2" color="text.secondary">
            Controlar accesos y permisos de todos los usuarios del sistema
          </Typography>
          
          {/* Botón para acceder a la funcionalidad */}
          {/* TODO: Agregar onClick para navegar a la página de gestión de usuarios */}
          <Button variant="outlined" sx={{ mt: 2 }}>
            Ver Usuarios
          </Button>
        </Paper>

        {/* ============================================ */}
        {/* TARJETA 3: Ver Reportes */}
        {/* ============================================ */}
        {/* Genera reportes globales de actividad y finanzas */}
        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          {/* Icono de reparación de auto en color verde */}
          <CarRepair sx={{ fontSize: 50, color: 'success.main', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Ver Reportes
          </Typography>
          
          {/* Descripción de la funcionalidad */}
          <Typography variant="body2" color="text.secondary">
            Reportes globales de actividad y finanzas de todos los talleres
          </Typography>
          
          {/* Botón para acceder a la funcionalidad */}
          {/* TODO: Agregar onClick para navegar a la página de reportes */}
          <Button variant="outlined" sx={{ mt: 2 }}>
            Generar Reportes
          </Button>
        </Paper>

        {/* ============================================ */}
        {/* TARJETA 4: Configuración del Sistema */}
        {/* ============================================ */}
        {/* Permite configurar parámetros globales de la plataforma */}
        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          {/* Icono de engranaje en color naranja/amarillo */}
          <Settings sx={{ fontSize: 50, color: 'warning.main', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Configuración
          </Typography>
          
          {/* Descripción de la funcionalidad */}
          <Typography variant="body2" color="text.secondary">
            Configurar parámetros globales del sistema y políticas
          </Typography>
          
          {/* Botón para acceder a la funcionalidad */}
          {/* TODO: Agregar onClick para navegar a la página de configuración */}
          <Button variant="outlined" sx={{ mt: 2 }}>
            Configurar Sistema
          </Button>
        </Paper>
      </Box>

      {/* ============================================ */}
      {/* PANEL DE ESTADÍSTICAS GLOBALES */}
      {/* ============================================ */}
      {/* Muestra métricas importantes del sistema de forma resumida */}
      <Paper sx={{ p: 3, mt: 4, backgroundColor: '#f5f5f5' }}>
        
        {/* Título del panel de resumen */}
        <Typography variant="h6" gutterBottom>
          📊 Resumen del Sistema:
        </Typography>
        
        {/* Contenedor de las métricas en formato horizontal */}
        <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
          
          {/* Métrica 1: Talleres activos en la plataforma */}
          <Box>
            <Typography variant="body2" color="text.secondary">Talleres Activos</Typography>
            <Typography variant="h4">12</Typography>
          </Box>
          
          {/* Métrica 2: Total de usuarios registrados */}
          <Box>
            <Typography variant="body2" color="text.secondary">Usuarios Totales</Typography>
            <Typography variant="h4">45</Typography>
          </Box>
          
          {/* Métrica 3: Reparaciones realizadas en el mes actual */}
          <Box>
            <Typography variant="body2" color="text.secondary">Reparaciones este mes</Typography>
            <Typography variant="h4">156</Typography>
          </Box>
          
          {/* Métrica 4: Ingresos totales generados en la plataforma */}
          <Box>
            <Typography variant="body2" color="text.secondary">Ingresos Totales</Typography>
            <Typography variant="h4">$12.5M</Typography>
          </Box>
          
        </Box>
      </Paper>
      
      {/* NOTA PARA DESARROLLO: */}
      {/* Los valores de las estadísticas (12, 45, 156, $12.5M) son datos de ejemplo */}
      {/* En producción, estos deberían venir de una API que consulte la base de datos */}
      
    </Box>
  );
};

// Exporta AdminPage para ser usado en AppRouter
export default AdminPage;