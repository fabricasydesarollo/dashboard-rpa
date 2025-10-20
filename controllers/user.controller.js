import jwt from 'jsonwebtoken';
import { UserRepository } from '../services/repositories/user-repository.js';


export const UserController = {
  async getSolicitudes(req, res) {
    try {
      const { user_id, rol } = req.query;

      const solicitudes = await UserRepository.getSolicitudes( user_id, rol);
      res.status(200).json(solicitudes);
    } catch (err) {
      console.error(err);
      return res.status(err.status || 400).json({ error: err.error || 'Error al obtener las solicitudes' });
    }
  },
  // funcion para crear un nuevo usuario
  async createUser(req, res) {
    try {
      const { email, nombre, rol } = req.body;
      const newUser = await UserRepository.createUser(email, nombre, rol);
      res.status(201).json({ message: 'Usuario creado correctamente', user: newUser });
    }
    catch (err) {
      console.error(err);
      return res.status(err.status || 400).json({ error: err.error || 'Error al crear el usuario' });
    } 
  },
  // funcion para eliminar el usuario por id
  async deleteUser(req, res) {
    try {
      const { userId } = req.query;
      console.log('desde controller', userId);
      
      await UserRepository.deleteUser(userId);
      res.status(200).json({ message: 'Usuario eliminado correctamente' });
    } catch (err) {
      console.error(err);
      return res.status(err.status || 400).json({ error: err.error || 'Error al eliminar el usuario' });
    }
  }


};

