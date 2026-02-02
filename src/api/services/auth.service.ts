// src/api/services/auth.service.ts

import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  getAuth,
} from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
} from 'firebase/firestore';
import { auth, db, firebaseConfig } from '../config/firebase.config';

// ============================================
// INTERFACES
// ============================================

export interface User {
  id: string;
  cedula: string;
  nombre_completo: string;
  email: string;
  role: 'web_owner' | 'workshop_owner' | 'mechanic' | 'client';
  workshopId?: string;
  workshopsId?: string[]; // Para web_owner que puede tener múltiples talleres
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

// ============================================
// SERVICIO DE AUTENTICACIÓN
// ============================================

class AuthService {
  /**
   * Inicia sesión con email y contraseña
   */
  async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<{ token: string; user: Omit<User, 'password'> }>> {
    try {
      // 1. Autenticar con Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      // 2. Obtener el token de autenticación
      const token = await userCredential.user.getIdToken();

      // 3. Obtener datos adicionales del usuario desde Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

      if (!userDoc.exists()) {
        await signOut(auth);
        return {
          success: false,
          message: 'Usuario no encontrado en la base de datos',
        };
      }

      const userData = userDoc.data() as User;

      // 4. Guardar en localStorage para persistencia
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      console.log('✅ Login exitoso:', userData.email);

      return {
        success: true,
        message: 'Login exitoso',
        data: {
          token,
          user: userData,
        },
      };
    } catch (error: any) {
      console.error('❌ Error en login:', error);

      let message = 'Error al iniciar sesión';

      // Mensajes de error personalizados según el código de Firebase
      switch (error.code) {
        case 'auth/user-not-found':
          message = 'No existe una cuenta con este correo';
          break;
        case 'auth/wrong-password':
          message = 'Contraseña incorrecta';
          break;
        case 'auth/invalid-email':
          message = 'Correo electrónico inválido';
          break;
        case 'auth/user-disabled':
          message = 'Esta cuenta ha sido deshabilitada';
          break;
        case 'auth/too-many-requests':
          message = 'Demasiados intentos fallidos. Intenta más tarde';
          break;
        case 'auth/invalid-credential':
          message = 'Credenciales inválidas';
          break;
        default:
          message = error.message || 'Error al iniciar sesión';
      }

      return {
        success: false,
        message,
        error: error.code,
      };
    }
  }

  /**
   * Registra un nuevo usuario
   */
  async register(data: RegisterData): Promise<ApiResponse<User>> {
    try {
      // 1. Verificar si el email ya existe
      const emailExists = await this.emailExists(data.email);
      if (emailExists) {
        return {
          success: false,
          message: 'Este correo electrónico ya está registrado',
          error: 'EMAIL_EXISTS',
        };
      }

      // 2. Crear cuenta de usuario
      const result = await this.createUserAccount(
        data.email,
        data.password,
        {
          cedula: data.cedula,
          nombre_completo: data.nombre_completo,
          email: data.email,
          role: data.role,
          phone: data.phone,
          address: data.address,
        }
      );

      return result;
    } catch (error: any) {
      console.error('❌ Error en registro:', error);
      return {
        success: false,
        message: 'Error al registrar usuario',
        error: error.message || 'SERVER_ERROR',
      };
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('✅ Logout exitoso');
    } catch (error) {
      console.error('❌ Error en logout:', error);
      // Limpiar localStorage de todas formas
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  /**
   * Obtiene el usuario actual desde localStorage
   */
  getCurrentUser(): Omit<User, 'password'> | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Obtiene todos los usuarios (solo para admin)
   */
  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users: User[] = [];

      usersSnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as User);
      });

      return users;
    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      return [];
    }
  }

  /**
   * Verifica si un email ya está registrado en Firestore
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('❌ Error verificando email:', error);
      return false;
    }
  }

  /**
   * Crea un nuevo usuario en Firebase Auth y Firestore
   * NOTA: Este método es interno y generalmente se usa desde otros servicios
   */
  async createUserAccount(
    email: string,
    password: string,
    userData: Omit<User, 'id' | 'createdAt'>
  ): Promise<ApiResponse<User>> {
    try {
      // 1. Crear usuario en Firebase Auth
      // IMPORTANTE:
      // - createUserWithEmailAndPassword(auth, ...) cambia la sesión actual (firma como el nuevo usuario).
      // - Eso rompe el flujo del administrador (pierde permisos y falla la creación de vehículo/valoración/etc.).
      // Solución: usar un Auth secundario (app secundaria) para crear cuentas sin afectar la sesión activa.

      const SECONDARY_APP_NAME = 'secondary-auth';
      const existing = getApps().find((a) => a.name === SECONDARY_APP_NAME);
      const secondaryApp = existing ?? initializeApp(firebaseConfig, SECONDARY_APP_NAME);
      const secondaryAuth = getAuth(secondaryApp);

      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password
      );

      const userId = userCredential.user.uid;

      // 2. Crear documento del usuario en Firestore
      const newUser: User = {
        ...userData,
        id: userId,
        createdAt: new Date().toISOString(),
      };

      // se crea una copia limpia quitandole los valores undefined
      const userToSave = Object.fromEntries(
        Object.entries(newUser).filter(([_, value]) => value !== undefined)
      );

      await setDoc(doc(db, 'users', userId), userToSave);

      // 3. Cerrar sesión del auth secundario para evitar dejar credenciales vivas
      await signOut(secondaryAuth);

      console.log('✅ Usuario creado en Firebase:', newUser.email);

      return {
        success: true,
        message: 'Usuario creado exitosamente',
        data: newUser,
      };
    } catch (error: any) {
      console.error('❌ Error creando usuario:', error);

      let message = 'Error al crear usuario';

      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'Este correo ya está registrado';
          break;
        case 'auth/invalid-email':
          message = 'Correo electrónico inválido';
          break;
        case 'auth/weak-password':
          message = 'La contraseña debe tener al menos 6 caracteres';
          break;
        default:
          message = error.message || 'Error al crear usuario';
      }

      return {
        success: false,
        message,
        error: error.code,
      };
    }
  }
}

export const authService = new AuthService();