// src/api/services/vehicle.service.ts

export interface CreateVehicleData {
  placa: string;
  marca: string;
  modelo: string;
  año: number;
  color?: string;
  clienteId: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

const API_URL = '/api';

class VehicleService {
  /**
   * Crea un nuevo vehículo para un cliente
   */
  async createVehicle(data: CreateVehicleData): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_URL}/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Error al crear el vehículo',
          error: result.error,
        };
      }

      console.log('✅ Vehículo creado exitosamente');

      return result;
    } catch (error) {
      console.error('Error en createVehicle:', error);
      return {
        success: false,
        message: 'Error de conexión. Asegúrate de que el backend esté corriendo.',
        error: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Obtiene todos los vehículos (opcionalmente filtrados por cliente)
   */
  async getVehicles(clienteId?: string): Promise<ApiResponse<any[]>> {
    try {
      const url = clienteId 
        ? `${API_URL}/vehicles?clienteId=${clienteId}`
        : `${API_URL}/vehicles`;
        
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error al obtener vehículos');
      }

      const vehicles = await response.json();

      return {
        success: true,
        message: 'Vehículos obtenidos exitosamente',
        data: vehicles,
      };
    } catch (error) {
      console.error('Error en getVehicles:', error);
      return {
        success: false,
        message: 'Error al obtener vehículos',
        data: [],
      };
    }
  }

  /**
   * Obtiene vehículos de un cliente específico
   */
  async getVehiclesByClient(clienteId: string): Promise<ApiResponse<any[]>> {
    return this.getVehicles(clienteId);
  }

  /**
   * Elimina un vehículo
   */
  async deleteVehicle(vehicleId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Error al eliminar el vehículo',
        };
      }

      return {
        success: true,
        message: 'Vehículo eliminado exitosamente',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al eliminar el vehículo',
      };
    }
  }
}

export const vehicleService = new VehicleService();