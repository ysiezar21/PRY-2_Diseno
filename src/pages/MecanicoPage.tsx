// src/pages/MecanicoPage.tsx

// ============================================
// PÁGINA: Panel del Mecánico
// ============================================
// Esta página es exclusiva para usuarios con rol 'mechanic'.
// Permite gestionar sus trabajos asignados, ver su agenda, solicitar
// herramientas/repuestos y monitorear su rendimiento laboral.

import { Box, Typography, Paper, Button, Chip } from '@mui/material';
import { useAuthContext } from '../contexts/AuthContext';
import { Build, CarRepair, Schedule, CheckCircle, DirectionsCar, Inventory } from '@mui/icons-material';

const MecanicoPage = () => {
  
  // Obtiene la información del mecánico actualmente logueado
  const { user } = useAuthContext();

  return (
    // ============================================
    // CONTENEDOR PRINCIPAL DE LA PÁGINA
    // ============================================
    <Box sx={{ p: 3 }}>  {/* Padding de 24px en todos los lados */}
      
      {/* ============================================ */}
      {/* HEADER: Información del Mecánico */}
      {/* ============================================ */}
      {/* Tarjeta destacada con fondo azul claro que muestra la info del mecánico */}
      <Paper sx={{ p: 4, mb: 4, backgroundColor: 'info.main', color: 'white' }}>
        
        {/* Título principal con emoji de herramientas para enfatizar el rol */}
        <Typography variant="h3" gutterBottom>
          🛠️ Panel del Mecánico
        </Typography>
        
        {/* Saludo personalizado con el nombre del mecánico */}
        <Typography variant="h5">
          Bienvenido, {user?.nombre_completo}
        </Typography>
        
        {/* Información del rol y especialidad del mecánico */}
        {/* La especialidad viene del campo 'specialty' del usuario (ej: "Motor", "Transmisión") */}
        {/* Si no tiene especialidad definida, muestra "Motor" por defecto */}
        <Typography variant="body1" sx={{ mt: 2 }}>
          Rol: <strong>Mecánico</strong> | Especialidad: {user?.specialty || 'Motor'}
        </Typography>
        
        {/* Detalles adicionales: cédula, email y nombre del taller */}
        {/* TODO: El nombre del taller debería venir dinámicamente de la BD según user.workshopId */}
        <Typography variant="body2" sx={{ mt: 1 }}>
          Cédula: {user?.cedula} | Email: {user?.email} | Taller: Taller El Rápido
        </Typography>
      </Paper>

      {/* ============================================ */}
      {/* TÍTULO DE SECCIÓN: Funcionalidades */}
      {/* ============================================ */}
      <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
        Mis Funciones:
      </Typography>

      {/* ============================================ */}
      {/* GRID DE TARJETAS DE FUNCIONALIDADES */}
      {/* ============================================ */}
      {/* Contenedor flexible que organiza las tarjetas en filas adaptables */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3 }}>
        
        {/* ============================================ */}
        {/* TARJETA 1: Mis Trabajos Asignados */}
        {/* ============================================ */}
        {/* Muestra las reparaciones que el jefe del taller le ha asignado */}
        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          {/* Icono de reparación de auto en color azul */}
          <CarRepair sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Mis Trabajos Asignados
          </Typography>
          
          {/* Descripción de la funcionalidad */}
          <Typography variant="body2" color="text.secondary">
            Ver y gestionar reparaciones asignadas a ti
          </Typography>
          
          {/* Chips que muestran el estado actual de los trabajos */}
          {/* TODO: Estos valores deberían venir de la API según las reparaciones reales */}
          <Box sx={{ mt: 2 }}>
            <Chip label="3 trabajos pendientes" color="primary" sx={{ mr: 1 }} />
            <Chip label="1 en progreso" color="warning" />
          </Box>
          
          {/* Botón para acceder a la funcionalidad */}
          {/* TODO: Agregar onClick para navegar a la página de trabajos asignados */}
          <Button variant="outlined" sx={{ mt: 2 }}>
            Ver Trabajos
          </Button>
        </Paper>

        {/* ============================================ */}
        {/* TARJETA 2: Agenda y Horarios */}
        {/* ============================================ */}
        {/* Permite al mecánico ver su calendario de trabajo y próximas asignaciones */}
        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          {/* Icono de reloj/agenda en color rosa/rojo */}
          <Schedule sx={{ fontSize: 50, color: 'secondary.main', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Agenda y Horarios
          </Typography>
          
          {/* Descripción de la funcionalidad */}
          <Typography variant="body2" color="text.secondary">
            Organizar tu tiempo y ver próximas asignaciones
          </Typography>
          
          {/* Botón para acceder a la funcionalidad */}
          {/* TODO: Agregar onClick para navegar a la página de agenda */}
          <Button variant="outlined" sx={{ mt: 2 }}>
            Ver Agenda
          </Button>
        </Paper>

        {/* ============================================ */}
        {/* TARJETA 3: Vehículos Asignados */}
        {/* ============================================ */}
        {/* Muestra información detallada de los vehículos que está reparando */}
        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          {/* Icono de auto en color verde */}
          <DirectionsCar sx={{ fontSize: 50, color: 'success.main', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Vehículos Asignados
          </Typography>
          
          {/* Descripción de la funcionalidad */}
          <Typography variant="body2" color="text.secondary">
            Información de vehículos que estás reparando
          </Typography>
          
          {/* Botón para acceder a la funcionalidad */}
          {/* TODO: Agregar onClick para navegar a la página de vehículos */}
          <Button variant="outlined" sx={{ mt: 2 }}>
            Ver Vehículos
          </Button>
        </Paper>

        {/* ============================================ */}
        {/* TARJETA 4: Herramientas y Repuestos */}
        {/* ============================================ */}
        {/* Permite solicitar al jefe herramientas o repuestos que necesite */}
        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          {/* Icono de inventario en color naranja/amarillo */}
          <Inventory sx={{ fontSize: 50, color: 'warning.main', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Herramientas y Repuestos
          </Typography>
          
          {/* Descripción de la funcionalidad */}
          <Typography variant="body2" color="text.secondary">
            Solicitar herramientas y repuestos necesarios
          </Typography>
          
          {/* Botón para acceder a la funcionalidad */}
          {/* TODO: Agregar onClick para navegar a la página de solicitud de materiales */}
          <Button variant="outlined" sx={{ mt: 2 }}>
            Solicitar Materiales
          </Button>
        </Paper>
      </Box>

      {/* ============================================ */}
      {/* PANEL DE ESTADÍSTICAS DE RENDIMIENTO */}
      {/* ============================================ */}
      {/* Muestra métricas del desempeño laboral del mecánico */}
      <Paper sx={{ p: 3, mt: 4, backgroundColor: '#f5f5f5' }}>
        
        {/* Título del panel de rendimiento con emoji de gráfica */}
        <Typography variant="h6" gutterBottom>
          📊 Mi Rendimiento:
        </Typography>
        
        {/* Contenedor de las métricas en formato horizontal */}
        <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
          
          {/* Métrica 1: Total de trabajos finalizados a lo largo del tiempo */}
          <Box>
            <Typography variant="body2" color="text.secondary">Trabajos Completados</Typography>
            <Typography variant="h4">156</Typography>
          </Box>
          
          {/* Métrica 2: Porcentaje de eficiencia (trabajos completados a tiempo) */}
          <Box>
            <Typography variant="body2" color="text.secondary">Eficiencia</Typography>
            <Typography variant="h4">92%</Typography>
          </Box>
          
          {/* Métrica 3: Total de horas trabajadas en el mes actual */}
          <Box>
            <Typography variant="body2" color="text.secondary">Horas Trabajadas (Mes)</Typography>
            <Typography variant="h4">168h</Typography>
          </Box>
          
          {/* Métrica 4: Calificación promedio de satisfacción de clientes */}
          {/* Los clientes pueden calificar el trabajo después de completarse */}
          <Box>
            <Typography variant="body2" color="text.secondary">Satisfacción Clientes</Typography>
            <Typography variant="h4">4.8/5</Typography>
          </Box>
          
        </Box>
      </Paper>
      
      {/* NOTA PARA DESARROLLO: */}
      {/* Los valores de las estadísticas (156, 92%, 168h, 4.8/5) son datos de ejemplo */}
      {/* En producción, estos deberían venir de una API que consulte la base de datos */}
      {/* y filtre por el ID del mecánico actual (user.id) */}
      
    </Box>
  );
};

// Exporta MecanicoPage para ser usado en AppRouter
export default MecanicoPage;