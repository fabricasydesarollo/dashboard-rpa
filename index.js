import express from 'express'
import cors from 'cors'
import coockieParser from 'cookie-parser' // Importar cookie-parser para manejar cookies
import { testConnection } from './db/database.js';
import authRoutes from './routes/auth.routes.js'; // Ajusta el path si está en otra carpeta
import botRoutes from './routes/bot.routes.js'; // Asegúrate de que esta ruta es correcta
import socketRoutes from './routes/socket.routes.js'; // Asegúrate de que esta ruta es correcta
import http from 'http';
import https from 'https'
import fs from 'fs'
import dotenv from 'dotenv';
import { Server } from 'socket.io';
dotenv.config();

import './models/index.js' // se carga el archivo index.js de models para que se carguen los modelos

//configuracion de los puertos y dominio
const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';
const PORT = process.env.PORT || 8000;
const app = express()
app.use(express.json())
app.use(coockieParser()) // Middleware para parsear cookies

// 👉 Configurar HTTPS con certificados autofirmados
const sslOptions = {
  key: fs.readFileSync('./certs/avidanti_com.key'),     // Cambia path si están en otra carpeta
  cert: fs.readFileSync('./certs/avidanti_com.crt'),
}

// Middlewares
const allowedOrigins = [
  'https://tablerocontrol.netlify.app', // dominio de producción
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
  
let server = https.createServer(sslOptions, app);

// Configuración de Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
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

app.use('/socket/api',socketRoutes);

app.use('/bots',botRoutes);

app.use('/static', express.static('public'));

app.set('io', io); // Para usar io desde cualquier ruta con req.app.get('io')

//cambio en git

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: '¡Servidor funcionando correctamente!' })
})


// Si el BASE_URL comienza con "https", arrancar HTTPS
server.listen(PORT, async () => {
  await testConnection();
  console.log(`Servidor corriendo en ${BASE_URL}${PORT}`);
});


