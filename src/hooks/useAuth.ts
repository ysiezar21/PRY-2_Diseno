// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { authService } from '../api/services/auth.service';
import type { User, RegisterData, ApiResponse } from '../api/services/auth.service';

// Claves para localStorage
const STORAGE_KEYS = {
  USER: 'taller_app_user',
  TOKEN: 'taller_app_token',
  TIMESTAMP: 'taller_app_timestamp'
};

// Tiempo de expiración de la sesión (24 horas en milisegundos)
const SESSION_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

export const useAuth = () => {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [loading, setLoading] = useState(true); // Cambiado a true inicialmente
  const [error, setError] = useState<string | null>(null);

  // Función para guardar sesión en localStorage
  const saveSessionToStorage = (userData: Omit<User, 'password'> | null) => {
    if (userData) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
    } else {
      clearSessionFromStorage();
    }
  };

  // Función para limpiar sesión de localStorage
  const clearSessionFromStorage = () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TIMESTAMP);
  };

  // Función para verificar si la sesión ha expirado
  const isSessionExpired = (): boolean => {
    const timestamp = localStorage.getItem(STORAGE_KEYS.TIMESTAMP);
    if (!timestamp) return true;
    
    const sessionTime = parseInt(timestamp, 10);
    const currentTime = Date.now();
    
    return (currentTime - sessionTime) > SESSION_EXPIRATION_TIME;
  };

  // Función para restaurar sesión desde localStorage
  const restoreSessionFromStorage = () => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      
      if (savedUser && !isSessionExpired()) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        return true;
      } else {
        // Sesión expirada o no existe
        clearSessionFromStorage();
        return false;
      }
    } catch (error) {
      console.error('Error al restaurar sesión:', error);
      clearSessionFromStorage();
      return false;
    }
  };

  // Cargar usuario del localStorage al iniciar
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        // 1. Intentar restaurar desde localStorage
        const hasValidSession = restoreSessionFromStorage();
        
        // 2. Si hay sesión válida, verificar con el servidor (opcional)
        if (hasValidSession && user) {
          // Aquí podrías hacer una llamada al backend para validar el token
          // const isValid = await authService.validateSession();
          // if (!isValid) {
          //   clearSessionFromStorage();
          //   setUser(null);
          // }
        }
        
        // 3. También verificar si authService tiene usuario actual
        const currentUser = authService.getCurrentUser();
        if (currentUser && !user) {
          setUser(currentUser);
          saveSessionToStorage(currentUser);
        }
      } catch (error) {
        console.error('Error inicializando autenticación:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<ApiResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.login({ email, password });
      
      if (result.success && result.data) {
        // Guardar usuario en estado
        setUser(result.data.user);
        
        // Guardar en localStorage
        saveSessionToStorage(result.data.user);
        
        // Si hay token, guardarlo también
        if (result.data.token) {
          localStorage.setItem(STORAGE_KEYS.TOKEN, result.data.token);
        }
      } else {
        setError(result.message);
      }
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error en el servidor';
      setError(errorMsg);
      return {
        success: false,
        message: errorMsg
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<ApiResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.register(data);
      
      if (result.success && result.data) {
        setUser(result.data);
        saveSessionToStorage(result.data);
      } else {
        setError(result.message);
      }
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error en el servidor';
      setError(errorMsg);
      return {
        success: false,
        message: errorMsg
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setError(null);
    clearSessionFromStorage();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated: !!user
  };
};