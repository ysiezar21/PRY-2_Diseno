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

interface Vehicle {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  año: number;
  color?: string;
  clienteId: string;
  trabajos: Trabajo[];
  createdAt: string;
}

interface Trabajo {
  id: string;
  fecha: string;
  mecanicoId: string;
  descripcion: string;
  costo: number;
  reparaciones: string[];
}

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

// Rutas de archivos JSON
const WORKSHOPS_PATH = path.join(__dirname, '..', 'src', 'api', 'mock', 'workshops.json');
const USERS_PATH = path.join(__dirname, '..', 'src', 'api', 'mock', 'users.json');
const VEHICLES_PATH = path.join(__dirname, '..', 'src', 'api', 'mock', 'vehicles.json');

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

// ==================== TALLERES ====================

app.post('/api/create-workshop-with-owner', async (req: Request, res: Response) => {
  try {
    const { nombre, cedulaDueno, nombreDueno, email, password, phone, address } = req.body;

    if (!nombre || !cedulaDueno || !nombreDueno || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos',
      });
    }

    const workshops = await readJsonFile<Workshop>(WORKSHOPS_PATH);
    const users = await readJsonFile<User>(USERS_PATH);

    const emailExists = workshops.some((w) => w.email === email) || users.some((u) => u.email === email);

    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un taller o usuario con ese correo electrónico',
        error: 'DUPLICATE_EMAIL',
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
      trabajos: [],
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
      address,
    };

    const webOwner = users.find((u) => u.role === 'web_owner');
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
          password: undefined,
        },
      },
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: 'SERVER_ERROR',
    });
  }
});

// ==================== MECÁNICOS ====================

app.post('/api/mechanics', async (req: Request, res: Response) => {
  try {
    const { cedula, nombre_completo, email, password, phone, specialty, workshopId } = req.body;

    if (!cedula || !nombre_completo || !email || !password || !workshopId) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos',
      });
    }

    const users = await readJsonFile<User>(USERS_PATH);

    const emailExists = users.some((u) => u.email === email);
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un usuario con ese correo electrónico',
        error: 'DUPLICATE_EMAIL',
      });
    }

    const workshops = await readJsonFile<Workshop>(WORKSHOPS_PATH);
    const workshopExists = workshops.some((w) => w.id === workshopId);
    if (!workshopExists) {
      return res.status(404).json({
        success: false,
        message: 'Taller no encontrado',
      });
    }

    const newMechanic: User = {
      id: (users.length + 1).toString(),
      cedula,
      nombre_completo,
      email,
      password,
      role: 'mechanic',
      workshopId,
      createdAt: new Date().toISOString(),
      phone,
      specialty,
    };

    users.push(newMechanic);
    await writeJsonFile(USERS_PATH, users);

    console.log('✅ Mecánico creado:', newMechanic.nombre_completo);

    res.status(201).json({
      success: true,
      message: 'Mecánico creado exitosamente',
      data: {
        ...newMechanic,
        password: undefined,
      },
    });
  } catch (error) {
    console.error('❌ Error creando mecánico:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: 'SERVER_ERROR',
    });
  }
});

app.get('/api/mechanics', async (req: Request, res: Response) => {
  try {
    const { workshopId } = req.query;

    const users = await readJsonFile<User>(USERS_PATH);

    let mechanics = users.filter((u) => u.role === 'mechanic');

    if (workshopId) {
      mechanics = mechanics.filter((m) => m.workshopId === workshopId);
    }

    const mechanicsWithoutPassword = mechanics.map((m) => ({
      ...m,
      password: undefined,
    }));

    res.json(mechanicsWithoutPassword);
  } catch (error) {
    console.error('❌ Error obteniendo mecánicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener mecánicos',
    });
  }
});

app.delete('/api/mechanics/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const users = await readJsonFile<User>(USERS_PATH);

    const mechanicIndex = users.findIndex((u) => u.id === id && u.role === 'mechanic');

    if (mechanicIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Mecánico no encontrado',
      });
    }

    const deletedMechanic = users[mechanicIndex];
    users.splice(mechanicIndex, 1);

    await writeJsonFile(USERS_PATH, users);

    console.log('✅ Mecánico eliminado:', deletedMechanic.nombre_completo);

    res.json({
      success: true,
      message: 'Mecánico eliminado exitosamente',
    });
  } catch (error) {
    console.error('❌ Error eliminando mecánico:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar mecánico',
    });
  }
});

// ==================== CLIENTES ====================

app.post('/api/clients', async (req: Request, res: Response) => {
  try {
    const { cedula, nombre_completo, email, password, phone, address, vehiculo } = req.body;

    if (!cedula || !nombre_completo || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos',
      });
    }

    const users = await readJsonFile<User>(USERS_PATH);

    const emailExists = users.some((u) => u.email === email);
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un usuario con ese correo electrónico',
        error: 'DUPLICATE_EMAIL',
      });
    }

    const newClient: User = {
      id: (users.length + 1).toString(),
      cedula,
      nombre_completo,
      email,
      password,
      role: 'client',
      createdAt: new Date().toISOString(),
      phone,
      address,
    };

    users.push(newClient);
    await writeJsonFile(USERS_PATH, users);

    console.log('✅ Cliente creado:', newClient.nombre_completo);

    let newVehicle = null;

    // Si se proporcionó información del vehículo, crearlo
    if (vehiculo && vehiculo.placa && vehiculo.marca && vehiculo.modelo) {
      const vehicles = await readJsonFile<Vehicle>(VEHICLES_PATH);

      newVehicle = {
        id: (vehicles.length + 1).toString(),
        placa: vehiculo.placa,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        año: vehiculo.año || new Date().getFullYear(),
        color: vehiculo.color,
        clienteId: newClient.id,
        trabajos: [],
        createdAt: new Date().toISOString(),
      };

      vehicles.push(newVehicle);
      await writeJsonFile(VEHICLES_PATH, vehicles);

      console.log('✅ Vehículo creado:', newVehicle.placa);
    }

    res.status(201).json({
      success: true,
      message: newVehicle ? 'Cliente y vehículo creados exitosamente' : 'Cliente creado exitosamente',
      data: {
        client: {
          ...newClient,
          password: undefined,
        },
        vehicle: newVehicle,
      },
    });
  } catch (error) {
    console.error('❌ Error creando cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: 'SERVER_ERROR',
    });
  }
});

app.get('/api/clients', async (req: Request, res: Response) => {
  try {
    const users = await readJsonFile<User>(USERS_PATH);

    const clients = users.filter((u) => u.role === 'client');

    const clientsWithoutPassword = clients.map((c) => ({
      ...c,
      password: undefined,
    }));

    res.json(clientsWithoutPassword);
  } catch (error) {
    console.error('❌ Error obteniendo clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener clientes',
    });
  }
});

app.delete('/api/clients/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const users = await readJsonFile<User>(USERS_PATH);

    const clientIndex = users.findIndex((u) => u.id === id && u.role === 'client');

    if (clientIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado',
      });
    }

    const deletedClient = users[clientIndex];
    users.splice(clientIndex, 1);

    await writeJsonFile(USERS_PATH, users);

    console.log('✅ Cliente eliminado:', deletedClient.nombre_completo);

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente',
    });
  } catch (error) {
    console.error('❌ Error eliminando cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cliente',
    });
  }
});

// ==================== VEHÍCULOS ====================

app.post('/api/vehicles', async (req: Request, res: Response) => {
  try {
    const { placa, marca, modelo, año, color, clienteId } = req.body;

    if (!placa || !marca || !modelo || !año || !clienteId) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos',
      });
    }

    const vehicles = await readJsonFile<Vehicle>(VEHICLES_PATH);

    // Validar placa única
    const placaExists = vehicles.some((v) => v.placa === placa);
    if (placaExists) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un vehículo con esa placa',
        error: 'DUPLICATE_PLACA',
      });
    }

    // Validar que el cliente existe
    const users = await readJsonFile<User>(USERS_PATH);
    const clientExists = users.some((u) => u.id === clienteId && u.role === 'client');
    if (!clientExists) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado',
      });
    }

    const newVehicle: Vehicle = {
      id: (vehicles.length + 1).toString(),
      placa,
      marca,
      modelo,
      año: parseInt(año),
      color,
      clienteId,
      trabajos: [],
      createdAt: new Date().toISOString(),
    };

    vehicles.push(newVehicle);
    await writeJsonFile(VEHICLES_PATH, vehicles);

    console.log('✅ Vehículo creado:', newVehicle.placa);

    res.status(201).json({
      success: true,
      message: 'Vehículo creado exitosamente',
      data: newVehicle,
    });
  } catch (error) {
    console.error('❌ Error creando vehículo:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: 'SERVER_ERROR',
    });
  }
});

app.get('/api/vehicles', async (req: Request, res: Response) => {
  try {
    const { clienteId } = req.query;

    let vehicles = await readJsonFile<Vehicle>(VEHICLES_PATH);

    if (clienteId) {
      vehicles = vehicles.filter((v) => v.clienteId === clienteId);
    }

    res.json(vehicles);
  } catch (error) {
    console.error('❌ Error obteniendo vehículos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener vehículos',
    });
  }
});

app.delete('/api/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const vehicles = await readJsonFile<Vehicle>(VEHICLES_PATH);

    const vehicleIndex = vehicles.findIndex((v) => v.id === id);

    if (vehicleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Vehículo no encontrado',
      });
    }

    const deletedVehicle = vehicles[vehicleIndex];
    vehicles.splice(vehicleIndex, 1);

    await writeJsonFile(VEHICLES_PATH, vehicles);

    console.log('✅ Vehículo eliminado:', deletedVehicle.placa);

    res.json({
      success: true,
      message: 'Vehículo eliminado exitosamente',
    });
  } catch (error) {
    console.error('❌ Error eliminando vehículo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar vehículo',
    });
  }
});

// ==================== UTILIDADES ====================

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
  console.log(` Servidor en http://localhost:${PORT}`);
  console.log(` Modo: ${IS_PRODUCTION ? 'PRODUCCIÓN' : 'DESARROLLO'}`);
  console.log(' =====================================');
});