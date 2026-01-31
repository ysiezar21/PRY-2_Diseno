// src/routes/AppRouter.tsx
// ============================================
// CONFIGURACIÓN DE RUTAS DE LA APLICACIÓN
// ============================================
// Este archivo define todas las rutas (URLs) de la aplicación y controla
// el acceso según el estado de autenticación y el rol del usuario.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { useAuthContext } from '../contexts/AuthContext';

// ============================================
// LAZY LOADING DE PÁGINAS
// ============================================
// Carga las páginas solo cuando son necesarias (no todas al inicio)
// Esto mejora el rendimiento inicial de la aplicación reduciendo el tamaño del bundle
const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));
const Layout = lazy(() => import('../components/layout/Layout'));
const AdminPage = lazy(() => import('../pages/AdminPage'));
const TallerPage = lazy(() => import('../pages/TallerPage'));
const MecanicoPage = lazy(() => import('../pages/MecanicoPage'));
const ClientePage = lazy(() => import('../pages/ClientePage'));

// ============================================
// COMPONENTE: Pantalla de Carga
// ============================================
// Muestra un spinner mientras se carga la aplicación
const LoadingScreen = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="100vh"
    sx={{ backgroundColor: '#f5f5f5' }}
  >
    <CircularProgress size={60} />
  </Box>
);

// ============================================
// COMPONENTE: Ruta Protegida
// ============================================
// Envuelve rutas que requieren autenticación
// Si el usuario no está logueado, lo redirige al login
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Obtiene el estado de autenticación del contexto
  const { isAuthenticated, loading } = useAuthContext();

  // Mientras se verifica la autenticación, muestra un spinner de carga
  if (loading) {
    return <LoadingScreen />;
  }

  // Si el usuario NO está autenticado, redirige a la página de login
  // 'replace' hace que no se pueda volver atrás con el botón del navegador
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, muestra el contenido de la ruta solicitada
  return <>{children}</>;
};

// ============================================
// COMPONENTE: Ruta Pública (Login)
// ============================================
// Envuelve rutas públicas como login
// Si el usuario ya está autenticado, lo redirige a su dashboard
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading, user } = useAuthContext();

  // Mientras se verifica la autenticación, muestra un spinner de carga
  if (loading) {
    return <LoadingScreen />;
  }

  // Si el usuario YA está autenticado, redirige según su rol
  if (isAuthenticated && user) {
    // Redirigir según el rol del usuario
    switch (user.role) {
      case 'web_owner':
        return <Navigate to="/admin" replace />;
      case 'workshop_owner':
        return <Navigate to="/taller" replace />;
      case 'mechanic':
        return <Navigate to="/mecanico" replace />;
      case 'client':
        return <Navigate to="/cliente" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  // Si no está autenticado, muestra la página pública
  return <>{children}</>;
};

// ============================================
// COMPONENTE: Ruta por Rol
// ============================================
// Envuelve rutas que solo pueden acceder usuarios con un rol específico
// Si el usuario no tiene el rol correcto, lo redirige al dashboard
const RoleRoute = ({ role, children }: { role: string; children: React.ReactNode }) => {
  // Obtiene la información del usuario actual
  const { user, loading } = useAuthContext();

  // Mientras se verifica, muestra loading
  if (loading) {
    return <LoadingScreen />;
  }

  // Verifica si el rol del usuario coincide con el rol requerido para la ruta
  // Si NO coincide, redirige al usuario al dashboard principal
  if (user?.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si el rol es correcto, muestra el contenido de la página
  return <>{children}</>;
};

// ============================================
// COMPONENTE PRINCIPAL: AppRouter
// ============================================
// Define todas las rutas disponibles en la aplicación
const AppRouter = () => {
  return (
    // BrowserRouter: Habilita la navegación entre páginas usando URLs del navegador
    <BrowserRouter>
      
      {/* Suspense: Muestra un fallback mientras se cargan los componentes lazy */}
      <Suspense fallback={<LoadingScreen />}>
        
        {/* Routes: Contenedor de todas las rutas de la aplicación */}
        <Routes>
          
          {/* ============================================ */}
          {/* RUTA PÚBLICA: Login */}
          {/* ============================================ */}
          {/* Página de inicio de sesión - accesible sin autenticación */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          
          {/* ============================================ */}
          {/* RUTAS PROTEGIDAS: Requieren autenticación */}
          {/* ============================================ */}
          {/* Todas estas rutas usan el Layout que incluye Header y Sidebar */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            
            {/* Ruta raíz "/" redirige automáticamente a "/dashboard" */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard: Página principal después del login (accesible para todos los roles) */}
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* ============================================ */}
            {/* RUTAS ESPECÍFICAS POR ROL */}
            {/* ============================================ */}
            
            {/* Página de Administrador - Solo accesible para web_owner */}
            <Route path="admin" element={
              <RoleRoute role="web_owner">
                <AdminPage />
              </RoleRoute>
            } />
            
            {/* Página de Taller - Solo accesible para workshop_owner */}
            <Route path="taller" element={
              <RoleRoute role="workshop_owner">
                <TallerPage />
              </RoleRoute>
            } />
            
            {/* Página de Mecánico - Solo accesible para mechanic */}
            <Route path="mecanico" element={
              <RoleRoute role="mechanic">
                <MecanicoPage />
              </RoleRoute>
            } />
            
            {/* Página de Cliente - Solo accesible para client */}
            <Route path="cliente" element={
              <RoleRoute role="client">
                <ClientePage />
              </RoleRoute>
            } />
            
          </Route>

          {/* ============================================ */}
          {/* RUTA DE FALLBACK: 404 */}
          {/* ============================================ */}
          <Route path="*" element={<Navigate to="/" replace />} />
          
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

// Exporta el router para ser usado en App.tsx
export default AppRouter;