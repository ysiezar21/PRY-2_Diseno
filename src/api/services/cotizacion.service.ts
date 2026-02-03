// src/api/services/cotizacion.service.ts
// Cotización (hecha por el administrador del taller) a partir de una valoración (hecha por el mecánico)
// Flujo esperado:
// 1) Mecánico completa VALORACIÓN (sin precios)
// 2) Administrador crea COTIZACIÓN (con precios + reparaciones obligatorias/opcionales)
// 3) Cliente acepta/rechaza la cotización
// 4) Si acepta → se genera Orden de Trabajo (sin mecánico) y el administrador la asigna

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';

import { db } from '../config/firebase.config';
import { ordenTrabajoService } from './ordenTrabajo.service';

// ============================================
// INTERFACES
// ============================================

export interface ItemCotizacion {
  id: string;
  nombre: string;
  descripcion: string;
  obligatorio: boolean;
  precio: number; // precio por reparación
}

export interface RepuestoCotizacion {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export interface Cotizacion {
  id: string;
  vehiculoId: string;
  clienteId: string;
  valoracionId: string;
  tallerOwnerId: string;
  workshopId: string;
  estado: 'pendiente_aprobacion_cliente' | 'aprobada' | 'rechazada';
  items: ItemCotizacion[];
  repuestos: RepuestoCotizacion[];
  itemsOpcionalesSeleccionados?: string[]; // ids de items opcionales elegidos por el cliente
  totalEstimado: number;
  fechaCreacion: string;
  fechaRespuesta?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCotizacionData {
  vehiculoId: string;
  clienteId: string;
  valoracionId: string;
  tallerOwnerId: string;
  workshopId: string;
  items: ItemCotizacion[];
  repuestos: RepuestoCotizacion[];
}

export interface ResponderCotizacionData {
  aceptada: boolean;
  itemsOpcionalesSeleccionados: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

class CotizacionService {
  async createCotizacion(data: CreateCotizacionData): Promise<ApiResponse<Cotizacion>> {
    try {
      const { vehiculoId, clienteId, valoracionId, tallerOwnerId, workshopId, items, repuestos } = data;

      if (!vehiculoId || !clienteId || !valoracionId || !tallerOwnerId || !workshopId) {
        return { success: false, message: 'Faltan campos requeridos', error: 'MISSING_FIELDS' };
      }

      // Validar que exista la valoración
      const valoracionDoc = await getDoc(doc(db, 'valoraciones', valoracionId));
      if (!valoracionDoc.exists()) {
        return { success: false, message: 'Valoración no encontrada', error: 'VALORACION_NOT_FOUND' };
      }

      // Calcular total
      const totalItems = (items || []).reduce((sum, it) => sum + (it.precio || 0), 0);
      const totalRepuestos = (repuestos || []).reduce((sum, r) => sum + (r.precioUnitario || 0) * (r.cantidad || 0), 0);
      const totalEstimado = totalItems + totalRepuestos;

      const cotRef = doc(collection(db, 'cotizaciones'));
      const cotId = cotRef.id;

      const now = new Date().toISOString();

      const newCot: Cotizacion = {
        id: cotId,
        vehiculoId,
        clienteId,
        valoracionId,
        tallerOwnerId,
        workshopId,
        estado: 'pendiente_aprobacion_cliente',
        items: items || [],
        repuestos: repuestos || [],
        totalEstimado,
        fechaCreacion: now,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(cotRef, newCot);

      // Marcar la valoración como "cotizada" (opcional, sin romper si no existe campo)
      await updateDoc(doc(db, 'valoraciones', valoracionId), {
        estado: 'cotizada',
        updatedAt: now,
      } as any);

      return { success: true, message: 'Cotización creada exitosamente', data: newCot };
    } catch (error: any) {
      console.error('Error creando cotización:', error);
      return { success: false, message: 'Error al crear la cotización', error: error?.message || 'SERVER_ERROR' };
    }
  }

  async getCotizacionesByCliente(clienteId: string): Promise<ApiResponse<Cotizacion[]>> {
    try {
      const q = query(collection(db, 'cotizaciones'), where('clienteId', '==', clienteId));
      const snap = await getDocs(q);
      const cotizaciones: Cotizacion[] = [];
      snap.forEach((d) => cotizaciones.push({ id: d.id, ...d.data() } as Cotizacion));
      cotizaciones.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
      return { success: true, message: 'Cotizaciones obtenidas', data: cotizaciones };
    } catch (error) {
      console.error('Error obteniendo cotizaciones cliente:', error);
      return { success: false, message: 'Error al obtener cotizaciones', data: [] };
    }
  }

  async getCotizacionesByWorkshop(workshopId: string): Promise<ApiResponse<Cotizacion[]>> {
    try {
      const q = query(collection(db, 'cotizaciones'), where('workshopId', '==', workshopId));
      const snap = await getDocs(q);
      const cotizaciones: Cotizacion[] = [];
      snap.forEach((d) => cotizaciones.push({ id: d.id, ...d.data() } as Cotizacion));
      cotizaciones.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
      return { success: true, message: 'Cotizaciones obtenidas', data: cotizaciones };
    } catch (error) {
      console.error('Error obteniendo cotizaciones taller:', error);
      return { success: false, message: 'Error al obtener cotizaciones', data: [] };
    }
  }

  async responderCotizacion(
    cotizacionId: string,
    data: ResponderCotizacionData
  ): Promise<ApiResponse<{ otId?: string; numeroOT?: string }>> {
    try {
      const cotDoc = await getDoc(doc(db, 'cotizaciones', cotizacionId));
      if (!cotDoc.exists()) {
        return { success: false, message: 'Cotización no encontrada', error: 'COTIZACION_NOT_FOUND' };
      }

      const cot = cotDoc.data() as Cotizacion;
      if (cot.estado !== 'pendiente_aprobacion_cliente') {
        return { success: false, message: 'La cotización ya fue respondida', error: 'ALREADY_RESPONDED' };
      }

      const now = new Date().toISOString();

      if (!data.aceptada) {
        await updateDoc(doc(db, 'cotizaciones', cotizacionId), {
          estado: 'rechazada',
          fechaRespuesta: now,
          itemsOpcionalesSeleccionados: [],
          updatedAt: now,
        });

        return { success: true, message: 'Cotización rechazada' };
      }

      // Si acepta: guardar selección, crear OT y marcar aprobada
      await updateDoc(doc(db, 'cotizaciones', cotizacionId), {
        estado: 'aprobada',
        fechaRespuesta: now,
        itemsOpcionalesSeleccionados: data.itemsOpcionalesSeleccionados || [],
        updatedAt: now,
      });

      const otRes = await ordenTrabajoService.createOrdenDesdeCotizacion(cotizacionId);
      if (!otRes.success || !otRes.data) {
        return { success: false, message: otRes.message || 'No se pudo crear OT', error: otRes.error || 'OT_CREATE_FAILED' };
      }

      return {
        success: true,
        message: `Cotización aprobada. Se generó la OT ${otRes.data.numeroOT}.`,
        data: { otId: otRes.data.id, numeroOT: otRes.data.numeroOT },
      };
    } catch (error: any) {
      console.error('Error respondiendo cotización:', error);
      return { success: false, message: 'Error al responder cotización', error: error?.message || 'SERVER_ERROR' };
    }
  }
}

export const cotizacionService = new CotizacionService();
