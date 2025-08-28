import passport from 'passport'
import { Strategy as MicrosoftStrategy } from 'passport-microsoft'
import { User } from '../models/User.js'
import dotenv from 'dotenv';

dotenv.config();
const BASE_URL = process.env.BASE_URL;
const PORT = process.env.PORT || 8000;
const clientId = process.env.client_id;
const clientSecret = process.env.client_secret;
const portPart = PORT === "443" ? "" : `:${PORT}`;

passport.use(new MicrosoftStrategy({
    clientID: `${clientId}`,
    clientSecret: `${clientSecret}`,
    callbackURL: `${BASE_URL}${portPart}/api/auth/microsoft/callback`,
    scope: ['openid', 'profile', 'email', 'User.Read'],
  },
  async function (accessToken, refreshToken, profile, done) {
      try {
        const email = profile.emails?.[0]?.value;
        const nombreDesdeMicrosoft = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim();

        if (!email) {
          return done(new Error("No se pudo obtener el correo electrónico del perfil de Microsoft"));
        }

        let user = await User.findOne({ where: { email } });

        if (!user) {
          // Crear usuario si no existe
          user = await User.create({
            email,
            nombre: nombreDesdeMicrosoft || null,
            password: null,
            rol: 'usuario'
          });
        } else if ((!user.nombre || user.nombre.trim() === '') && nombreDesdeMicrosoft) {
          // Si ya existe pero no tiene nombre, lo actualizamos
          user.nombre = nombreDesdeMicrosoft;
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
