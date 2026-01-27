// src/api/services/mechanic.service.ts

export interface CreateMechanicData {
  cedula: string;
  nombre_completo: string;
  email: string;
  password: string;
  phone?: string;
  specialty?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

const API_URL = '/api';

class MechanicService {
  /**
   * Crea un nuevo mecánico vinculado al taller del dueño
   */
  async createMechanic(
    workshopId: string,
    data: CreateMechanicData
  ): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_URL}/mechanics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          workshopId, // Vincula automáticamente al taller
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Error al crear el mecánico',
          error: result.error,
        };
      }

      console.log('✅ Mecánico creado exitosamente');

      return result;
    } catch (error) {
      console.error('Error en createMechanic:', error);
      return {
        success: false,
        message: 'Error de conexión. Asegúrate de que el backend esté corriendo.',
        error: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Obtiene todos los mecánicos de un taller específico
   */
  async getMechanicsByWorkshop(workshopId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${API_URL}/mechanics?workshopId=${workshopId}`);

      if (!response.ok) {
        throw new Error('Error al obtener mecánicos');
      }

      const mechanics = await response.json();

      return {
        success: true,
        message: 'Mecánicos obtenidos exitosamente',
        data: mechanics,
      };
    } catch (error) {
      console.error('Error en getMechanicsByWorkshop:', error);
      return {
        success: false,
        message: 'Error al obtener mecánicos',
        data: [],
      };
    }
  }

  /**
   * Elimina un mecánico del taller
   */
  async deleteMechanic(mechanicId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_URL}/mechanics/${mechanicId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Error al eliminar el mecánico',
        };
      }

      return {
        success: true,
        message: 'Mecánico eliminado exitosamente',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al eliminar el mecánico',
      };
    }
  }
}

export const mechanicService = new MechanicService();