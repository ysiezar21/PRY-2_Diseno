// src/api/services/factura.service.ts

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';

// ============================================
// INTERFACES
// ============================================

export interface DetalleFactura {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface Factura {
  id: string;
  numeroFactura: string;
  ordenTrabajoId: string;
  ordenNumero: string;
  mecanicoId: string;
  mecanicoNombre: string;
  clienteId: string;
  clienteNombre: string;
  clienteCedula?: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  vehiculoId: string;
  vehiculoInfo: string;
  workshopId: string;
  workshopNombre: string;
  workshopDireccion?: string;
  workshopTelefono?: string;
  workshopEmail?: string;
  fecha: string;
  detalles: DetalleFactura[];
  subtotal: number;
  iva: number;
  total: number;
  metodoPago?: string;
  observaciones?: string;
  estado: 'generada' | 'pagada' | 'anulada';
  createdAt: string;
  updatedAt: string;
}

export interface CreateFacturaData {
  ordenTrabajoId: string;
  metodoPago?: string;
  observaciones?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ============================================
// SERVICIO DE FACTURAS
// ============================================

class FacturaService {
  /**
   * Generar número de factura único
   * VERSIÓN SIN ÍNDICES: Ordena en memoria en lugar de Firestore
   */
  private async generateNumeroFactura(workshopId: string): Promise<string> {
    const prefix = 'FACT';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    // Consulta simple sin orderBy
    const q = query(
      collection(db, 'facturas'),
      where('workshopId', '==', workshopId)
    );

    const querySnapshot = await getDocs(q);
    
    // Ordenar en memoria en lugar de en Firestore
    const facturas = querySnapshot.docs
      .map(doc => doc.data() as Factura)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    let nextNumber = 1;
    if (facturas.length > 0) {
      const lastNumero = facturas[0].numeroFactura.split('-').pop();
      if (lastNumero) {
        nextNumber = parseInt(lastNumero) + 1;
      }
    }

    return `${prefix}-${year}${month}-${nextNumber.toString().padStart(5, '0')}`;
  }

  /**
   * Crear factura desde una orden de trabajo completada
   */
  async createFactura(
    data: CreateFacturaData
  ): Promise<ApiResponse<Factura>> {
    try {
      console.log('📄 Creando factura para OT:', data.ordenTrabajoId);

      // 1. Obtener orden de trabajo
      const otDoc = await getDoc(doc(db, 'ordenesTrabajo', data.ordenTrabajoId));
      if (!otDoc.exists()) {
        return {
          success: false,
          message: 'Orden de trabajo no encontrada',
          error: 'OT_NOT_FOUND',
        };
      }

      const ot = otDoc.data();

      // 2. Verificar que la OT esté completada
      if (ot.estado !== 'completada') {
        return {
          success: false,
          message: 'La orden de trabajo debe estar completada para generar factura',
          error: 'OT_NOT_COMPLETED',
        };
      }

      // 3. Verificar si ya existe factura para esta OT
      const existingFacturaQuery = query(
        collection(db, 'facturas'),
        where('ordenTrabajoId', '==', data.ordenTrabajoId)
      );
      const existingFacturaSnapshot = await getDocs(existingFacturaQuery);
      
      if (!existingFacturaSnapshot.empty) {
        return {
          success: false,
          message: 'Ya existe una factura para esta orden de trabajo',
          error: 'FACTURA_ALREADY_EXISTS',
          data: existingFacturaSnapshot.docs[0].data() as Factura,
        };
      }

      // 4. Obtener información del vehículo
      const vehicleDoc = await getDoc(doc(db, 'vehicles', ot.vehiculoId));
      if (!vehicleDoc.exists()) {
        return {
          success: false,
          message: 'Vehículo no encontrado',
          error: 'VEHICLE_NOT_FOUND',
        };
      }
      const vehicle = vehicleDoc.data();

      // 5. Obtener información del cliente
      const clientDoc = await getDoc(doc(db, 'users', vehicle.clienteId));
      if (!clientDoc.exists()) {
        return {
          success: false,
          message: 'Cliente no encontrado',
          error: 'CLIENT_NOT_FOUND',
        };
      }
      const client = clientDoc.data();

      // 6. Obtener información del mecánico
      const mechanicDoc = await getDoc(doc(db, 'users', ot.mecanicoId));
      if (!mechanicDoc.exists()) {
        return {
          success: false,
          message: 'Mecánico no encontrado',
          error: 'MECHANIC_NOT_FOUND',
        };
      }
      const mechanic = mechanicDoc.data();

      // 7. Obtener información del taller
      const workshopDoc = await getDoc(doc(db, 'workshops', ot.workshopId));
      const workshop = workshopDoc.exists() ? workshopDoc.data() : {};

      // 8. Construir detalles de la factura
      const detalles: DetalleFactura[] = [];

      // Agregar tareas
      if (ot.tareasAprobadas && ot.tareasAprobadas.length > 0) {
        ot.tareasAprobadas.forEach((tarea: any) => {
          detalles.push({
            descripcion: `${tarea.nombre} - ${tarea.descripcion}`,
            cantidad: 1,
            precioUnitario: tarea.precioEstimado,
            total: tarea.precioEstimado,
          });
        });
      }

      // Agregar mano de obra si hay
      if (ot.horasTrabajadas && ot.horasTrabajadas > 0 && ot.costoManoObra) {
        detalles.push({
          descripcion: `Mano de obra (${ot.horasTrabajadas}h)`,
          cantidad: ot.horasTrabajadas,
          precioUnitario: ot.costoManoObra / ot.horasTrabajadas,
          total: ot.costoManoObra,
        });
      }

      // Agregar repuestos
      if (ot.repuestosUsados && ot.repuestosUsados.length > 0) {
        ot.repuestosUsados.forEach((repuesto: any) => {
          detalles.push({
            descripcion: `Repuesto: ${repuesto.nombre}`,
            cantidad: repuesto.cantidad,
            precioUnitario: repuesto.precio,
            total: repuesto.precio * repuesto.cantidad,
          });
        });
      }

      // 9. Calcular totales
      const subtotal = detalles.reduce((sum, item) => sum + item.total, 0);
      const iva = subtotal * 0.13; // 13% IVA Costa Rica
      const total = subtotal + iva;

      // 10. Generar número de factura
      const numeroFactura = await this.generateNumeroFactura(ot.workshopId);

      // 11. Crear factura
      const facturaRef = doc(collection(db, 'facturas'));
      const facturaId = facturaRef.id;

      // ⭐ CREAR OBJETO SIN VALORES UNDEFINED
      const facturaData: any = {
        id: facturaId,
        numeroFactura,
        ordenTrabajoId: data.ordenTrabajoId,
        ordenNumero: ot.numeroOT,
        mecanicoId: ot.mecanicoId,
        mecanicoNombre: mechanic.nombre_completo,
        clienteId: vehicle.clienteId,
        clienteNombre: client.nombre_completo,
        vehiculoId: ot.vehiculoId,
        vehiculoInfo: `${vehicle.marca} ${vehicle.modelo} - ${vehicle.placa}`,
        workshopId: ot.workshopId,
        workshopNombre: workshop.nombre || 'Taller Mecánico',
        fecha: new Date().toISOString(),
        detalles,
        subtotal,
        iva,
        total,
        metodoPago: data.metodoPago || 'efectivo',
        estado: 'generada',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // ⭐ AGREGAR CAMPOS OPCIONALES SOLO SI TIENEN VALOR
      if (client.cedula) facturaData.clienteCedula = client.cedula;
      if (client.email) facturaData.clienteEmail = client.email;
      if (client.phone) facturaData.clienteTelefono = client.phone;
      if (workshop.direccion) facturaData.workshopDireccion = workshop.direccion;
      if (workshop.telefono) facturaData.workshopTelefono = workshop.telefono;
      if (workshop.email) facturaData.workshopEmail = workshop.email;
      if (data.observaciones) facturaData.observaciones = data.observaciones;

      // Guardar en Firestore
      await setDoc(facturaRef, facturaData);

      // Crear objeto de retorno (puede incluir undefined para TypeScript)
      const newFactura: Factura = {
        id: facturaId,
        numeroFactura,
        ordenTrabajoId: data.ordenTrabajoId,
        ordenNumero: ot.numeroOT,
        mecanicoId: ot.mecanicoId,
        mecanicoNombre: mechanic.nombre_completo,
        clienteId: vehicle.clienteId,
        clienteNombre: client.nombre_completo,
        clienteCedula: client.cedula,
        clienteEmail: client.email,
        clienteTelefono: client.phone,
        vehiculoId: ot.vehiculoId,
        vehiculoInfo: `${vehicle.marca} ${vehicle.modelo} - ${vehicle.placa}`,
        workshopId: ot.workshopId,
        workshopNombre: workshop.nombre || 'Taller Mecánico',
        workshopDireccion: workshop.direccion,
        workshopTelefono: workshop.telefono,
        workshopEmail: workshop.email,
        fecha: new Date().toISOString(),
        detalles,
        subtotal,
        iva,
        total,
        metodoPago: data.metodoPago || 'efectivo',
        observaciones: data.observaciones,
        estado: 'generada',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('✅ Factura creada:', numeroFactura);
      console.log(`   Total: ₡${total.toLocaleString()}`);

      return {
        success: true,
        message: `Factura ${numeroFactura} generada exitosamente`,
        data: newFactura,
      };
    } catch (error: any) {
      console.error('❌ Error creando factura:', error);
      return {
        success: false,
        message: 'Error al generar factura',
        error: error.message || 'SERVER_ERROR',
      };
    }
  }

  /**
   * Obtener factura por ID
   */
  async getFacturaById(facturaId: string): Promise<ApiResponse<Factura>> {
    try {
      const facturaDoc = await getDoc(doc(db, 'facturas', facturaId));

      if (!facturaDoc.exists()) {
        return {
          success: false,
          message: 'Factura no encontrada',
        };
      }

      const factura = { id: facturaDoc.id, ...facturaDoc.data() } as Factura;

      return {
        success: true,
        message: 'Factura encontrada',
        data: factura,
      };
    } catch (error) {
      console.error('❌ Error obteniendo factura:', error);
      return {
        success: false,
        message: 'Error al obtener factura',
      };
    }
  }

  /**
   * Obtener facturas por mecánico
   * VERSIÓN SIN ÍNDICES: Ordena en memoria
   */
  async getFacturasByMecanico(mecanicoId: string): Promise<ApiResponse<Factura[]>> {
    try {
      const q = query(
        collection(db, 'facturas'),
        where('mecanicoId', '==', mecanicoId)
      );

      const querySnapshot = await getDocs(q);
      const facturas: Factura[] = [];

      querySnapshot.forEach((doc) => {
        facturas.push({ id: doc.id, ...doc.data() } as Factura);
      });

      // Ordenar en memoria
      facturas.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return {
        success: true,
        message: 'Facturas obtenidas',
        data: facturas,
      };
    } catch (error) {
      console.error('❌ Error obteniendo facturas:', error);
      return {
        success: false,
        message: 'Error al obtener facturas',
        data: [],
      };
    }
  }

  /**
   * Obtener facturas por taller
   * VERSIÓN SIN ÍNDICES: Ordena en memoria
   */
  async getFacturasByWorkshop(workshopId: string): Promise<ApiResponse<Factura[]>> {
    try {
      const q = query(
        collection(db, 'facturas'),
        where('workshopId', '==', workshopId)
      );

      const querySnapshot = await getDocs(q);
      const facturas: Factura[] = [];

      querySnapshot.forEach((doc) => {
        facturas.push({ id: doc.id, ...doc.data() } as Factura);
      });

      // Ordenar en memoria
      facturas.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return {
        success: true,
        message: 'Facturas obtenidas',
        data: facturas,
      };
    } catch (error) {
      console.error('❌ Error obteniendo facturas:', error);
      return {
        success: false,
        message: 'Error al obtener facturas',
        data: [],
      };
    }
  }

  /**
   * Obtener factura por orden de trabajo
   */
  async getFacturaByOrdenTrabajo(ordenTrabajoId: string): Promise<ApiResponse<Factura>> {
    try {
      const q = query(
        collection(db, 'facturas'),
        where('ordenTrabajoId', '==', ordenTrabajoId)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return {
          success: false,
          message: 'No existe factura para esta orden de trabajo',
        };
      }

      const factura = { 
        id: querySnapshot.docs[0].id, 
        ...querySnapshot.docs[0].data() 
      } as Factura;

      return {
        success: true,
        message: 'Factura encontrada',
        data: factura,
      };
    } catch (error) {
      console.error('❌ Error obteniendo factura:', error);
      return {
        success: false,
        message: 'Error al obtener factura',
      };
    }
  }

  /**
   * Marcar factura como pagada
   */
  async marcarComoPagada(facturaId: string): Promise<ApiResponse> {
    try {
      const facturaRef = doc(db, 'facturas', facturaId);
      
      await setDoc(facturaRef, {
        estado: 'pagada',
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      return {
        success: true,
        message: 'Factura marcada como pagada',
      };
    } catch (error) {
      console.error('❌ Error:', error);
      return {
        success: false,
        message: 'Error al actualizar factura',
      };
    }
  }

  /**
   * Anular factura
   */
  async anularFactura(facturaId: string): Promise<ApiResponse> {
    try {
      const facturaRef = doc(db, 'facturas', facturaId);
      
      await setDoc(facturaRef, {
        estado: 'anulada',
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      return {
        success: true,
        message: 'Factura anulada',
      };
    } catch (error) {
      console.error('❌ Error:', error);
      return {
        success: false,
        message: 'Error al anular factura',
      };
    }
  }
}

export const facturaService = new FacturaService();