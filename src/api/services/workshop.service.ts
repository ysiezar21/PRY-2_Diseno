// workshop.service.ts
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

// ✅ CAMBIA ESTO
const API_URL = '/api';

class WorkshopService {
  async createWorkshop(data: CreateWorkshopData): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_URL}/create-workshop-with-owner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Error al crear el taller',
          error: result.error
        };
      }

      console.log('✅ Taller y usuario creados exitosamente');

      return result;

    } catch (error) {
      console.error('Error en createWorkshop:', error);
      return {
        success: false,
        message: 'Error de conexión. Asegúrate de que el backend esté corriendo.',
        error: 'NETWORK_ERROR'
      };
    }
  }

  async getAllWorkshops(): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${API_URL}/workshops`);
      
      if (!response.ok) {
        throw new Error('Error al obtener talleres');
      }

      const workshops = await response.json();
      
      return {
        success: true,
        message: 'Talleres obtenidos exitosamente',
        data: workshops
      };
    } catch (error) {
      console.error('Error en getAllWorkshops:', error);
      return {
        success: false,
        message: 'Error al obtener talleres',
        data: []
      };
    }
  }

  async getWorkshopById(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_URL}/workshops`);
      const workshops = await response.json();
      const workshop = workshops.find((w: any) => w.id === id);

      if (!workshop) {
        return {
          success: false,
          message: 'Taller no encontrado',
        };
      }

      return {
        success: true,
        message: 'Taller encontrado',
        data: workshop
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al buscar taller',
      };
    }
  }
}

export const workshopService = new WorkshopService();