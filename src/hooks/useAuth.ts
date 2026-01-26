import { useState, useEffect, useCallback } from 'react';
import { authService } from '../api/services/auth.service';
import type { User, RegisterData, ApiResponse } from '../api/services/auth.service';

export const useAuth = () => {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar usuario del localStorage al iniciar
  useEffect(() => {
    
    const currentUser = authService.getCurrentUser();
    
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<ApiResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.login({ email, password });
      
      
      if (result.success && result.data) {
        
        setUser(result.data.user);
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