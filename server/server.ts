import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Workshop {
  id: string;
  nombre: string;
  cedulaDueno: string;
  nombreDueno: string;
  email: string;
  createdAt: string;
  phone?: string;
  address?: string;
  trabajos: any[];
}

interface User {
  id: string;
  cedula: string;
  nombre_completo: string;
  email: string;
  password: string;
  role: 'web_owner' | 'workshop_owner' | 'mechanic' | 'client';
  workshopId?: string;
  workshopsId?: string[];
  createdAt: string;
  phone?: string;
  address?: string;
  specialty?: string;
}

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

// Rutas de archivos JSON
const WORKSHOPS_PATH = path.join(__dirname, '..', 'src', 'api', 'mock', 'workshops.json');
const USERS_PATH = path.join(__dirname, '..', 'src', 'api', 'mock', 'users.json');

// Helper functions
async function readJsonFile<T>(filePath: string): Promise<T[]> {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error leyendo ${filePath}:`, error);
    return [];
  }
}

async function writeJsonFile<T>(filePath: string, data: T[]): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ==================== API ROUTES ====================

app.post('/api/create-workshop-with-owner', async (req: Request, res: Response) => {
  try {
    const {
      nombre,
      cedulaDueno,
      nombreDueno,
      email,
      password,
      phone,
      address
    } = req.body;

    if (!nombre || !cedulaDueno || !nombreDueno || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos'
      });
    }

    const workshops = await readJsonFile<Workshop>(WORKSHOPS_PATH);
    const users = await readJsonFile<User>(USERS_PATH);

    const emailExists = workshops.some(w => w.email === email) || 
                       users.some(u => u.email === email);
    
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un taller o usuario con ese correo electrónico',
        error: 'DUPLICATE_EMAIL'
      });
    }

    const newWorkshop: Workshop = {
      id: (workshops.length + 1).toString(),
      nombre,
      cedulaDueno,
      nombreDueno,
      email,
      createdAt: new Date().toISOString(),
      phone,
      address,
      trabajos: []
    };

    const newUser: User = {
      id: (users.length + 1).toString(),
      cedula: cedulaDueno,
      nombre_completo: nombreDueno,
      email,
      password,
      role: 'workshop_owner',
      workshopId: newWorkshop.id,
      createdAt: new Date().toISOString(),
      phone,
      address
    };

    const webOwner = users.find(u => u.role === 'web_owner');
    if (webOwner) {
      if (!webOwner.workshopsId) {
        webOwner.workshopsId = [];
      }
      webOwner.workshopsId.push(newWorkshop.id);
    }

    workshops.push(newWorkshop);
    users.push(newUser);

    await writeJsonFile(WORKSHOPS_PATH, workshops);
    await writeJsonFile(USERS_PATH, users);

    console.log('✅ Taller y usuario creados:');
    console.log('   📁 Taller:', newWorkshop.nombre);
    console.log('   👤 Usuario:', newUser.nombre_completo);

    res.status(201).json({
      success: true,
      message: 'Taller y usuario creados exitosamente',
      data: {
        workshop: newWorkshop,
        user: {
          ...newUser,
          password: undefined
        }
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: 'SERVER_ERROR'
    });
  }
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// ==================== PRODUCCIÓN ====================

if (IS_PRODUCTION) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log('🚀 =====================================');
  console.log(`✅ Servidor en http://localhost:${PORT}`);
  console.log(`📦 Modo: ${IS_PRODUCTION ? 'PRODUCCIÓN' : 'DESARROLLO'}`);
  console.log('🚀 =====================================');
});