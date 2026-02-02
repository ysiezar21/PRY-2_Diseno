// src/api/services/vehicle.service.ts

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';

// ============================================
// INTERFACES
// ============================================

export interface Vehicle {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  año: number;
  color?: string;
  clienteId: string;
  workshopId?: string;
  tallerOwnerId?: string;
  // Estado de flujo del vehículo dentro del taller
  estadoProceso?: 'pendiente_valoracion' | 'en_valoracion' | 'pendiente_cotizacion' | 'pendiente_aprobacion_cotizacion' | 'aprobado' | 'en_reparacion' | 'finalizado';
  descripcionSolicitud?: string;
  trabajos: Trabajo[];
  createdAt: string;
  updatedAt?: string;
}

export interface Trabajo {
  id: string;
  fecha: string;
  mecanicoId: string;
  descripcion: string;
  costo: number;
  reparaciones: string[];
}

export interface CreateVehicleData {
  placa: string;
  marca: string;
  modelo: string;
  año: number;
  color?: string;
  clienteId: string;
  workshopId?: string;
  tallerOwnerId?: string;
  descripcionSolicitud?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ============================================
// SERVICIO DE VEHÍCULOS
// ============================================

class VehicleService {
  /**
   * Crea un nuevo vehículo para un cliente
   */
  async createVehicle(data: CreateVehicleData): Promise<ApiResponse<Vehicle>> {
    try {
      const { placa, marca, modelo, año, color, clienteId, workshopId, tallerOwnerId, descripcionSolicitud } = data;

      // 1. Validar campos requeridos
      if (!placa || !marca || !modelo || !año || !clienteId) {
        return {
          success: false,
          message: 'Faltan campos requeridos',
          error: 'MISSING_FIELDS',
        };
      }

      // 2. Verificar que la placa no esté en uso
      const vehiclesQuery = query(
        collection(db, 'vehicles'),
        where('placa', '==', placa)
      );
      const placaSnapshot = await getDocs(vehiclesQuery);

      if (!placaSnapshot.empty) {
        return {
          success: false,
          message: 'Ya existe un vehículo con esa placa',
          error: 'DUPLICATE_PLACA',
        };
      }

      // 3. Verificar que el cliente existe
      const clientDoc = await getDoc(doc(db, 'users', clienteId));
      
      if (!clientDoc.exists() || clientDoc.data()?.role !== 'client') {
        return {
          success: false,
          message: 'Cliente no encontrado',
          error: 'CLIENT_NOT_FOUND',
        };
      }

      // 4. Crear el documento del vehículo en Firestore
      const vehicleRef = doc(collection(db, 'vehicles'));
      const vehicleId = vehicleRef.id;

      const now = new Date().toISOString();

      // Firestore no acepta valores `undefined`. Construir el objeto
      // incluyendo solamente campos opcionales cuando vengan definidos.
      const newVehicle: Vehicle = {
        id: vehicleId,
        placa,
        marca,
        modelo,
        año: parseInt(año.toString()),
        clienteId,
        estadoProceso: 'pendiente_valoracion',
        // Firestore no acepta `undefined`; guardar siempre string (vacío si no viene).
        descripcionSolicitud: (descripcionSolicitud ?? ''),
        trabajos: [],
        createdAt: now,
        updatedAt: now,
      };

      if (color !== undefined) newVehicle.color = color;
      if (workshopId !== undefined) newVehicle.workshopId = workshopId;
      if (tallerOwnerId !== undefined) newVehicle.tallerOwnerId = tallerOwnerId;

      await setDoc(vehicleRef, newVehicle);

      console.log('✅ Vehículo creado en Firebase:', newVehicle.placa);

      return {
        success: true,
        message: 'Vehículo creado exitosamente',
        data: newVehicle,
      };
    } catch (error: any) {
      console.error('❌ Error creando vehículo:', error);
      return {
        success: false,
        message: 'Error de conexión',
        error: error.message || 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Obtiene todos los vehículos (opcionalmente filtrados por cliente)
   */
  async getVehicles(clienteId?: string): Promise<ApiResponse<Vehicle[]>> {
    try {
      let vehiclesQuery;

      if (clienteId) {
        vehiclesQuery = query(
          collection(db, 'vehicles'),
          where('clienteId', '==', clienteId)
        );
      } else {
        vehiclesQuery = collection(db, 'vehicles');
      }

      const vehiclesSnapshot = await getDocs(vehiclesQuery);
      const vehicles: Vehicle[] = [];

      vehiclesSnapshot.forEach((doc) => {
        vehicles.push({ id: doc.id, ...doc.data() } as Vehicle);
      });

      return {
        success: true,
        message: 'Vehículos obtenidos exitosamente',
        data: vehicles,
      };
    } catch (error) {
      console.error('❌ Error obteniendo vehículos:', error);
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
  async getVehiclesByClient(clienteId: string): Promise<ApiResponse<Vehicle[]>> {
    return this.getVehicles(clienteId);
  }

  /**
   * Obtiene un vehículo por ID
   */
  async getVehicleById(vehicleId: string): Promise<ApiResponse<Vehicle>> {
    try {
      const vehicleDoc = await getDoc(doc(db, 'vehicles', vehicleId));

      if (!vehicleDoc.exists()) {
        return {
          success: false,
          message: 'Vehículo no encontrado',
        };
      }

      const vehicle = { id: vehicleDoc.id, ...vehicleDoc.data() } as Vehicle;

      return {
        success: true,
        message: 'Vehículo encontrado',
        data: vehicle,
      };
    } catch (error) {
      console.error('❌ Error obteniendo vehículo:', error);
      return {
        success: false,
        message: 'Error al obtener vehículo',
      };
    }
  }

  /**
   * Elimina un vehículo
   */
  async deleteVehicle(vehicleId: string): Promise<ApiResponse> {
    try {
      const vehicleDoc = await getDoc(doc(db, 'vehicles', vehicleId));

      if (!vehicleDoc.exists()) {
        return {
          success: false,
          message: 'Vehículo no encontrado',
        };
      }

      const vehicleData = vehicleDoc.data();

      await deleteDoc(doc(db, 'vehicles', vehicleId));

      console.log('✅ Vehículo eliminado:', vehicleData?.placa);

      return {
        success: true,
        message: 'Vehículo eliminado exitosamente',
      };
    } catch (error) {
      console.error('❌ Error eliminando vehículo:', error);
      return {
        success: false,
        message: 'Error al eliminar vehículo',
      };
    }
  }
}

export const vehicleService = new VehicleService();