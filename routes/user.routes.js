import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticateToken } from '../middlewares/auth-middleware.js';

const router = Router();

// actualizar datos del usuario
router.put('/profile', authenticateToken, UserController.updateProfileUser);

export default router;
