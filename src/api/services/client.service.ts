// src/api/services/client.service.ts

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { authService } from './auth.service';
import { vehicleService } from './vehicle.service';

// ============================================
// INTERFACES
// ============================================

export interface CreateClientData {
  cedula: string;
  nombre_completo: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export interface CreateClientWithVehicleData {
  // Datos del cliente
  cliente: CreateClientData;
  // Datos del vehículo
  vehiculo: {
    placa: string;
    marca: string;
    modelo: string;
    año: number;
    color?: string;
    vin?: string;
    kilometraje?: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ============================================
// SERVICIO DE CLIENTES
// ============================================

class ClientService {
  /**
   * Crear un nuevo cliente (solo cliente, sin vehículo)
   */
  async createClient(
    data: CreateClientData
  ): Promise<ApiResponse> {
    try {
      const { cedula, nombre_completo, email, password, phone, address } = data;

      // Verificar si el email ya existe
      const emailExists = await authService.emailExists(email);
      if (emailExists) {
        return {
          success: false,
          message: 'Este correo electrónico ya está registrado',
          error: 'EMAIL_EXISTS',
        };
      }

      // Crear usuario en Firebase Auth y Firestore
      const result = await authService.createUserAccount(email, password, {
        cedula,
        nombre_completo,
        email,
        role: 'client',
        phone,
        address,
      });

      if (!result.success) {
        return result;
      }

      console.log('✅ Cliente creado:', email);

      return {
        success: true,
        message: 'Cliente registrado exitosamente',
        data: result.data,
      };
    } catch (error: any) {
      console.error('❌ Error creando cliente:', error);
      return {
        success: false,
        message: 'Error al crear cliente',
        error: error.message || 'SERVER_ERROR',
      };
    }
  }

  /**
   * ✨ NUEVO: Crear cliente CON vehículo en una sola operación
   */
  async createClientWithVehicle(
    data: CreateClientWithVehicleData,
    workshopId: string,
    tallerOwnerId: string
  ): Promise<ApiResponse> {
    try {
      // 1. Crear el cliente primero
      const clientResult = await this.createClient(data.cliente);

      if (!clientResult.success || !clientResult.data) {
        return clientResult;
      }

      const clienteId = clientResult.data.id;

      // 2. Crear el vehículo asociado al cliente
      const vehicleResult = await vehicleService.createVehicle({
        ...data.vehiculo,
        clienteId,
        workshopId,
        tallerOwnerId,
      });

      if (!vehicleResult.success) {
        // Si falla el vehículo, consideramos que al menos el cliente se creó
        return {
          success: true,
          message: 'Cliente creado, pero hubo un error al crear el vehículo. Puede agregarlo manualmente.',
          data: {
            cliente: clientResult.data,
            vehiculo: null,
          },
        };
      }

      console.log('✅ Cliente y vehículo creados:', data.cliente.email);

      return {
        success: true,
        message: 'Cliente y vehículo registrados exitosamente',
        data: {
          cliente: clientResult.data,
          vehiculo: vehicleResult.data,
        },
      };
    } catch (error: any) {
      console.error('❌ Error creando cliente con vehículo:', error);
      return {
        success: false,
        message: 'Error al crear cliente y vehículo',
        error: error.message || 'SERVER_ERROR',
      };
    }
  }

  /**
   * Obtener todos los clientes
   */
  async getAllClients(): Promise<ApiResponse<any[]>> {
    try {
      const usersSnapshot = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'client'))
      );

      const clients: any[] = [];
      usersSnapshot.forEach((doc) => {
        clients.push({ id: doc.id, ...doc.data() });
      });

      return {
        success: true,
        message: 'Clientes obtenidos exitosamente',
        data: clients,
      };
    } catch (error) {
      console.error('❌ Error obteniendo clientes:', error);
      return {
        success: false,
        message: 'Error al obtener clientes',
        data: [],
      };
    }
  }

  /**
   * Obtener un cliente por ID
   */
  async getClientById(clientId: string): Promise<ApiResponse> {
    try {
      const clientDoc = await getDoc(doc(db, 'users', clientId));

      if (!clientDoc.exists() || clientDoc.data()?.role !== 'client') {
        return {
          success: false,
          message: 'Cliente no encontrado',
        };
      }

      return {
        success: true,
        message: 'Cliente encontrado',
        data: { id: clientDoc.id, ...clientDoc.data() },
      };
    } catch (error) {
      console.error('❌ Error obteniendo cliente:', error);
      return {
        success: false,
        message: 'Error al obtener cliente',
      };
    }
  }

  /**
   * Actualizar información del cliente
   */
  async updateClient(clientId: string, data: any): Promise<ApiResponse> {
    try {
      await updateDoc(doc(db, 'users', clientId), {
        ...data,
        updatedAt: new Date().toISOString(),
      });

      console.log('✅ Cliente actualizado:', clientId);

      return {
        success: true,
        message: 'Cliente actualizado exitosamente',
      };
    } catch (error) {
      console.error('❌ Error actualizando cliente:', error);
      return {
        success: false,
        message: 'Error al actualizar cliente',
      };
    }
  }

  /**
   * Eliminar un cliente
   */
  async deleteClient(clientId: string): Promise<ApiResponse> {
    try {
      // Verificar si el cliente tiene vehículos
      const vehiclesResult = await vehicleService.getVehiclesByClient(clientId);
      
      if (vehiclesResult.success && vehiclesResult.data && vehiclesResult.data.length > 0) {
        return {
          success: false,
          message: 'No se puede eliminar el cliente porque tiene vehículos registrados',
          error: 'HAS_VEHICLES',
        };
      }

      await deleteDoc(doc(db, 'users', clientId));

      console.log('✅ Cliente eliminado:', clientId);

      return {
        success: true,
        message: 'Cliente eliminado exitosamente',
      };
    } catch (error) {
      console.error('❌ Error eliminando cliente:', error);
      return {
        success: false,
        message: 'Error al eliminar cliente',
      };
    }
  }
}

export const clientService = new ClientService();