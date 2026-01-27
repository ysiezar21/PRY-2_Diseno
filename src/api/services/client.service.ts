// src/api/services/client.service.ts

export interface CreateClientData {
  cedula: string;
  nombre_completo: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export interface CreateVehicleData {
  placa: string;
  marca: string;
  modelo: string;
  año: number;
  color?: string;
  clienteId?: string;
}

export interface CreateClientWithVehicleData {
  // Datos del cliente
  cedula: string;
  nombre_completo: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  // Datos del vehículo (opcionales)
  vehiculo?: {
    placa: string;
    marca: string;
    modelo: string;
    año: number;
    color?: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

const API_URL = '/api';

class ClientService {
  /**
   * Crea un nuevo cliente (con o sin vehículo)
   */
  async createClient(data: CreateClientWithVehicleData): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_URL}/clients`, {
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
          message: result.message || 'Error al crear el cliente',
          error: result.error,
        };
      }

      console.log('✅ Cliente creado exitosamente');
      if (data.vehiculo) {
        console.log('✅ Vehículo también creado');
      }

      return result;
    } catch (error) {
      console.error('Error en createClient:', error);
      return {
        success: false,
        message: 'Error de conexión. Asegúrate de que el backend esté corriendo.',
        error: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Obtiene todos los clientes
   */
  async getAllClients(): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${API_URL}/clients`);

      if (!response.ok) {
        throw new Error('Error al obtener clientes');
      }

      const clients = await response.json();

      return {
        success: true,
        message: 'Clientes obtenidos exitosamente',
        data: clients,
      };
    } catch (error) {
      console.error('Error en getAllClients:', error);
      return {
        success: false,
        message: 'Error al obtener clientes',
        data: [],
      };
    }
  }

  /**
   * Elimina un cliente
   */
  async deleteClient(clientId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_URL}/clients/${clientId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Error al eliminar el cliente',
        };
      }

      return {
        success: true,
        message: 'Cliente eliminado exitosamente',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al eliminar el cliente',
      };
    }
  }
}

export const clientService = new ClientService();