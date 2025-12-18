import express from 'express'
import cors from 'cors'
import coockieParser from 'cookie-parser' // Importar cookie-parser para manejar cookies
import { testConnection } from './db/database.js';
import authRoutes from './routes/auth.routes.js'; // Ajusta el path si está en otra carpeta
import botRoutes from './routes/bot.routes.js'; // 
import socketRoutes from './routes/socket.routes.js'; // 
import notificacionRoutes from './routes/notificacion.routes.js'; // 
import mailRoutes from './routes/mailRoutes.js'; // 
import userRoutes from './routes/user.routes.js'; // 
import analyticsRoutes from './routes/analytics.routes.js'; //
import http from 'http';
import https from 'https'
import fs from 'fs'
import dotenv from 'dotenv';
import { Server } from 'socket.io';
dotenv.config();

import './models/index.js' // se carga el archivo index.js de models para que se carguen los modelos
import './cron/limpiarNotificaciones.js'; // se carga el archivo de cron para limpiar notificaciones viejas

//configuracion de los puertos y dominio
const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';
const PORT = process.env.PORT || 8000;
const CERT_KEY = process.env.cert_key || null;
const CERT_CRT = process.env.cert_crt || null;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const app = express()
app.use(express.json())
app.use(coockieParser()) // Middleware para parsear cookies


// Middlewares
const allowedOrigins = [
  FRONTEND_URL, // dominio de producción
  'http://localhost:5173' // para desarrollo
];

// Configuración de CORS
app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitudes sin 'origin' (ej: desde herramientas como Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true); // origen permitido
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));
 
let server
// Crear servidor HTTPS
if (CERT_KEY === null && CERT_CRT === null) {
  console.log('🔓 Iniciando servidor HTTP');
  server = http.createServer(app);
}
else{
  console.log('🔐 Iniciando servidor HTTPS');
  
  // 👉 Configurar HTTPS con certificados autofirmados
  const sslOptions = {
    key: fs.readFileSync(`./certs/${CERT_KEY}`),     // Cambia path si están en otra carpeta
    cert: fs.readFileSync(`./certs/${CERT_CRT}`)    // Cambia path si están en otra carpeta,
  }
  server = https.createServer(sslOptions, app);
}


// Configuración de Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('🟢 Cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔴 Cliente desconectado:', socket.id);
  });
});
// para validar que el usuario esta autentificado para ingresar a las rutas se usa authenticateToken
app.use('/api/auth', authRoutes);

app.use('/api/user', userRoutes);

app.use('/api/notificaciones', notificacionRoutes);

app.use('/socket/api',socketRoutes);

app.use('/api/bots',botRoutes);

app.use('/api/mail', mailRoutes);

app.use('/api/analytics', analyticsRoutes);

app.use('/static', express.static('public'));

app.set('io', io); // Para usar io desde cualquier ruta con req.app.get('io')

//cambio en git oficina

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: '¡Servidor funcionando correctamente!' })
})
// cambio prueba git maykol

// Si el BASE_URL comienza con "https", arrancar HTTPS
server.listen(PORT, async () => {
  await testConnection();
  console.log(`Servidor corriendo en ${BASE_URL}:${PORT}`);
});


