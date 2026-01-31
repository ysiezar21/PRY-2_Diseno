// src/api/services/workshop.service.ts

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { authService } from './auth.service';

// ============================================
// INTERFACES
// ============================================

export interface Workshop {
  id: string;
  nombre: string;
  cedulaDueno: string;
  nombreDueno: string;
  email: string;
  createdAt: string;
  phone?: string;
  address?: string;
  trabajos: any[];
}

export interface CreateWorkshopData {
  nombre: string;
  cedulaDueno: string;
  nombreDueno: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ============================================
// SERVICIO DE TALLERES
// ============================================

class WorkshopService {
  /**
   * Crea un nuevo taller junto con su usuario dueño
   */
  async createWorkshop(data: CreateWorkshopData): Promise<ApiResponse<any>> {
    try {
      const { nombre, cedulaDueno, nombreDueno, email, password, phone, address } = data;

      // 1. Validar campos requeridos
      if (!nombre || !cedulaDueno || !nombreDueno || !email || !password) {
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
          message: 'Ya existe un taller o usuario con ese correo electrónico',
          error: 'DUPLICATE_EMAIL',
        };
      }

      // 3. Crear el usuario dueño del taller en Firebase Auth y Firestore
      const userResult = await authService.createUserAccount(email, password, {
        cedula: cedulaDueno,
        nombre_completo: nombreDueno,
        email,
        role: 'workshop_owner',
        phone,
        address,
        workshopId: '', // Se actualizará después
      });

      if (!userResult.success || !userResult.data) {
        return {
          success: false,
          message: userResult.message,
          error: userResult.error,
        };
      }

      const newUser = userResult.data;

      // 4. Crear el documento del taller en Firestore
      const workshopRef = doc(collection(db, 'workshops'));
      const workshopId = workshopRef.id;

      const newWorkshop: Workshop = {
        id: workshopId,
        nombre,
        cedulaDueno,
        nombreDueno,
        email,
        createdAt: new Date().toISOString(),
        phone,
        address,
        trabajos: [],
      };

      await setDoc(workshopRef, newWorkshop);

      // 5. Actualizar el usuario con el workshopId
      await updateDoc(doc(db, 'users', newUser.id), {
        workshopId: workshopId,
      });

      // 6. Agregar el taller al web_owner (si existe)
      const webOwnersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'web_owner')
      );
      const webOwnersSnapshot = await getDocs(webOwnersQuery);

      if (!webOwnersSnapshot.empty) {
        const webOwnerDoc = webOwnersSnapshot.docs[0];
        await updateDoc(webOwnerDoc.ref, {
          workshopsId: arrayUnion(workshopId),
        });
      }

      console.log('✅ Taller y usuario creados en Firebase');
      console.log('   📁 Taller:', newWorkshop.nombre);
      console.log('   👤 Usuario:', newUser.nombre_completo);

      return {
        success: true,
        message: 'Taller y usuario creados exitosamente',
        data: {
          workshop: newWorkshop,
          user: newUser,
        },
      };
    } catch (error: any) {
      console.error('❌ Error creando taller:', error);
      return {
        success: false,
        message: 'Error en el servidor',
        error: error.message || 'SERVER_ERROR',
      };
    }
  }

  /**
   * Obtiene todos los talleres
   */
  async getAllWorkshops(): Promise<ApiResponse<Workshop[]>> {
    try {
      const workshopsSnapshot = await getDocs(collection(db, 'workshops'));
      const workshops: Workshop[] = [];

      workshopsSnapshot.forEach((doc) => {
        workshops.push({ id: doc.id, ...doc.data() } as Workshop);
      });

      return {
        success: true,
        message: 'Talleres obtenidos exitosamente',
        data: workshops,
      };
    } catch (error) {
      console.error('❌ Error obteniendo talleres:', error);
      return {
        success: false,
        message: 'Error al obtener talleres',
        data: [],
      };
    }
  }

  /**
   * Obtiene un taller por ID
   */
  async getWorkshopById(id: string): Promise<ApiResponse<Workshop>> {
    try {
      const workshopDoc = await getDoc(doc(db, 'workshops', id));

      if (!workshopDoc.exists()) {
        return {
          success: false,
          message: 'Taller no encontrado',
        };
      }

      const workshop = { id: workshopDoc.id, ...workshopDoc.data() } as Workshop;

      return {
        success: true,
        message: 'Taller encontrado',
        data: workshop,
      };
    } catch (error) {
      console.error('❌ Error obteniendo taller:', error);
      return {
        success: false,
        message: 'Error al buscar taller',
      };
    }
  }

  /**
   * Elimina un taller (y opcionalmente su dueño)
   */
  async deleteWorkshop(workshopId: string): Promise<ApiResponse> {
    try {
      // 1. Eliminar el documento del taller
      await deleteDoc(doc(db, 'workshops', workshopId));

      console.log('✅ Taller eliminado:', workshopId);

      return {
        success: true,
        message: 'Taller eliminado exitosamente',
      };
    } catch (error) {
      console.error('❌ Error eliminando taller:', error);
      return {
        success: false,
        message: 'Error al eliminar taller',
      };
    }
  }

  /**
   * Actualiza información del taller
   */
  async updateWorkshop(
    workshopId: string,
    data: Partial<Omit<Workshop, 'id' | 'createdAt'>>
  ): Promise<ApiResponse> {
    try {
      await updateDoc(doc(db, 'workshops', workshopId), data);

      console.log('✅ Taller actualizado:', workshopId);

      return {
        success: true,
        message: 'Taller actualizado exitosamente',
      };
    } catch (error) {
      console.error('❌ Error actualizando taller:', error);
      return {
        success: false,
        message: 'Error al actualizar taller',
      };
    }
  }
}

export const workshopService = new WorkshopService();