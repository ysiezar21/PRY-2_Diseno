// src/api/services/valoracion.service.ts
// ACTUALIZACIÓN: Ahora crea OT automáticamente cuando cliente completa selección

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { ordenTrabajoService } from './ordenTrabajo.service';

// ... (mantener todas las interfaces existentes)

export interface RepuestoNecesario {
  nombre: string;
  cantidad: number;
  precio?: number;
}

export interface TareaValoracion {
  id: string;
  nombre: string;
  descripcion: string;
  precioEstimado: number;
  estado: 'propuesta' | 'aceptada' | 'rechazada';
  aceptadaPorCliente?: boolean;
  fechaRespuesta?: string;
  createdAt: string;
}

export interface Valoracion {
  id: string;
  vehiculoId: string;
  mecanicoId: string;
  tallerOwnerId: string;
  workshopId: string;
  fechaAsignacion: string;
  estado: 'pendiente' | 'en_proceso' | 'completada' | 'pendiente_aprobacion_cliente';
  diagnostico?: string;
  problemasEncontrados?: string[];
  repuestosNecesarios?: RepuestoNecesario[];
  horasEstimadas?: number;
  costoEstimado?: number;
  tareas: TareaValoracion[];
  estadoCliente?: 'pendiente_revision' | 'revisada' | 'parcialmente_aceptada' | 'totalmente_aceptada' | 'rechazada';
  fechaCompletada?: string;
  fechaRevisionCliente?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateValoracionData {
  vehiculoId: string;
  mecanicoId: string;
  tallerOwnerId: string;
  workshopId: string;
}

export interface UpdateValoracionData {
  estado?: 'pendiente' | 'en_proceso' | 'completada' | 'pendiente_aprobacion_cliente';
  diagnostico?: string;
  problemasEncontrados?: string[];
  repuestosNecesarios?: RepuestoNecesario[];
  horasEstimadas?: number;
  costoEstimado?: number;
}

export interface CreateTareaData {
  nombre: string;
  descripcion: string;
  precioEstimado: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

class ValoracionService {
  
  // ... (mantener todos los métodos existentes: createValoracion, addTarea, etc.)

  async createValoracion(data: CreateValoracionData): Promise<ApiResponse<Valoracion>> {
    try {
      const { vehiculoId, mecanicoId, tallerOwnerId, workshopId } = data;

      const vehicleDoc = await getDoc(doc(db, 'vehicles', vehiculoId));
      if (!vehicleDoc.exists()) {
        return {
          success: false,
          message: 'Vehículo no encontrado',
          error: 'VEHICLE_NOT_FOUND',
        };
      }

      const mechnicDoc = await getDoc(doc(db, 'users', mecanicoId));
      if (!mechnicDoc.exists() || mechnicDoc.data()?.role !== 'mechanic') {
        return {
          success: false,
          message: 'Mecánico no encontrado',
          error: 'MECHANIC_NOT_FOUND',
        };
      }

      const valoracionRef = doc(collection(db, 'valoraciones'));
      const valoracionId = valoracionRef.id;

      const newValoracion: Valoracion = {
        id: valoracionId,
        vehiculoId,
        mecanicoId,
        tallerOwnerId,
        workshopId,
        fechaAsignacion: new Date().toISOString(),
        estado: 'pendiente',
        tareas: [],
        estadoCliente: 'pendiente_revision',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(valoracionRef, newValoracion);

      console.log('✅ Valoración creada:', valoracionId);

      return {
        success: true,
        message: 'Valoración asignada exitosamente',
        data: newValoracion,
      };
    } catch (error: any) {
      console.error('❌ Error creando valoración:', error);
      return {
        success: false,
        message: 'Error al crear la valoración',
        error: error.message || 'SERVER_ERROR',
      };
    }
  }

  async addTarea(valoracionId: string, tareaData: CreateTareaData): Promise<ApiResponse> {
    try {
      const valoracionDoc = await getDoc(doc(db, 'valoraciones', valoracionId));

      if (!valoracionDoc.exists()) {
        return {
          success: false,
          message: 'Valoración no encontrada',
        };
      }

      const nuevaTarea: TareaValoracion = {
        id: `tarea_${Date.now()}`,
        nombre: tareaData.nombre,
        descripcion: tareaData.descripcion,
        precioEstimado: tareaData.precioEstimado,
        estado: 'propuesta',
        aceptadaPorCliente: false,
        createdAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'valoraciones', valoracionId), {
        tareas: arrayUnion(nuevaTarea),
        updatedAt: new Date().toISOString(),
      });

      console.log('✅ Tarea agregada a valoración:', valoracionId);

      return {
        success: true,
        message: 'Tarea agregada exitosamente',
        data: nuevaTarea,
      };
    } catch (error) {
      console.error('❌ Error agregando tarea:', error);
      return {
        success: false,
        message: 'Error al agregar tarea',
      };
    }
  }

  async removeTarea(valoracionId: string, tareaId: string): Promise<ApiResponse> {
    try {
      const valoracionDoc = await getDoc(doc(db, 'valoraciones', valoracionId));

      if (!valoracionDoc.exists()) {
        return {
          success: false,
          message: 'Valoración no encontrada',
        };
      }

      const valoracion = valoracionDoc.data() as Valoracion;
      const tareaToRemove = valoracion.tareas.find((t) => t.id === tareaId);

      if (!tareaToRemove) {
        return {
          success: false,
          message: 'Tarea no encontrada',
        };
      }

      await updateDoc(doc(db, 'valoraciones', valoracionId), {
        tareas: arrayRemove(tareaToRemove),
        updatedAt: new Date().toISOString(),
      });

      console.log('✅ Tarea eliminada de valoración:', valoracionId);

      return {
        success: true,
        message: 'Tarea eliminada exitosamente',
      };
    } catch (error) {
      console.error('❌ Error eliminando tarea:', error);
      return {
        success: false,
        message: 'Error al eliminar tarea',
      };
    }
  }

  async enviarACliente(valoracionId: string): Promise<ApiResponse> {
    try {
      const valoracionDoc = await getDoc(doc(db, 'valoraciones', valoracionId));

      if (!valoracionDoc.exists()) {
        return {
          success: false,
          message: 'Valoración no encontrada',
        };
      }

      const valoracion = valoracionDoc.data() as Valoracion;

      if (valoracion.tareas.length === 0) {
        return {
          success: false,
          message: 'Debe agregar al menos una tarea antes de enviar',
        };
      }

      await updateDoc(doc(db, 'valoraciones', valoracionId), {
        estado: 'pendiente_aprobacion_cliente',
        estadoCliente: 'pendiente_revision',
        updatedAt: new Date().toISOString(),
      });

      console.log('✅ Valoración enviada al cliente:', valoracionId);

      return {
        success: true,
        message: 'Valoración enviada al cliente para aprobación',
      };
    } catch (error) {
      console.error('❌ Error enviando valoración:', error);
      return {
        success: false,
        message: 'Error al enviar valoración',
      };
    }
  }

  /**
   * ⭐ ACTUALIZADO: Cliente acepta o rechaza tarea
   * Ahora crea OT AUTOMÁTICAMENTE cuando cliente responde la última tarea
   */
  async responderTarea(
    valoracionId: string,
    tareaId: string,
    aceptada: boolean
  ): Promise<ApiResponse> {
    try {
      const valoracionDoc = await getDoc(doc(db, 'valoraciones', valoracionId));

      if (!valoracionDoc.exists()) {
        return {
          success: false,
          message: 'Valoración no encontrada',
        };
      }

      const valoracion = valoracionDoc.data() as Valoracion;
      const tareaIndex = valoracion.tareas.findIndex((t) => t.id === tareaId);

      if (tareaIndex === -1) {
        return {
          success: false,
          message: 'Tarea no encontrada',
        };
      }

      // Actualizar tarea
      valoracion.tareas[tareaIndex] = {
        ...valoracion.tareas[tareaIndex],
        estado: aceptada ? 'aceptada' : 'rechazada',
        aceptadaPorCliente: aceptada,
        fechaRespuesta: new Date().toISOString(),
      };

      // Calcular estadísticas
      const tareasAceptadas = valoracion.tareas.filter((t) => t.estado === 'aceptada').length;
      const tareasRechazadas = valoracion.tareas.filter((t) => t.estado === 'rechazada').length;
      const tareasPendientes = valoracion.tareas.filter((t) => t.estado === 'propuesta').length;
      const totalTareas = valoracion.tareas.length;

      // Determinar estado
      let estadoCliente: Valoracion['estadoCliente'] = 'pendiente_revision';
      
      if (tareasPendientes === 0) {
        if (tareasAceptadas === totalTareas) {
          estadoCliente = 'totalmente_aceptada';
        } else if (tareasRechazadas === totalTareas) {
          estadoCliente = 'rechazada';
        } else if (tareasAceptadas > 0) {
          estadoCliente = 'parcialmente_aceptada';
        }
      } else {
        estadoCliente = 'revisada';
      }

      const updateData: any = {
        tareas: valoracion.tareas,
        estadoCliente,
        updatedAt: new Date().toISOString(),
      };

      if (tareasPendientes === 0) {
        updateData.fechaRevisionCliente = new Date().toISOString();
      }

      await updateDoc(doc(db, 'valoraciones', valoracionId), updateData);

      console.log('✅ Tarea respondida:', tareaId);
      console.log(`   Estado: ${estadoCliente}`);
      console.log(`   Aceptadas: ${tareasAceptadas}/${totalTareas}`);
      console.log(`   Pendientes: ${tareasPendientes}/${totalTareas}`);

      // ⭐ CREAR OT AUTOMÁTICAMENTE si se cumplen las condiciones
      let otCreated = false;
      let otMessage = '';
      
      if (tareasPendientes === 0 && tareasAceptadas > 0) {
        console.log('🤖 Cliente completó selección con tareas aceptadas - creando OT automática...');
        
        const otResult = await ordenTrabajoService.createOrdenAutomatica(valoracionId);
        
        if (otResult.success) {
          otCreated = true;
          otMessage = ` Se generó automáticamente la orden de trabajo ${otResult.data?.numeroOT}.`;
        } else {
          console.log('⚠️  No se pudo crear OT automática:', otResult.message);
        }
      }

      return {
        success: true,
        message: (aceptada ? 'Tarea aceptada' : 'Tarea rechazada') + otMessage,
        data: {
          estadoCliente,
          tareasAceptadas,
          tareasRechazadas,
          tareasPendientes,
          todasRespondidas: tareasPendientes === 0,
          otCreated, // ⭐ Indica si se creó OT
        },
      };
    } catch (error) {
      console.error('❌ Error respondiendo tarea:', error);
      return {
        success: false,
        message: 'Error al responder tarea',
      };
    }
  }

  // ... (mantener todos los métodos get existentes)

  async getValoracionesByMecanico(mecanicoId: string): Promise<ApiResponse<Valoracion[]>> {
    try {
      const q = query(
        collection(db, 'valoraciones'),
        where('mecanicoId', '==', mecanicoId)
      );

      const querySnapshot = await getDocs(q);
      const valoraciones: Valoracion[] = [];

      querySnapshot.forEach((doc) => {
        valoraciones.push({ id: doc.id, ...doc.data() } as Valoracion);
      });

      valoraciones.sort((a, b) => 
        new Date(b.fechaAsignacion).getTime() - new Date(a.fechaAsignacion).getTime()
      );

      return {
        success: true,
        message: 'Valoraciones obtenidas exitosamente',
        data: valoraciones,
      };
    } catch (error) {
      console.error('❌ Error obteniendo valoraciones:', error);
      return {
        success: false,
        message: 'Error al obtener valoraciones',
        data: [],
      };
    }
  }

  async getValoracionesByWorkshop(workshopId: string): Promise<ApiResponse<Valoracion[]>> {
    try {
      const q = query(
        collection(db, 'valoraciones'),
        where('workshopId', '==', workshopId)
      );

      const querySnapshot = await getDocs(q);
      const valoraciones: Valoracion[] = [];

      querySnapshot.forEach((doc) => {
        valoraciones.push({ id: doc.id, ...doc.data() } as Valoracion);
      });

      valoraciones.sort((a, b) => 
        new Date(b.fechaAsignacion).getTime() - new Date(a.fechaAsignacion).getTime()
      );

      return {
        success: true,
        message: 'Valoraciones obtenidas exitosamente',
        data: valoraciones,
      };
    } catch (error) {
      console.error('❌ Error obteniendo valoraciones:', error);
      return {
        success: false,
        message: 'Error al obtener valoraciones',
        data: [],
      };
    }
  }

  async getValoracionesByVehiculo(vehiculoId: string): Promise<ApiResponse<Valoracion[]>> {
    try {
      const q = query(
        collection(db, 'valoraciones'),
        where('vehiculoId', '==', vehiculoId)
      );

      const querySnapshot = await getDocs(q);
      const valoraciones: Valoracion[] = [];

      querySnapshot.forEach((doc) => {
        valoraciones.push({ id: doc.id, ...doc.data() } as Valoracion);
      });

      valoraciones.sort((a, b) => 
        new Date(b.fechaAsignacion).getTime() - new Date(a.fechaAsignacion).getTime()
      );

      return {
        success: true,
        message: 'Valoraciones obtenidas exitosamente',
        data: valoraciones,
      };
    } catch (error) {
      console.error('❌ Error obteniendo valoraciones:', error);
      return {
        success: false,
        message: 'Error al obtener valoraciones',
        data: [],
      };
    }
  }

  async getValoracionesByCliente(clienteId: string): Promise<ApiResponse<Valoracion[]>> {
    try {
      const vehiclesQuery = query(
        collection(db, 'vehicles'),
        where('clienteId', '==', clienteId)
      );
      const vehiclesSnapshot = await getDocs(vehiclesQuery);
      
      const vehicleIds = vehiclesSnapshot.docs.map(doc => doc.id);

      if (vehicleIds.length === 0) {
        return {
          success: true,
          message: 'No hay vehículos registrados',
          data: [],
        };
      }

      const valoraciones: Valoracion[] = [];
      
      for (const vehicleId of vehicleIds) {
        const q = query(
          collection(db, 'valoraciones'),
          where('vehiculoId', '==', vehicleId)
        );
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
          valoraciones.push({ id: doc.id, ...doc.data() } as Valoracion);
        });
      }

      valoraciones.sort((a, b) => 
        new Date(b.fechaAsignacion).getTime() - new Date(a.fechaAsignacion).getTime()
      );

      return {
        success: true,
        message: 'Valoraciones obtenidas exitosamente',
        data: valoraciones,
      };
    } catch (error) {
      console.error('❌ Error obteniendo valoraciones del cliente:', error);
      return {
        success: false,
        message: 'Error al obtener valoraciones',
        data: [],
      };
    }
  }

  async updateValoracion(
    valoracionId: string,
    data: UpdateValoracionData
  ): Promise<ApiResponse> {
    try {
      const updateData: any = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      if (data.estado === 'completada') {
        updateData.fechaCompletada = new Date().toISOString();
      }

      await updateDoc(doc(db, 'valoraciones', valoracionId), updateData);

      console.log('✅ Valoración actualizada:', valoracionId);

      return {
        success: true,
        message: 'Valoración actualizada exitosamente',
      };
    } catch (error) {
      console.error('❌ Error actualizando valoración:', error);
      return {
        success: false,
        message: 'Error al actualizar valoración',
      };
    }
  }

  async getValoracionById(valoracionId: string): Promise<ApiResponse<Valoracion>> {
    try {
      const valoracionDoc = await getDoc(doc(db, 'valoraciones', valoracionId));

      if (!valoracionDoc.exists()) {
        return {
          success: false,
          message: 'Valoración no encontrada',
        };
      }

      const valoracion = { id: valoracionDoc.id, ...valoracionDoc.data() } as Valoracion;

      return {
        success: true,
        message: 'Valoración encontrada',
        data: valoracion,
      };
    } catch (error) {
      console.error('❌ Error obteniendo valoración:', error);
      return {
        success: false,
        message: 'Error al obtener valoración',
      };
    }
  }

  async deleteValoracion(valoracionId: string): Promise<ApiResponse> {
    try {
      await deleteDoc(doc(db, 'valoraciones', valoracionId));

      console.log('✅ Valoración eliminada:', valoracionId);

      return {
        success: true,
        message: 'Valoración eliminada exitosamente',
      };
    } catch (error) {
      console.error('❌ Error eliminando valoración:', error);
      return {
        success: false,
        message: 'Error al eliminar valoración',
      };
    }
  }
}

export const valoracionService = new ValoracionService();