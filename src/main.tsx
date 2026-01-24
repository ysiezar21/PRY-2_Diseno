// src/main.tsx

// ============================================
// PUNTO DE ENTRADA DE LA APLICACIÓN
// ============================================
// Este es el primer archivo que se ejecuta cuando se carga la aplicación.
// Se encarga de montar el componente principal (App) en el DOM del navegador.

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// ============================================
// MONTAJE DE LA APLICACIÓN EN EL DOM
// ============================================
// Busca el elemento HTML con id "root" en el archivo index.html
// y lo convierte en el contenedor principal de nuestra aplicación React
ReactDOM.createRoot(document.getElementById('root')!).render(
  
  // StrictMode: Modo estricto de React que ayuda a detectar problemas potenciales
  // - Activa advertencias adicionales en desarrollo
  // - Detecta efectos secundarios inesperados
  // - Verifica el uso de APIs obsoletas
  // NOTA: Solo funciona en desarrollo, no afecta la versión de producción
  <React.StrictMode>
    
    {/* Componente principal que contiene toda la aplicación */}
    <App />
    
  </React.StrictMode>,
)