import usersData from '../mock/users.json';

export interface User {
  id: string;
  cedula: string;
  nombre_completo: string;
  email: string;
  password: string;
  role: 'web_owner' | 'workshop_owner' | 'mechanic' | 'client';
  workshopId?: string;
  createdAt: string;
  phone?: string;
  address?: string;
  specialty?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  cedula: string;
  nombre_completo: string;
  email: string;
  password: string;
  role: 'web_owner' | 'workshop_owner' | 'mechanic' | 'client';
  phone?: string;
  address?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

class AuthService {
  // Usar los datos directamente del JSON
  private users: User[];

  constructor() {
    // Asegurar que tenemos un array
    if (Array.isArray(usersData)) {
      this.users = usersData;
    } else if (usersData && typeof usersData === 'object') {
      // Si es un objeto con propiedad default
      this.users = Array.isArray(usersData.default) ? usersData.default : [];
    } else {
      this.users = [];
    }
    

  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ token: string; user: Omit<User, 'password'> }>> {
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Buscar usuario exacto
    const user = this.users.find(u => 
      u.email === credentials.email && 
      u.password === credentials.password
    );

    if (!user) {

      return {
        success: false,
        message: 'Correo o contraseña incorrectos'
      };
    }


    
    const token = `mock-jwt-token-${user.id}-${Date.now()}`;
    const { password, ...userWithoutPassword } = user;

    // Guardar en localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userWithoutPassword));

    return {
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: userWithoutPassword
      }
    };
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getCurrentUser(): Omit<User, 'password'> | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // NO modificar usuarios, solo lectura
  getAllUsers(): Omit<User, 'password'>[] {
    return this.users.map(({ password, ...user }) => user);
  }
}

export const authService = new AuthService();