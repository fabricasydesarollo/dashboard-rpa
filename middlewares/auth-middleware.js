// auth-middleware.js
import jwt from 'jsonwebtoken'
import { SECRET_JWT_KEY } from '../config.js'

export function authenticateToken(req, res, next) {
  const token = req.cookies.access_token
  if (!token) return res.sendStatus(401) // Unauthorized

  try {
    const decoded = jwt.verify(token, SECRET_JWT_KEY)
    const { user_id} = decoded
    
    req.user = { user_id }
    next()
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado' }) // Forbidden
  }
}
