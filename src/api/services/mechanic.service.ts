// src/api/services/mechanic.service.ts

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

// ============================================
// INTERFACES
// ============================================

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

// ============================================
// SERVICIO DE MECÁNICOS
// ============================================

class MechanicService {
  /**
   * Crea un nuevo mecánico vinculado a un taller
   */
  async createMechanic(
    workshopId: string,
    data: CreateMechanicData
  ): Promise<ApiResponse<any>> {
    try {
      const { cedula, nombre_completo, email, password, phone, specialty } = data;

      // 1. Validar campos requeridos
      if (!cedula || !nombre_completo || !email || !password || !workshopId) {
        return {
          success: false,
          message: 'Faltan campos requeridos',
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

      // 3. Verificar que el taller existe
      const workshopDoc = await doc(db, 'workshops', workshopId);
      const workshopSnapshot = await workshopDoc.get();
      
      if (!workshopSnapshot.exists()) {
        return {
          success: false,
          message: 'Taller no encontrado',
          error: 'WORKSHOP_NOT_FOUND',
        };
      }

      // 4. Crear el usuario mecánico en Firebase Auth y Firestore
      const userResult = await authService.createUserAccount(email, password, {
        cedula,
        nombre_completo,
        email,
        role: 'mechanic',
        phone,
        specialty,
        workshopId,
      });

      if (!userResult.success || !userResult.data) {
        return {
          success: false,
          message: userResult.message,
          error: userResult.error,
        };
      }

      console.log('✅ Mecánico creado en Firebase:', userResult.data.nombre_completo);

      return {
        success: true,
        message: 'Mecánico creado exitosamente',
        data: userResult.data,
      };
    } catch (error: any) {
      console.error('❌ Error creando mecánico:', error);
      return {
        success: false,
        message: 'Error de conexión',
        error: error.message || 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Obtiene todos los mecánicos de un taller específico
   */
  async getMechanicsByWorkshop(workshopId: string): Promise<ApiResponse<any[]>> {
    try {
      const mechanicsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'mechanic'),
        where('workshopId', '==', workshopId)
      );

      const mechanicsSnapshot = await getDocs(mechanicsQuery);
      const mechanics: any[] = [];

      mechanicsSnapshot.forEach((doc) => {
        mechanics.push({ id: doc.id, ...doc.data() });
      });

      return {
        success: true,
        message: 'Mecánicos obtenidos exitosamente',
        data: mechanics,
      };
    } catch (error) {
      console.error('❌ Error obteniendo mecánicos:', error);
      return {
        success: false,
        message: 'Error al obtener mecánicos',
        data: [],
      };
    }
  }

  /**
   * Obtiene todos los mecánicos (sin filtro de taller)
   */
  async getAllMechanics(): Promise<ApiResponse<any[]>> {
    try {
      const mechanicsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'mechanic')
      );

      const mechanicsSnapshot = await getDocs(mechanicsQuery);
      const mechanics: any[] = [];

      mechanicsSnapshot.forEach((doc) => {
        mechanics.push({ id: doc.id, ...doc.data() });
      });

      return {
        success: true,
        message: 'Mecánicos obtenidos exitosamente',
        data: mechanics,
      };
    } catch (error) {
      console.error('❌ Error obteniendo mecánicos:', error);
      return {
        success: false,
        message: 'Error al obtener mecánicos',
        data: [],
      };
    }
  }

  /**
   * Elimina un mecánico
   */
  async deleteMechanic(mechanicId: string): Promise<ApiResponse> {
    try {
      // Verificar que el usuario existe y es mecánico
      const mechanicDoc = await doc(db, 'users', mechanicId);
      const mechanicSnapshot = await mechanicDoc.get();

      if (!mechanicSnapshot.exists()) {
        return {
          success: false,
          message: 'Mecánico no encontrado',
        };
      }

      const mechanicData = mechanicSnapshot.data();
      
      if (mechanicData?.role !== 'mechanic') {
        return {
          success: false,
          message: 'El usuario no es un mecánico',
        };
      }

      // Eliminar el documento del mecánico
      await deleteDoc(doc(db, 'users', mechanicId));

      console.log('✅ Mecánico eliminado:', mechanicData.nombre_completo);

      return {
        success: true,
        message: 'Mecánico eliminado exitosamente',
      };
    } catch (error) {
      console.error('❌ Error eliminando mecánico:', error);
      return {
        success: false,
        message: 'Error al eliminar mecánico',
      };
    }
  }
}

export const mechanicService = new MechanicService();