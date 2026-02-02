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
  // En valoración NO se manejan precios (los precios se agregan en la cotización).
  // Se deja como opcional por compatibilidad con versiones anteriores.
  precioEstimado?: number;
  // Indica si la reparación es obligatoria (true) u opcional (false)
  obligatorio?: boolean;
  estado: 'propuesta' | 'aceptada' | 'rechazada';
  aceptadaPorCliente?: boolean;
  fechaRespuesta?: string;
  createdAt: string;
}

export interface Valoracion {
  id: string;
  vehiculoId: string;
  // En el nuevo flujo el mecánico se asigna al "tomar" la valoración
  mecanicoId?: string;
  tallerOwnerId: string;
  workshopId: string;
  fechaAsignacion: string;
  // Estados clave del flujo
  // - pendiente_valoracion: creada al ingresar el vehículo, visible para todos los mecánicos
  // - en_proceso: un mecánico la tomó y está trabajando
  // - completada: lista para que el administrador genere cotización
  // - cotizada: el administrador ya generó la cotización
  estado: 'pendiente_valoracion' | 'en_proceso' | 'completada' | 'cotizada' | 'pendiente' ;
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
  mecanicoId?: string;
  tallerOwnerId: string;
  workshopId: string;
}

export interface UpdateValoracionData {
  estado?: 'pendiente_valoracion' | 'en_proceso' | 'completada' | 'cotizada' | 'pendiente' ;
  diagnostico?: string;
  problemasEncontrados?: string[];
  repuestosNecesarios?: RepuestoNecesario[];
  horasEstimadas?: number;
  costoEstimado?: number;
}

export interface CreateTareaData {
  nombre: string;
  descripcion: string;
  obligatorio: boolean;
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

      // Si se especifica un mecánico, validar que exista y sea role=mechanic
      if (mecanicoId) {
        const mechanicDoc = await getDoc(doc(db, 'users', mecanicoId));
        if (!mechanicDoc.exists() || mechanicDoc.data()?.role !== 'mechanic') {
          return {
            success: false,
            message: 'Mecánico no encontrado',
            error: 'MECHANIC_NOT_FOUND',
          };
        }
      }

      const valoracionRef = doc(collection(db, 'valoraciones'));
      const valoracionId = valoracionRef.id;

      const newValoracion: Valoracion = {
        id: valoracionId,
        vehiculoId,
        ...(mecanicoId ? { mecanicoId } : {}),
        tallerOwnerId,
        workshopId,
        fechaAsignacion: new Date().toISOString(),
        estado: mecanicoId ? 'en_proceso' : 'pendiente_valoracion',
        tareas: [],        createdAt: new Date().toISOString(),
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
        obligatorio: tareaData.obligatorio,
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

  /**
 * Finaliza una valoración (diagnóstico) para que el administrador pueda generar una cotización.
 * En el flujo nuevo, la valoración NO se envía al cliente ni se aprueba/rechaza por el cliente.
 */
async finalizarValoracion(valoracionId: string): Promise<ApiResponse> {
  try {
    const valoracionDoc = await getDoc(doc(db, 'valoraciones', valoracionId));

    if (!valoracionDoc.exists()) {
      return {
        success: false,
        message: 'Valoración no encontrada',
      };
    }

    const valoracion = valoracionDoc.data() as Valoracion;

    if (!valoracion.tareas || valoracion.tareas.length === 0) {
      return {
        success: false,
        message: 'Debe agregar al menos una tarea antes de finalizar',
      };
    }

    await updateDoc(doc(db, 'valoraciones', valoracionId), {
      estado: 'completada',
      fechaCompletada: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ Valoración finalizada:', valoracionId);

    return {
      success: true,
      message: 'Valoración finalizada. Lista para cotización.',
    };
  } catch (error) {
    console.error('❌ Error finalizando valoración:', error);
    return {
      success: false,
      message: 'Error al finalizar valoración',
    };
  }
}

/**
 * Alias por compatibilidad con versiones anteriores.
 * Antes: "enviar al cliente". Ahora: finaliza la valoración.
 */
async enviarACliente(valoracionId: string): Promise<ApiResponse> {
  return this.finalizarValoracion(valoracionId);
}/**
   * ⭐ ACTUALIZADO: Cliente acepta o rechaza tarea
   * Ahora crea OT AUTOMÁTICAMENTE cuando cliente responde la última tarea
   */
  /**
 * DEPRECADO en el flujo nuevo.
 * La aprobación/rechazo es sobre la COTIZACIÓN (hecha por el administrador), no sobre la valoración.
 */
async responderTarea(
  _valoracionId: string,
  _tareaId: string,
  _aceptada: boolean
): Promise<ApiResponse> {
  return {
    success: false,
    message: 'La aprobación por tareas ya no aplica. El cliente debe aprobar/rechazar la cotización.',
    error: 'DEPRECATED_FLOW',
  };
}// ... (mantener todos los métodos get existentes)

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

  /**
   * ⭐ Valoraciones disponibles para cualquier mecánico del taller
   * Creadas cuando se registra el ingreso del vehículo.
   */
  async getValoracionesDisponibles(workshopId: string): Promise<ApiResponse<Valoracion[]>> {
    try {
      const q = query(
        collection(db, 'valoraciones'),
        where('workshopId', '==', workshopId),
        where('estado', '==', 'pendiente_valoracion')
      );

      const querySnapshot = await getDocs(q);
      const valoraciones: Valoracion[] = [];

      querySnapshot.forEach((d) => {
        valoraciones.push({ id: d.id, ...d.data() } as Valoracion);
      });

      valoraciones.sort((a, b) =>
        new Date(b.fechaAsignacion).getTime() - new Date(a.fechaAsignacion).getTime()
      );

      return { success: true, message: 'Valoraciones disponibles', data: valoraciones };
    } catch (error) {
      console.error('❌ Error obteniendo valoraciones disponibles:', error);
      return { success: false, message: 'Error al obtener valoraciones disponibles', data: [] };
    }
  }

  /**
   * ⭐ Un mecánico "toma" una valoración disponible
   */
  async tomarValoracion(valoracionId: string, mecanicoId: string): Promise<ApiResponse> {
    try {
      const valDoc = await getDoc(doc(db, 'valoraciones', valoracionId));
      if (!valDoc.exists()) {
        return { success: false, message: 'Valoración no encontrada' };
      }

      const val = valDoc.data() as any;
      if (val.estado !== 'pendiente_valoracion') {
        return { success: false, message: 'Esta valoración ya fue tomada por otro mecánico' };
      }

      // Validar mecánico
      const mechanicDoc = await getDoc(doc(db, 'users', mecanicoId));
      if (!mechanicDoc.exists() || mechanicDoc.data()?.role !== 'mechanic') {
        return { success: false, message: 'Mecánico no encontrado' };
      }

      await updateDoc(doc(db, 'valoraciones', valoracionId), {
        mecanicoId,
        estado: 'en_proceso',
        updatedAt: new Date().toISOString(),
      } as any);

      return { success: true, message: 'Valoración tomada exitosamente' };
    } catch (error) {
      console.error('❌ Error tomando valoración:', error);
      return { success: false, message: 'Error al tomar valoración' };
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