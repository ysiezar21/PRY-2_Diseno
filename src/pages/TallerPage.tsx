// src/pages/TallerPage.tsx

// ============================================
// PÁGINA: Panel del Dueño de Taller
// ============================================
// Esta página es exclusiva para usuarios con rol 'workshop_owner'.
// Permite gestionar todas las operaciones de su taller: reparaciones,
// mecánicos, inventario, facturación y ver estadísticas del negocio.

import { Box, Typography, Paper, Button } from '@mui/material';
import { useAuthContext } from '../contexts/AuthContext';
import { People, CarRepair, Inventory, Receipt } from '@mui/icons-material';

const TallerPage = () => {
  
  // Obtiene la información del dueño del taller actualmente logueado
  const { user } = useAuthContext();

  return (
    // ============================================
    // CONTENEDOR PRINCIPAL DE LA PÁGINA
    // ============================================
    <Box sx={{ p: 3 }}>  {/* Padding de 24px en todos los lados */}
      
      {/* ============================================ */}
      {/* HEADER: Información del Dueño de Taller */}
      {/* ============================================ */}
      {/* Tarjeta destacada con fondo rosa/rojo que muestra la info del dueño */}
      <Paper sx={{ p: 4, mb: 4, backgroundColor: 'secondary.main', color: 'white' }}>
        
        {/* Título principal con emoji de llave inglesa para enfatizar el rol */}
        <Typography variant="h3" gutterBottom>
          🔧 Panel del Dueño de Taller
        </Typography>
        
        {/* Saludo personalizado con el nombre del dueño del taller */}
        <Typography variant="h5">
          Bienvenido, {user?.nombre_completo}
        </Typography>
        
        {/* Información del rol del usuario */}
        <Typography variant="body1" sx={{ mt: 2 }}>
          Rol: <strong>Dueño de Taller</strong>
        </Typography>
        
        {/* Detalles adicionales: cédula y email del dueño */}
        <Typography variant="body2" sx={{ mt: 1 }}>
          Cédula: {user?.cedula} | Email: {user?.email}
        </Typography>
      </Paper>

      {/* ============================================ */}
      {/* TÍTULO DE SECCIÓN: Funcionalidades */}
      {/* ============================================ */}
      <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
        Mi Taller - Funcionalidades:
      </Typography>

      {/* ============================================ */}
      {/* GRID DE TARJETAS DE FUNCIONALIDADES */}
      {/* ============================================ */}
      {/* Contenedor flexible que organiza las tarjetas en filas adaptables */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3 }}>
        
        {/* ============================================ */}
        {/* TARJETA 1: Gestionar Reparaciones */}
        {/* ============================================ */}
        {/* Permite ver, crear, editar y dar seguimiento a las reparaciones */}
        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          {/* Icono de reparación de auto en color azul */}
          <CarRepair sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Gestionar Reparaciones
          </Typography>
          
          {/* Descripción de la funcionalidad */}
          <Typography variant="body2" color="text.secondary">
            Ver, crear y administrar reparaciones en tu taller
          </Typography>
          
          {/* Botón para acceder a la funcionalidad */}
          {/* TODO: Agregar onClick para navegar a la página de reparaciones */}
          <Button variant="outlined" sx={{ mt: 2 }}>
            Ver Reparaciones
          </Button>
        </Paper>

        {/* ============================================ */}
        {/* TARJETA 2: Mis Mecánicos */}
        {/* ============================================ */}
        {/* Permite gestionar el equipo de mecánicos y sus asignaciones */}
        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          {/* Icono de personas en color rosa/rojo */}
          <People sx={{ fontSize: 50, color: 'secondary.main', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Mis Mecánicos
          </Typography>
          
          {/* Descripción de la funcionalidad */}
          <Typography variant="body2" color="text.secondary">
            Administrar tu equipo de mecánicos y sus asignaciones
          </Typography>
          
          {/* Botón para acceder a la funcionalidad */}
          {/* TODO: Agregar onClick para navegar a la página de mecánicos */}
          <Button variant="outlined" sx={{ mt: 2 }}>
            Ver Equipo
          </Button>
        </Paper>

        {/* ============================================ */}
        {/* TARJETA 3: Inventario */}
        {/* ============================================ */}
        {/* Control de stock de repuestos, herramientas y materiales */}
        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          {/* Icono de inventario en color naranja/amarillo */}
          <Inventory sx={{ fontSize: 50, color: 'warning.main', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Inventario
          </Typography>
          
          {/* Descripción de la funcionalidad */}
          <Typography variant="body2" color="text.secondary">
            Control de repuestos, herramientas y materiales
          </Typography>
          
          {/* Botón para acceder a la funcionalidad */}
          {/* TODO: Agregar onClick para navegar a la página de inventario */}
          <Button variant="outlined" sx={{ mt: 2 }}>
            Ver Inventario
          </Button>
        </Paper>

        {/* ============================================ */}
        {/* TARJETA 4: Facturación */}
        {/* ============================================ */}
        {/* Genera facturas, recibos y controla los pagos recibidos */}
        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          {/* Icono de recibo en color verde */}
          <Receipt sx={{ fontSize: 50, color: 'success.main', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Facturación
          </Typography>
          
          {/* Descripción de la funcionalidad */}
          <Typography variant="body2" color="text.secondary">
            Generar facturas, recibos y controlar pagos
          </Typography>
          
          {/* Botón para acceder a la funcionalidad */}
          {/* TODO: Agregar onClick para navegar a la página de facturación */}
          <Button variant="outlined" sx={{ mt: 2 }}>
            Facturar
          </Button>
        </Paper>
      </Box>

      {/* ============================================ */}
      {/* PANEL DE ESTADÍSTICAS DEL TALLER */}
      {/* ============================================ */}
      {/* Muestra métricas importantes del taller de forma resumida */}
      <Paper sx={{ p: 3, mt: 4, backgroundColor: '#f5f5f5' }}>
        
        {/* Título del panel de resumen con emoji de gráfica */}
        <Typography variant="h6" gutterBottom>
          📈 Estadísticas de Mi Taller:
        </Typography>
        
        {/* Contenedor de las métricas en formato horizontal */}
        <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
          
          {/* Métrica 1: Número de mecánicos trabajando en el taller */}
          <Box>
            <Typography variant="body2" color="text.secondary">Mecánicos Activos</Typography>
            <Typography variant="h4">8</Typography>
          </Box>
          
          {/* Métrica 2: Reparaciones que están en proceso actualmente */}
          <Box>
            <Typography variant="body2" color="text.secondary">Reparaciones Activas</Typography>
            <Typography variant="h4">5</Typography>
          </Box>
          
          {/* Métrica 3: Reparaciones finalizadas en el día de hoy */}
          <Box>
            <Typography variant="body2" color="text.secondary">Completadas Hoy</Typography>
            <Typography variant="h4">3</Typography>
          </Box>
          
          {/* Métrica 4: Ingresos totales generados en el mes actual */}
          <Box>
            <Typography variant="body2" color="text.secondary">Ingresos del Mes</Typography>
            <Typography variant="h4">$4.5M</Typography>
          </Box>
          
        </Box>
      </Paper>
      
      {/* NOTA PARA DESARROLLO: */}
      {/* Los valores de las estadísticas (8, 5, 3, $4.5M) son datos de ejemplo */}
      {/* En producción, estos deberían venir de una API que consulte la base de datos */}
      {/* y filtre por el workshopId del usuario actual */}
      
    </Box>
  );
};

// Exporta TallerPage para ser usado en AppRouter
export default TallerPage;