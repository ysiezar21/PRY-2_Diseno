// src/types/index.ts

// ============================================
// DEFINICIÓN DE TIPOS Y INTERFACES DEL SISTEMA
// ============================================
// Este archivo contiene todas las interfaces y tipos principales
// que se utilizan en toda la aplicación para mantener consistencia
// en los datos que se manejan.

// ============================================
// INTERFACE: Usuario del Sistema
// ============================================
// Define la estructura completa de un usuario en el sistema.
// Incluye información personal, rol y datos adicionales según el tipo de usuario.
export interface User {
  // Identificador único del usuario generado por la base de datos
  id: string;
  
  // Cédula de identidad del usuario (documento de identificación)
  cedula: string;
  
  // Nombre completo del usuario tal como aparece en sus documentos
  nombre_completo: string;
  
  // Correo electrónico único para login y comunicaciones
  email: string;
  
  // Rol del usuario en el sistema que determina sus permisos:
  // - web_owner: Dueño de la plataforma (administrador general)
  // - workshop_owner: Dueño de un taller mecánico
  // - mechanic: Mecánico que trabaja en un taller
  // - client: Cliente que solicita servicios
  role: 'web_owner' | 'workshop_owner' | 'mechanic' | 'client';
  
  // ID del taller al que pertenece (solo para workshop_owner y mechanic)
  // Es opcional porque los web_owner y client no están asociados a un taller
  workshopId?: string;
  
  // Fecha y hora de creación de la cuenta en formato ISO
  createdAt: string;
  
  // Número de teléfono del usuario (opcional)
  phone?: string;
  
  // Dirección física del usuario (opcional)
  address?: string;
  
  // Especialidad del mecánico (ej: "Motor", "Transmisión", "Frenos")
  // Solo aplica para usuarios con rol 'mechanic'
  specialty?: string;
}

// ============================================
// INTERFACE: Credenciales de Inicio de Sesión
// ============================================
// Datos necesarios para que un usuario inicie sesión en el sistema
export interface LoginCredentials {
  // Correo electrónico registrado en el sistema
  email: string;
  
  // Contraseña del usuario (se envía encriptada al backend)
  password: string;
}

// ============================================
// INTERFACE: Datos de Registro de Usuario
// ============================================
// Información requerida para crear una nueva cuenta en el sistema
export interface RegisterData {
  // Cédula de identidad (debe ser única en el sistema)
  cedula: string;
  
  // Nombre completo del nuevo usuario
  nombre_completo: string;
  
  // Correo electrónico (debe ser único en el sistema)
  email: string;
  
  // Contraseña que el usuario eligió (mínimo 6 caracteres)
  password: string;
  
  // Rol que tendrá el usuario en el sistema
  role: 'web_owner' | 'workshop_owner' | 'mechanic' | 'client';
  
  // Teléfono de contacto (opcional al registrarse)
  phone?: string;
  
  // Dirección del usuario (opcional al registrarse)
  address?: string;
}

// ============================================
// INTERFACE: Respuesta Estándar de la API
// ============================================
// Estructura genérica que usa el backend para todas sus respuestas.
// El tipo T permite definir qué tipo de datos se espera en 'data'
export interface ApiResponse<T = any> {
  // Indica si la operación fue exitosa (true) o falló (false)
  success: boolean;
  
  // Mensaje descriptivo sobre el resultado de la operación
  // Ej: "Usuario creado exitosamente" o "Error al iniciar sesión"
  message: string;
  
  // Datos devueltos por el servidor (opcional)
  // El tipo T se define según lo que se espere recibir
  data?: T;
  
  // Mensaje de error detallado cuando success es false (opcional)
  error?: string;
}

// ============================================
// TYPE: Rol de Usuario
// ============================================
// Tipo auxiliar que extrae solo los roles posibles de la interface User.
// Útil para validaciones y comparaciones de roles sin repetir código.
export type UserRole = User['role'];