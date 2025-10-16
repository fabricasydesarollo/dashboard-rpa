// utils/jwtUtils.js
import jwt from 'jsonwebtoken';

export function generateToken(user, secret, expiresIn = '3h') {
  return jwt.sign(
    {
      user_id: user.id,
    },
    secret,
    { expiresIn }
  );
}
