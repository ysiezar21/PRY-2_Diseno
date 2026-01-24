// src/pages/ClientePage.tsx

// ============================================
// PÁGINA: Panel del Cliente
// ============================================
// Esta página es exclusiva para usuarios con rol 'client'.
// Permite gestionar sus vehículos, solicitar reparaciones, ver el historial
// de servicios y dar seguimiento en tiempo real al estado de sus reparaciones.

import { Box, Typography, Paper, Button, Chip } from '@mui/material';
import { useAuthContext } from '../contexts/AuthContext';
import { DirectionsCar, CarRepair, History, Message } from '@mui/icons-material';

const ClientePage = () => {
  
  // Obtiene la información del cliente actualmente logueado
  const { user } = useAuthContext();

  return (
    // ============================================
    // CONTENEDOR PRINCIPAL DE LA PÁGINA
    // ============================================
    <Box sx={{ p: 3 }}>  {/* Padding de 24px en todos los lados */}
      
      {/* ============================================ */}
      {/* HEADER: Información del Cliente */}
      {/* ============================================ */}
      {/* Tarjeta destacada con fondo verde que muestra la info del cliente */}
      <Paper sx={{ p: 4, mb: 4, backgroundColor: 'success.main', color: 'white' }}>
        
        {/* Título principal con emoji de auto para enfatizar el rol */}
        <Typography variant="h3" gutterBottom>
          🚗 Panel del Cliente
        </Typography>
        
        {/* Saludo personalizado con el nombre del cliente */}
        <Typography variant="h5">
          Bienvenido, {user?.nombre_completo}
        </Typography>
        
        {/* Información del rol del usuario */}
        <Typography variant="body1" sx={{ mt: 2 }}>
          Rol: <strong>Cliente</strong>
        </Typography>
        
        {/* Detalles adicionales: cédula, email y teléfono del cliente */}
        {/* El teléfono es importante para que el taller pueda contactarlo */}
        <Typography variant="body2" sx={{ mt: 1 }}>
          Cédula: {user?.cedula} | Email: {user?.email} | Teléfono: {user?.phone}
        </Typography>
      </Paper>

      {/* ============================================ */}
      {/* TÍTULO DE SECCIÓN: Servicios */}
      {/* ============================================ */}
      <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
        Servicios Disponibles:
      </Typography>

      {/* ============================================ */}
      {/* GRID DE TARJETAS DE FUNCIONALIDADES */}
      {/* ============================================ */}
      {/* Contenedor flexible que organiza las tarjetas en filas adaptables */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3 }}>
        
        {/* ============================================ */}
        {/* TARJETA 1: Mis Vehículos */}
        {/* ============================================ */}
        {/* Permite ver, agregar, editar y eliminar vehículos registrados */}
        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          {/* Icono de auto en color azul */}
          <DirectionsCar sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Mis Vehículos
          </Typography>
          
          {/* Descripción de la funcionalidad */}
          <Typography variant="body2" color="text.secondary">
            Gestionar información de tus vehículos registrados
          </Typography>
          
          {/* Chip que muestra cuántos vehículos tiene registrados el cliente */}
          {/* TODO: Este valor debería venir de la API según los vehículos reales del usuario */}
          <Chip label="2 vehículos registrados" color="primary" sx={{ mt: 1 }} />
          
          {/* Botón para acceder a la funcionalidad */}
          {/* TODO: Agregar onClick para navegar a la página de vehículos */}
          <Button variant="outlined" sx={{ mt: 2 }}>
            Ver Vehículos
          </Button>
        </Paper>

        {/* ============================================ */}
        {/* TARJETA 2: Solicitar Reparación */}
        {/* ============================================ */}
        {/* Permite crear una nueva solicitud de servicio o reparación */}
        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          {/* Icono de reparación en color rosa/rojo */}
          <CarRepair sx={{ fontSize: 50, color: 'secondary.main', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Solicitar Reparación
          </Typography>
          
          {/* Descripción de la funcionalidad */}
          <Typography variant="body2" color="text.secondary">
            Solicitar nuevo servicio o reparación para tu vehículo
          </Typography>
          
          {/* Botón para acceder a la funcionalidad */}
          {/* TODO: Agregar onClick para abrir formulario de nueva solicitud */}
          <Button variant="outlined" sx={{ mt: 2 }}>
            Nueva Solicitud
          </Button>
        </Paper>

        {/* ============================================ */}
        {/* TARJETA 3: Historial de Servicios */}
        {/* ============================================ */}
        {/* Muestra todas las reparaciones anteriores de todos sus vehículos */}
        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          {/* Icono de historial en color naranja/amarillo */}
          <History sx={{ fontSize: 50, color: 'warning.main', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Historial de Servicios
          </Typography>
          
          {/* Descripción de la funcionalidad */}
          <Typography variant="body2" color="text.secondary">
            Ver todas las reparaciones anteriores de tus vehículos
          </Typography>
          
          {/* Botón para acceder a la funcionalidad */}
          {/* TODO: Agregar onClick para navegar a la página de historial */}
          <Button variant="outlined" sx={{ mt: 2 }}>
            Ver Historial
          </Button>
        </Paper>

        {/* ============================================ */}
        {/* TARJETA 4: Seguimiento en Tiempo Real */}
        {/* ============================================ */}
        {/* Permite ver el estado actual de las reparaciones en progreso */}
        <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
          {/* Icono de mensaje en color azul claro */}
          <Message sx={{ fontSize: 50, color: 'info.main', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Seguimiento en Tiempo Real
          </Typography>
          
          {/* Descripción de la funcionalidad */}
          <Typography variant="body2" color="text.secondary">
            Ver estado actual de tus reparaciones en tiempo real
          </Typography>
          
          {/* Chip que muestra cuántas reparaciones activas tiene el cliente */}
          {/* TODO: Este valor debería venir de la API según las reparaciones activas */}
          <Chip label="1 reparación en progreso" color="warning" sx={{ mt: 1 }} />
          
          {/* Botón para acceder a la funcionalidad */}
          {/* TODO: Agregar onClick para navegar a la página de seguimiento */}
          <Button variant="outlined" sx={{ mt: 2 }}>
            Ver Estado
          </Button>
        </Paper>
      </Box>

      {/* ============================================ */}
      {/* PANEL DE INFORMACIÓN DE VEHÍCULOS */}
      {/* ============================================ */}
      {/* Muestra un resumen rápido de los vehículos del cliente */}
      <Paper sx={{ p: 3, mt: 4, backgroundColor: '#f5f5f5' }}>
        
        {/* Título del panel con emoji de portapapeles */}
        <Typography variant="h6" gutterBottom>
          📋 Información de Mis Vehículos:
        </Typography>
        
        {/* Contenedor de las tarjetas de vehículos */}
        <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
          
          {/* ============================================ */}
          {/* VEHÍCULO 1: Toyota Corolla */}
          {/* ============================================ */}
          {/* Muestra información resumida del primer vehículo */}
          <Paper sx={{ p: 2, flex: 1 }}>
            {/* Nombre y modelo del vehículo con emoji */}
            <Typography variant="subtitle1" gutterBottom>
              🚗 Toyota Corolla 2020
            </Typography>
            
            {/* Número de placa del vehículo */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Placa: ABC-123
            </Typography>
            
            {/* Fecha del último servicio realizado */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Último servicio: 10/01/2024
            </Typography>
            
            {/* Estado actual del vehículo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Estado:
              </Typography>
              {/* Chip naranja indicando que está en reparación actualmente */}
              <Chip label="En reparación" size="small" color="warning" />
            </Box>
          </Paper>
          
          {/* ============================================ */}
          {/* VEHÍCULO 2: Mazda CX-5 */}
          {/* ============================================ */}
          {/* Muestra información resumida del segundo vehículo */}
          <Paper sx={{ p: 2, flex: 1 }}>
            {/* Nombre y modelo del vehículo con emoji */}
            <Typography variant="subtitle1" gutterBottom>
              🚙 Mazda CX-5 2022
            </Typography>
            
            {/* Número de placa del vehículo */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Placa: XYZ-789
            </Typography>
            
            {/* Fecha del último servicio realizado */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Último servicio: 15/12/2023
            </Typography>
            
            {/* Estado actual del vehículo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Estado:
              </Typography>
              {/* Chip verde indicando que está en buen estado */}
              <Chip label="En buen estado" size="small" color="success" />
            </Box>
          </Paper>
          
        </Box>
      </Paper>
      
      {/* NOTA PARA DESARROLLO: */}
      {/* La información de los vehículos (Toyota Corolla, Mazda CX-5, placas, fechas) */}
      {/* son datos de ejemplo. En producción, estos deberían venir de una API */}
      {/* que consulte la base de datos y filtre por el ID del cliente (user.id) */}
      
    </Box>
  );
};

// Exporta ClientePage para ser usado en AppRouter
export default ClientePage;