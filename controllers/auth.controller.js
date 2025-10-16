import jwt from 'jsonwebtoken';
import { UserRepository } from '../services/repositories/user-repository.js';
import { SECRET_JWT_KEY } from '../config.js';
import { generateToken } from '../utils/jwtUtils.js';
import { setAuthCookie } from '../utils/cookieUtils.js';
import dotenv from 'dotenv';
dotenv.config();

const FRONTEND_REDIRECT_URL = process.env.FRONTEND_REDIRECT_URL;

export const AuthController = {
  async login(req, res) {
    const { email, password } = req.body;

    try {
      const user = await UserRepository.login({ email, password });

      const token = generateToken(user, SECRET_JWT_KEY);
      setAuthCookie(res, token);

      res.json({ user_id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, foto_perfil: user.foto_perfil });
    } catch (error) {
      res.status(error.status || 500).json(error.error || { message: 'Error al iniciar sesión' });
    }
  },

  async getUser(req, res) {
    try {
      const userId = req.user.user_id; // viene del middleware authenticateToken
      const user = await UserRepository.getById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json({ user_id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, foto_perfil: user.foto_perfil });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener el usuario' });
    }
  },

  async microsoftCallback(req, res) {
    const user = req.user;

    try {
      if (user.invalidDomain) {
        return res.redirect(`${FRONTEND_REDIRECT_URL}/?error=dominio`);
      }
      const token = generateToken(user, SECRET_JWT_KEY);
      setAuthCookie(res, token);

      res.redirect(`${FRONTEND_REDIRECT_URL}/tablero`);
    } catch (error) {
      res.redirect(`${FRONTEND_REDIRECT_URL}/?error=server`);
    }
  },

  async register(req, res) {
    //const { username, password } = req.body;
    try {
      const userId = await UserRepository.create(req.body);
      res.status(201).json({ userId });
    } catch (err) {
      console.error(err);
      if (err.error) {
        // Error estructurado con campo específico
        return res.status(err.status || 400).json({ error: err.error });
      }
    }
  },

  async logout(req, res) {
    res.clearCookie('access_token', {
      httpOnly: true,
      sameSite: 'Strict',
      secure: true,
    });
    res.json({ message: 'Sesión cerrada correctamente' });
  }
};
