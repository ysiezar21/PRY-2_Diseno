// src/api/services/ordenTrabajo.service.ts
// FLUJO COMPLETO:
// 1. Cliente acepta tareas → OT se crea AUTOMÁTICAMENTE (sin mecánico asignado)
// 2. Jefe del taller ASIGNA la OT a un mecánico
// 3. También permite creación MANUAL para casos especiales

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
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import type { TareaValoracion } from './valoracion.service';

// ============================================
// INTERFACES
// ============================================

export interface RepuestoUsado {
  nombre: string;
  cantidad: number;
  precio: number;
}

export interface TareaOrdenTrabajo {
  id: string;
  nombre: string;
  descripcion: string;
  precioEstimado: number;
  completada: boolean;
  fechaCompletada?: string;
}

export interface OrdenTrabajo {
  id: string;
  numeroOT: string;
  vehiculoId: string;
  mecanicoId?: string; // ⭐ OPCIONAL - se asigna después
  mecanicoAsignado: boolean; // ⭐ Indica si ya tiene mecánico
  tallerOwnerId: string;
  workshopId: string;
  // Referencia del origen (según el flujo)
  valoracionId?: string;
  cotizacionId?: string;
  tareasAprobadas: TareaOrdenTrabajo[];
  fechaCreacion: string; // Cuando se creó (automáticamente)
  fechaAsignacion?: string; // Cuando se asignó mecánico
  fechaInicio?: string;
  fechaFinalizacion?: string;
  estado: 'pendiente_asignacion' | 'asignada' | 'en_progreso' | 'pausada' | 'completada' | 'cancelada';
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  descripcion: string;
  trabajosRealizados?: string[];
  repuestosUsados?: RepuestoUsado[];
  horasTrabajadas?: number;
  costoManoObra?: number;
  costoRepuestos?: number;
  costoTotal?: number;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AsignarMecanicoData {
  mecanicoId: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  observaciones?: string;
}

export interface CreateOrdenTrabajoData {
  vehiculoId: string;
  mecanicoId?: string;
  tallerOwnerId: string;
  workshopId: string;
  valoracionId?: string;
  cotizacionId?: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  descripcion: string;
  estado?: 'pendiente_asignacion' | 'asignada';
  mecanicoAsignado?: boolean;
  fechaAsignacion?: string;
  tareasAprobadas?: TareaOrdenTrabajo[];
  costoTotal?: number;
}

export interface UpdateOrdenTrabajoData {
  estado?: 'pendiente_asignacion' | 'asignada' | 'en_progreso' | 'pausada' | 'completada' | 'cancelada';
  prioridad?: 'baja' | 'media' | 'alta' | 'urgente';
  trabajosRealizados?: string[];
  repuestosUsados?: RepuestoUsado[];
  horasTrabajadas?: number;
  costoManoObra?: number;
  costoRepuestos?: number;
  observaciones?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ============================================
// SERVICIO DE ÓRDENES DE TRABAJO
// ============================================

class OrdenTrabajoService {
  /**
   * Generar número de OT único
   */
  private async generateNumeroOT(workshopId: string): Promise<string> {
    const prefix = 'OT';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    const q = query(
      collection(db, 'ordenesTrabajo'),
      where('workshopId', '==', workshopId)
    );

    const querySnapshot = await getDocs(q);
    const ordenes = querySnapshot.docs.map(doc => doc.data() as OrdenTrabajo);
    
    ordenes.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    let nextNumber = 1;
    if (ordenes.length > 0) {
      const lastNumero = ordenes[0].numeroOT.split('-').pop();
      if (lastNumero) {
        nextNumber = parseInt(lastNumero) + 1;
      }
    }

    return `${prefix}-${year}${month}-${nextNumber.toString().padStart(4, '0')}`;
  }

/**
 * CREAR OT AUTOMÁTICAMENTE cuando cliente completa selección de tareas
 * Esta función es llamada automáticamente por el sistema cuando:
 * - Cliente responde la ÚLTIMA tarea pendiente de una valoración
 * - Al menos UNA tarea fue aceptada
 * - ELIMINA LA VALORACIÓN después de crear la OT exitosamente
 */
async createOrdenAutomatica(
  valoracionId: string
): Promise<ApiResponse<OrdenTrabajo>> {
  try {
    console.log('🤖 Intentando crear OT automática para valoración:', valoracionId);
    
    // 1. Obtener valoración
    const valoracionDoc = await getDoc(doc(db, 'valoraciones', valoracionId));
    if (!valoracionDoc.exists()) {
      return {
        success: false,
        message: 'Valoración no encontrada',
        error: 'VALORACION_NOT_FOUND',
      };
    }

    const valoracion = valoracionDoc.data();

    // 2. Verificar que ya existe una OT para esta valoración
    const existingOTQuery = query(
      collection(db, 'ordenesTrabajo'),
      where('valoracionId', '==', valoracionId)
    );
    const existingOTSnapshot = await getDocs(existingOTQuery);
    
    if (!existingOTSnapshot.empty) {
      console.log('Ya existe OT para esta valoración');
      return {
        success: false,
        message: 'Ya existe una orden de trabajo para esta valoración',
        error: 'OT_ALREADY_EXISTS',
      };
    }

    // 3. ⭐ Filtrar SOLO tareas aceptadas
    const tareasAceptadas = valoracion.tareas?.filter(
      (t: TareaValoracion) => t.estado === 'aceptada'
    ) || [];

    if (tareasAceptadas.length === 0) {
      console.log('No hay tareas aceptadas');
      return {
        success: false,
        message: 'No hay tareas aceptadas por el cliente',
        error: 'NO_ACCEPTED_TASKS',
      };
    }

    // 4. Validar que cliente completó revisión
    const todasRespondidas = valoracion.tareas?.every(
      (t: TareaValoracion) => t.estado !== 'propuesta'
    );

    if (!todasRespondidas) {
      console.log('Cliente no ha completado revisión');
      return {
        success: false,
        message: 'El cliente aún no ha revisado todas las tareas',
        error: 'VALORACION_INCOMPLETE',
      };
    }

    // 5. Validar vehículo
    const vehicleDoc = await getDoc(doc(db, 'vehicles', valoracion.vehiculoId));
    if (!vehicleDoc.exists()) {
      return {
        success: false,
        message: 'Vehículo no encontrado',
        error: 'VEHICLE_NOT_FOUND',
      };
    }

    // 6. Generar número de OT
    const numeroOT = await this.generateNumeroOT(valoracion.workshopId);

    // 7. Convertir tareas aceptadas
    const tareasOrden: TareaOrdenTrabajo[] = tareasAceptadas.map((tarea: TareaValoracion) => ({
      id: tarea.id,
      nombre: tarea.nombre,
      descripcion: tarea.descripcion,
      precioEstimado: tarea.precioEstimado ?? 0,
      completada: false,
    }));

    // 8. Calcular costo
    const costoTotal = tareasAceptadas.reduce(
      (sum: number, tarea: TareaValoracion) => sum + (tarea.precioEstimado ?? 0),
      0
    );

    // Crear OT SIN mecánico asignado
    const ordenRef = doc(collection(db, 'ordenesTrabajo'));
    const ordenId = ordenRef.id;

    // Crear objeto para Firestore (sin campos undefined)
    const ordenData: any = {
      id: ordenId,
      numeroOT,
      vehiculoId: valoracion.vehiculoId,
      mecanicoAsignado: false,
      tallerOwnerId: valoracion.tallerOwnerId,
      workshopId: valoracion.workshopId,
      valoracionId: valoracionId,
      tareasAprobadas: tareasOrden,
      fechaCreacion: new Date().toISOString(),
      estado: 'pendiente_asignacion',
      prioridad: 'media',
      descripcion: `Orden generada automáticamente. Cliente aceptó ${tareasAceptadas.length} de ${valoracion.tareas?.length || 0} tareas propuestas.`,
      trabajosRealizados: [],
      repuestosUsados: [],
      horasTrabajadas: 0,
      costoManoObra: 0,
      costoRepuestos: 0,
      costoTotal: costoTotal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(ordenRef, ordenData);

    const newOrden: OrdenTrabajo = {
      ...ordenData,
      mecanicoId: undefined,
    };

    // Eliminar la valoración después de crear la OT
    try {
      await deleteDoc(doc(db, 'valoraciones', valoracionId));
      console.log('Valoración eliminada:', valoracionId);
    } catch (deleteError) {
      console.warn('Error al eliminar valoración (OT ya creada):', deleteError);
      // No fallar todo el proceso si falla la eliminación
    }

    console.log('OT AUTOMÁTICA creada:', numeroOT);
    console.log(`   Tareas: ${tareasAceptadas.length}/${valoracion.tareas?.length || 0}`);
    console.log(`   Estado: pendiente_asignacion`);
    console.log(`   Costo: ₡${costoTotal.toLocaleString()}`);

    return {
      success: true,
      message: `Orden de trabajo ${numeroOT} generada automáticamente. Pendiente de asignación a mecánico.`,
      data: newOrden,
    };
  } catch (error: any) {
    console.error('Error creando OT automática:', error);
    return {
      success: false,
      message: 'Error al generar orden de trabajo automática',
      error: error.message || 'SERVER_ERROR',
    };
  }
}

  /**
   * CREAR OT DESDE COTIZACIÓN aprobada por el cliente
   * - Lee la cotización
   * - Toma todas las reparaciones obligatorias + opcionales seleccionadas
   * - Crea OT SIN mecánico asignado
   */
  async createOrdenDesdeCotizacion(cotizacionId: string): Promise<ApiResponse<OrdenTrabajo>> {
    try {
      const cotDoc = await getDoc(doc(db, 'cotizaciones', cotizacionId));
      if (!cotDoc.exists()) {
        return { success: false, message: 'Cotización no encontrada', error: 'COTIZACION_NOT_FOUND' };
      }

      const cot: any = cotDoc.data();

      // Evitar duplicados
      const existingOTQuery = query(
        collection(db, 'ordenesTrabajo'),
        where('cotizacionId', '==', cotizacionId)
      );
      const existingOTSnapshot = await getDocs(existingOTQuery);
      if (!existingOTSnapshot.empty) {
        return { success: false, message: 'Ya existe una orden de trabajo para esta cotización', error: 'OT_ALREADY_EXISTS' };
      }

      // Validar vehículo
      const vehicleDoc = await getDoc(doc(db, 'vehicles', cot.vehiculoId));
      if (!vehicleDoc.exists()) {
        return { success: false, message: 'Vehículo no encontrado', error: 'VEHICLE_NOT_FOUND' };
      }

      const numeroOT = await this.generateNumeroOT(cot.workshopId);

      const seleccionados: string[] = cot.itemsOpcionalesSeleccionados || [];
      const items = cot.items || [];

      const itemsIncluidos = items.filter((it: any) => it.obligatorio === true || seleccionados.includes(it.id));
      if (itemsIncluidos.length === 0) {
        return { success: false, message: 'No hay reparaciones seleccionadas', error: 'NO_SELECTED_ITEMS' };
      }

      const tareasOrden: TareaOrdenTrabajo[] = itemsIncluidos.map((it: any) => ({
        id: it.id,
        nombre: it.nombre,
        descripcion: it.descripcion,
        precioEstimado: it.precio,
        completada: false,
      }));

      // Costos
      const totalItems = itemsIncluidos.reduce((s: number, it: any) => s + (it.precio || 0), 0);
      const totalRepuestos = (cot.repuestos || []).reduce((s: number, r: any) => s + (r.precioUnitario || 0) * (r.cantidad || 0), 0);
      const costoTotal = totalItems + totalRepuestos;

      const ordenRef = doc(collection(db, 'ordenesTrabajo'));
      const ordenId = ordenRef.id;
      const now = new Date().toISOString();

      const ordenData: any = {
        id: ordenId,
        numeroOT,
        vehiculoId: cot.vehiculoId,
        mecanicoAsignado: false,
        tallerOwnerId: cot.tallerOwnerId,
        workshopId: cot.workshopId,
        cotizacionId,
        valoracionId: cot.valoracionId,
        tareasAprobadas: tareasOrden,
        fechaCreacion: now,
        estado: 'pendiente_asignacion',
        prioridad: 'media',
        descripcion: `Orden generada desde cotización. Incluye ${itemsIncluidos.length} reparaciones.`,
        trabajosRealizados: [],
        repuestosUsados: [],
        costoTotal,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(ordenRef, ordenData);

      return { success: true, message: 'Orden de trabajo creada', data: ordenData as OrdenTrabajo };
    } catch (error: any) {
      console.error('Error creando OT desde cotización:', error);
      return { success: false, message: 'Error al crear OT desde cotización', error: error?.message || 'SERVER_ERROR' };
    }
  }
  /**
   * CREAR ORDEN DE TRABAJO MANUALMENTE (para casos especiales)
   * Esta función permite al jefe del taller crear una OT manualmente
   * Útil cuando el sistema automático falla o para casos excepcionales
   */
  async createOrdenTrabajo(
    data: CreateOrdenTrabajoData
  ): Promise<ApiResponse<OrdenTrabajo>> {
    try {
      console.log('Creando orden de trabajo manual:', data);
      
      const {
        vehiculoId,
        mecanicoId,
        tallerOwnerId,
        workshopId,
        valoracionId,
        prioridad = 'media',
        descripcion,
        estado = 'pendiente_asignacion',
        mecanicoAsignado = false,
        fechaAsignacion,
        tareasAprobadas = [],
        costoTotal = 0,
      } = data;

      // 1. Validar vehículo
      const vehicleDoc = await getDoc(doc(db, 'vehicles', vehiculoId));
      if (!vehicleDoc.exists()) {
        return {
          success: false,
          message: 'Vehículo no encontrado',
          error: 'VEHICLE_NOT_FOUND',
        };
      }

      // 2. Si hay valoraciónId, verificar que no exista OT para ella
      if (valoracionId) {
        const existingOTQuery = query(
          collection(db, 'ordenesTrabajo'),
          where('valoracionId', '==', valoracionId)
        );
        const existingOTSnapshot = await getDocs(existingOTQuery);
        
        if (!existingOTSnapshot.empty) {
          return {
            success: false,
            message: 'Ya existe una orden de trabajo para esta valoración',
            error: 'OT_ALREADY_EXISTS',
          };
        }
      }

      // 3. Si se asigna mecánico, validarlo
      if (mecanicoId && mecanicoAsignado) {
        const mechanicDoc = await getDoc(doc(db, 'users', mecanicoId));
        if (!mechanicDoc.exists() || mechanicDoc.data()?.role !== 'mechanic') {
          return {
            success: false,
            message: 'Mecánico no encontrado o no es válido',
            error: 'MECHANIC_NOT_FOUND',
          };
        }
      }

      // 4. Generar número de OT
      const numeroOT = await this.generateNumeroOT(workshopId);

      // 5. Crear OT
      const ordenRef = doc(collection(db, 'ordenesTrabajo'));
      const ordenId = ordenRef.id;

      const newOrden: OrdenTrabajo = {
        id: ordenId,
        numeroOT,
        vehiculoId,
        mecanicoId: mecanicoAsignado ? mecanicoId : undefined,
        mecanicoAsignado,
        tallerOwnerId,
        workshopId,
        valoracionId: valoracionId || '',
        tareasAprobadas,
        fechaCreacion: new Date().toISOString(),
        fechaAsignacion: mecanicoAsignado ? (fechaAsignacion || new Date().toISOString()) : undefined,
        estado: mecanicoAsignado ? 'asignada' : estado,
        prioridad,
        descripcion,
        trabajosRealizados: [],
        repuestosUsados: [],
        horasTrabajadas: 0,
        costoManoObra: 0,
        costoRepuestos: 0,
        costoTotal,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(ordenRef, newOrden);

      console.log('OT MANUAL creada:', numeroOT);
      console.log(`   Estado: ${newOrden.estado}`);
      console.log(`   Mecánico asignado: ${mecanicoAsignado}`);
      console.log(`   Tareas: ${tareasAprobadas.length}`);

      return {
        success: true,
        message: `Orden de trabajo ${numeroOT} creada exitosamente${mecanicoAsignado ? ' y asignada al mecánico' : ''}.`,
        data: newOrden,
      };
    } catch (error: any) {
      console.error('Error creando OT manual:', error);
      return {
        success: false,
        message: 'Error al crear orden de trabajo',
        error: error.message || 'SERVER_ERROR',
      };
    }
  }

  /**
   * CREAR ORDEN DE TRABAJO CON VALORACIÓN (método simplificado)
   * Combina la obtención de tareas de valoración con creación manual
   */
  async createOrdenFromValoracion(
    valoracionId: string,
    data: {
      mecanicoId: string;
      prioridad: 'baja' | 'media' | 'alta' | 'urgente';
      observaciones?: string;
    }
  ): Promise<ApiResponse<OrdenTrabajo>> {
    try {
      console.log('🔗 Creando OT desde valoración:', valoracionId);

      // 1. Obtener valoración
      const valoracionDoc = await getDoc(doc(db, 'valoraciones', valoracionId));
      if (!valoracionDoc.exists()) {
        return {
          success: false,
          message: 'Valoración no encontrada',
          error: 'VALORACION_NOT_FOUND',
        };
      }

      const valoracion = valoracionDoc.data();

      // 2. Verificar que ya existe una OT para esta valoración
      const existingOTQuery = query(
        collection(db, 'ordenesTrabajo'),
        where('valoracionId', '==', valoracionId)
      );
      const existingOTSnapshot = await getDocs(existingOTQuery);
      
      if (!existingOTSnapshot.empty) {
        return {
          success: false,
          message: 'Ya existe una orden de trabajo para esta valoración',
          error: 'OT_ALREADY_EXISTS',
        };
      }

      // 3. Obtener tareas aceptadas
      const tareasAceptadas = valoracion.tareas?.filter(
        (t: TareaValoracion) => t.estado === 'aceptada'
      ) || [];

      if (tareasAceptadas.length === 0) {
        return {
          success: false,
          message: 'No hay tareas aceptadas por el cliente',
          error: 'NO_ACCEPTED_TASKS',
        };
      }

      // 4. Validar mecánico
      const mechanicDoc = await getDoc(doc(db, 'users', data.mecanicoId));
      if (!mechanicDoc.exists() || mechanicDoc.data()?.role !== 'mechanic') {
        return {
          success: false,
          message: 'Mecánico no encontrado',
          error: 'MECHANIC_NOT_FOUND',
        };
      }

      // 5. Crear tareas para la OT
      const tareasOrden: TareaOrdenTrabajo[] = tareasAceptadas.map((tarea: TareaValoracion) => ({
        id: tarea.id,
        nombre: tarea.nombre,
        descripcion: tarea.descripcion,
        precioEstimado: tarea.precioEstimado ?? 0,
        completada: false,
      }));

      // 6. Calcular costo total
      const costoTotal = tareasAceptadas.reduce(
        (sum: number, tarea: TareaValoracion) => sum + (tarea.precioEstimado ?? 0),
        0
      );

      // 7. Crear OT usando el método manual
      const ordenResult = await this.createOrdenTrabajo({
        vehiculoId: valoracion.vehiculoId,
        mecanicoId: data.mecanicoId,
        tallerOwnerId: valoracion.tallerOwnerId,
        workshopId: valoracion.workshopId,
        valoracionId: valoracionId,
        prioridad: data.prioridad,
        descripcion: `Orden creada desde valoración. ${data.observaciones || ''}`,
        estado: 'asignada',
        mecanicoAsignado: true,
        fechaAsignacion: new Date().toISOString(),
        tareasAprobadas: tareasOrden,
        costoTotal,
      });

      return ordenResult;
    } catch (error: any) {
      console.error('Error creando OT desde valoración:', error);
      return {
        success: false,
        message: 'Error al crear orden de trabajo desde valoración',
        error: error.message || 'SERVER_ERROR',
      };
    }
  }


/**
 * ASIGNAR MECÁNICO a una OT (Jefe del Taller)
 * Toma una OT en estado 'pendiente_asignacion' y le asigna un mecánico
 */
async asignarMecanico(
  ordenId: string,
  data: AsignarMecanicoData
): Promise<ApiResponse> {
  try {
    const { mecanicoId, prioridad, observaciones } = data;

    // 1. Obtener la OT
    const ordenDoc = await getDoc(doc(db, 'ordenesTrabajo', ordenId));
    if (!ordenDoc.exists()) {
      return {
        success: false,
        message: 'Orden de trabajo no encontrada',
        error: 'OT_NOT_FOUND',
      };
    }

    const orden = ordenDoc.data() as OrdenTrabajo;

    // 2. Verificar que no tenga mecánico asignado
    if (orden.mecanicoAsignado) {
      return {
        success: false,
        message: 'Esta orden ya tiene un mecánico asignado',
        error: 'ALREADY_ASSIGNED',
      };
    }

    // 3. Validar mecánico
    const mechanicDoc = await getDoc(doc(db, 'users', mecanicoId));
    if (!mechanicDoc.exists() || mechanicDoc.data()?.role !== 'mechanic') {
      return {
        success: false,
        message: 'Mecánico no encontrado',
        error: 'MECHANIC_NOT_FOUND',
      };
    }

    // 4.PREPARAR DATOS - Eliminar campos undefined
    const updateData: any = {
      mecanicoId,
      mecanicoAsignado: true,
      fechaAsignacion: new Date().toISOString(),
      estado: 'asignada',
      prioridad,
      updatedAt: new Date().toISOString(),
    };

    // Solo agregar observaciones si tiene valor
    if (observaciones && observaciones.trim() !== '') {
      updateData.observaciones = observaciones;
    } else if (orden.observaciones) {
      // Mantener observaciones existentes si las hay
      updateData.observaciones = orden.observaciones;
    }

    // 5. Actualizar OT
    await updateDoc(doc(db, 'ordenesTrabajo', ordenId), updateData);

    console.log('Mecánico asignado a OT:', orden.numeroOT);
    console.log(`   Mecánico: ${mecanicoId}`);
    console.log(`   Prioridad: ${prioridad}`);

    return {
      success: true,
      message: `Orden ${orden.numeroOT} asignada exitosamente al mecánico`,
    };
  } catch (error: any) {
    console.error('Error asignando mecánico:', error);
    return {
      success: false,
      message: 'Error al asignar mecánico',
      error: error.message || 'SERVER_ERROR',
    };
  }
}
  /**
   * Obtener órdenes pendientes de asignación (para el jefe del taller)
   */
  async getOrdenesPendientesAsignacion(workshopId: string): Promise<ApiResponse<OrdenTrabajo[]>> {
    try {
      const q = query(
        collection(db, 'ordenesTrabajo'),
        where('workshopId', '==', workshopId),
        where('estado', '==', 'pendiente_asignacion')
      );

      const querySnapshot = await getDocs(q);
      const ordenes: OrdenTrabajo[] = [];

      querySnapshot.forEach((doc) => {
        ordenes.push({ id: doc.id, ...doc.data() } as OrdenTrabajo);
      });

      ordenes.sort((a, b) => 
        new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
      );

      return {
        success: true,
        message: 'Órdenes pendientes obtenidas',
        data: ordenes,
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Error al obtener órdenes',
        data: [],
      };
    }
  }

  /**
   * Obtener órdenes por mecánico
   */
  async getOrdenesByMecanico(mecanicoId: string): Promise<ApiResponse<OrdenTrabajo[]>> {
    try {
      const q = query(
        collection(db, 'ordenesTrabajo'),
        where('mecanicoId', '==', mecanicoId)
      );

      const querySnapshot = await getDocs(q);
      const ordenes: OrdenTrabajo[] = [];

      querySnapshot.forEach((doc) => {
        ordenes.push({ id: doc.id, ...doc.data() } as OrdenTrabajo);
      });

      ordenes.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return {
        success: true,
        message: 'Órdenes obtenidas',
        data: ordenes,
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Error al obtener órdenes',
        data: [],
      };
    }
  }

  /**
   * Obtener órdenes por taller
   */
  async getOrdenesByWorkshop(workshopId: string): Promise<ApiResponse<OrdenTrabajo[]>> {
    try {
      const q = query(
        collection(db, 'ordenesTrabajo'),
        where('workshopId', '==', workshopId)
      );

      const querySnapshot = await getDocs(q);
      const ordenes: OrdenTrabajo[] = [];

      querySnapshot.forEach((doc) => {
        ordenes.push({ id: doc.id, ...doc.data() } as OrdenTrabajo);
      });

      ordenes.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return {
        success: true,
        message: 'Órdenes obtenidas',
        data: ordenes,
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Error al obtener órdenes',
        data: [],
      };
    }
  }

  /**
   * Obtener órdenes por vehículo
   */
  async getOrdenesByVehiculo(vehiculoId: string): Promise<ApiResponse<OrdenTrabajo[]>> {
    try {
      const q = query(
        collection(db, 'ordenesTrabajo'),
        where('vehiculoId', '==', vehiculoId)
      );

      const querySnapshot = await getDocs(q);
      const ordenes: OrdenTrabajo[] = [];

      querySnapshot.forEach((doc) => {
        ordenes.push({ id: doc.id, ...doc.data() } as OrdenTrabajo);
      });

      ordenes.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return {
        success: true,
        message: 'Órdenes obtenidas',
        data: ordenes,
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Error al obtener órdenes',
        data: [],
      };
    }
  }

  /**
   * Actualizar orden de trabajo
   */
  async updateOrdenTrabajo(
    ordenId: string,
    data: UpdateOrdenTrabajoData
  ): Promise<ApiResponse> {
    try {
      const updateData: any = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      if (data.estado === 'en_progreso' && !updateData.fechaInicio) {
        updateData.fechaInicio = new Date().toISOString();
      }

      if (data.estado === 'completada') {
        updateData.fechaFinalizacion = new Date().toISOString();
        const costoManoObra = data.costoManoObra || 0;
        const costoRepuestos = data.costoRepuestos || 0;
        updateData.costoTotal = costoManoObra + costoRepuestos;
      }

      await updateDoc(doc(db, 'ordenesTrabajo', ordenId), updateData);

      return {
        success: true,
        message: 'Orden actualizada',
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Error al actualizar',
      };
    }
  }

  /**
   * Completar tarea
   */
  async completarTarea(ordenId: string, tareaId: string): Promise<ApiResponse> {
    try {
      const ordenDoc = await getDoc(doc(db, 'ordenesTrabajo', ordenId));
      
      if (!ordenDoc.exists()) {
        return {
          success: false,
          message: 'Orden no encontrada',
        };
      }

      const orden = ordenDoc.data() as OrdenTrabajo;
      const tareas = [...(orden.tareasAprobadas || [])];
      const tareaIndex = tareas.findIndex((t) => t.id === tareaId);

      if (tareaIndex === -1) {
        return {
          success: false,
          message: 'Tarea no encontrada',
        };
      }

      tareas[tareaIndex] = {
        ...tareas[tareaIndex],
        completada: true,
        fechaCompletada: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'ordenesTrabajo', ordenId), {
        tareasAprobadas: tareas,
        updatedAt: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'Tarea completada',
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Error al completar tarea',
      };
    }
  }

  /**
   * Obtener orden por ID
   */
  async getOrdenById(ordenId: string): Promise<ApiResponse<OrdenTrabajo>> {
    try {
      const ordenDoc = await getDoc(doc(db, 'ordenesTrabajo', ordenId));

      if (!ordenDoc.exists()) {
        return {
          success: false,
          message: 'Orden no encontrada',
        };
      }

      const orden = { id: ordenDoc.id, ...ordenDoc.data() } as OrdenTrabajo;

      return {
        success: true,
        message: 'Orden encontrada',
        data: orden,
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Error al obtener orden',
      };
    }
  }

  /**
   * Eliminar orden de trabajo
   */
  async deleteOrdenTrabajo(ordenId: string): Promise<ApiResponse> {
    try {
      await deleteDoc(doc(db, 'ordenesTrabajo', ordenId));

      return {
        success: true,
        message: 'Orden eliminada',
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Error al eliminar',
      };
    }
  }
}

export const ordenTrabajoService = new OrdenTrabajoService();