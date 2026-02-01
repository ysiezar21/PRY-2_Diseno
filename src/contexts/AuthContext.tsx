// src/contexts/AuthContext.tsx

// ============================================
// CONTEXTO DE AUTENTICACIÓN
// ============================================
// Este archivo maneja el estado global de autenticación en toda la aplicación.
// Permite que cualquier componente acceda a la información del usuario logueado
// y a las funciones de login/logout sin necesidad de pasar props manualmente.

import { createContext, useContext, type ReactNode } from 'react';
import { useAuth as useCustomAuth } from '../hooks/useAuth';
import type { User } from '../api/services/auth.service';

// ============================================
// INTERFACE: Tipo del Contexto de Autenticación
// ============================================
// Define todos los valores y funciones que estarán disponibles
// a través del contexto en cualquier parte de la aplicación
interface AuthContextType {
  // Usuario actualmente logueado (sin incluir la contraseña por seguridad)
  // Es null cuando no hay ningún usuario autenticado
  user: Omit<User, 'password'> | null;
  
  // Indica si se está cargando información de autenticación
  // Útil para mostrar spinners o estados de carga
  loading: boolean;
  
  // Mensaje de error si ocurre algún problema en login/logout
  // Es null cuando no hay errores
  error: string | null;
  
  // Función para iniciar sesión con email y contraseña
  // Retorna una promesa con la respuesta del servidor
  login: (email: string, password: string) => Promise<any>;
  
  // Función para cerrar sesión y limpiar el estado del usuario
  logout: () => void;
  
  // Función para limpiar mensajes de error manualmente
  // Útil cuando el usuario cierra una alerta de error
  clearError: () => void;
  
  // Booleano que indica si hay un usuario autenticado actualmente
  // true = usuario logueado, false = no hay sesión activa
  isAuthenticated: boolean;
}

// ============================================
// CREACIÓN DEL CONTEXTO
// ============================================
// Crea el contexto de autenticación con valor inicial undefined
// Este contexto será llenado por el AuthProvider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// HOOK: useAuthContext
// ============================================
// Hook personalizado para acceder al contexto de autenticación
// Incluye validación para asegurar que se use dentro de un AuthProvider
export const useAuthContext = () => {
  // Obtiene el valor actual del contexto
  const context = useContext(AuthContext);
  
  // Si el contexto es undefined, significa que el hook se está usando
  // fuera del AuthProvider, lo cual es un error de implementación
  if (!context) {
    throw new Error('useAuthContext debe usarse dentro de AuthProvider');
  }
  
  // Retorna el contexto con todos los valores y funciones de autenticación
  return context;
};

// ============================================
// ALIAS DEL HOOK
// ============================================
// Alias más corto y conveniente para usar el hook de autenticación
// Permite importar como: import { useAuth } from './contexts/AuthContext'
export const useAuth = useAuthContext;

// ============================================
// INTERFACE: Props del Provider
// ============================================
// Define que el AuthProvider debe recibir componentes hijos para envolver
interface AuthProviderProps {
  // Componentes que estarán dentro del provider y tendrán acceso al contexto
  children: ReactNode;
}

// ============================================
// COMPONENTE: AuthProvider
// ============================================
// Provider que envuelve la aplicación y proporciona el contexto de autenticación
// a todos sus componentes hijos
export const AuthProvider = ({ children }: AuthProviderProps) => {
  
  // Utiliza el hook personalizado useCustomAuth que contiene toda la lógica
  // de autenticación (login, logout, manejo de estado, etc.)
  const auth = useCustomAuth();

  return (
    // Proveedor del contexto que hace disponibles los valores de 'auth'
    // a todos los componentes hijos que usen useAuth() o useAuthContext()
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};