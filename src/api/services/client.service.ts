// src/api/services/client.service.ts

import {
  collection,
  doc,
  getDocs,
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

// ============================================
// SERVICIO DE CLIENTES
// ============================================

class ClientService {
  /**
   * Crea un nuevo cliente (con o sin vehículo)
   */
  async createClient(data: CreateClientWithVehicleData): Promise<ApiResponse<any>> {
    try {
      const { cedula, nombre_completo, email, password, phone, address, vehiculo } = data;

      // 1. Validar campos requeridos
      if (!cedula || !nombre_completo || !email || !password) {
        return {
          success: false,
          message: 'Faltan campos requeridos del cliente',
          error: 'MISSING_FIELDS',
        };
      }

      // 2. Verificar que el email no esté en uso
      const emailExists = await authService.emailExists(email);
      if (emailExists) {
        return {
          success: false,
          message: 'Ya existe un usuario con ese correo electrónico',
          error: 'DUPLICATE_EMAIL',
        };
      }

      // 3. Crear el usuario cliente en Firebase Auth y Firestore
      const userResult = await authService.createUserAccount(email, password, {
        cedula,
        nombre_completo,
        email,
        role: 'client',
        phone,
        address,
      });

      if (!userResult.success || !userResult.data) {
        return {
          success: false,
          message: userResult.message,
          error: userResult.error,
        };
      }

      const newClient = userResult.data;

      console.log('✅ Cliente creado en Firebase:', newClient.nombre_completo);

      let newVehicle = null;

      // 4. Si se proporcionó información del vehículo, crearlo
      if (vehiculo && vehiculo.placa && vehiculo.marca && vehiculo.modelo) {
        const vehicleResult = await vehicleService.createVehicle({
          ...vehiculo,
          clienteId: newClient.id,
        });

        if (vehicleResult.success && vehicleResult.data) {
          newVehicle = vehicleResult.data;
          console.log('✅ Vehículo también creado:', newVehicle.placa);
        }
      }

      return {
        success: true,
        message: newVehicle
          ? 'Cliente y vehículo creados exitosamente'
          : 'Cliente creado exitosamente',
        data: {
          client: newClient,
          vehicle: newVehicle,
        },
      };
    } catch (error: any) {
      console.error('❌ Error creando cliente:', error);
      return {
        success: false,
        message: 'Error de conexión',
        error: error.message || 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Obtiene todos los clientes
   */
  async getAllClients(): Promise<ApiResponse<any[]>> {
    try {
      const clientsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'client')
      );

      const clientsSnapshot = await getDocs(clientsQuery);
      const clients: any[] = [];

      clientsSnapshot.forEach((doc) => {
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
   * Elimina un cliente
   */
  async deleteClient(clientId: string): Promise<ApiResponse> {
    try {
      // Verificar que el usuario existe y es cliente
      const clientDoc = await doc(db, 'users', clientId);
      const clientSnapshot = await clientDoc.get();

      if (!clientSnapshot.exists()) {
        return {
          success: false,
          message: 'Cliente no encontrado',
        };
      }

      const clientData = clientSnapshot.data();

      if (clientData?.role !== 'client') {
        return {
          success: false,
          message: 'El usuario no es un cliente',
        };
      }

      // Eliminar el documento del cliente
      await deleteDoc(doc(db, 'users', clientId));

      console.log('✅ Cliente eliminado:', clientData.nombre_completo);

      // Nota: Podrías también eliminar los vehículos del cliente aquí si lo deseas
      // const vehiclesQuery = query(collection(db, 'vehicles'), where('clienteId', '==', clientId));
      // const vehiclesSnapshot = await getDocs(vehiclesQuery);
      // vehiclesSnapshot.forEach(async (doc) => {
      //   await deleteDoc(doc.ref);
      // });

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