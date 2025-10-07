import 'dotenv/config';

if (!process.env.SECRET_JWT_KEY) {
  throw new Error('Falta la variable de entorno SECRET_JWT_KEY');
}

export const SECRET_JWT_KEY = process.env.SECRET_JWT_KEY;
