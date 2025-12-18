import passport from 'passport'
import { Strategy as MicrosoftStrategy } from 'passport-microsoft'
import { User } from '../models/User.js'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()
const BASE_URL = process.env.BASE_URL
const PORT = process.env.PORT || 8000
const clientId = process.env.client_id
const clientSecret = process.env.client_secret
const portPart = PORT === '443' ? '' : `:${PORT}`

// 🔹 Obtener perfil completo de Microsoft Graph
async function getMicrosoftProfile(accessToken) {
  const response = await axios.get("https://graph.microsoft.com/v1.0/me?$select=displayName,mail,jobTitle,department,companyName,officeLocation", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return response.data
}

passport.use(
    new MicrosoftStrategy(
    {
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: `${BASE_URL}${portPart}/api/auth/microsoft/callback`,
      scope: ['openid', 'profile', 'email', 'User.Read'],
      tenant: process.env.TENANT_ID, // CLAVE
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        const email = profile.emails?.[0]?.value
        const nombreDesdeMicrosoft =
          profile.displayName ||
          `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim()

        if (!email) return done(new Error('No se pudo obtener el correo electrónico del perfil de Microsoft'))

        //  Validar dominio corporativo
        if (!email.endsWith('@zentria.com.co')) {
          return done(null, { invalidDomain: true })
        }

        //  Buscar el usuario
        let user = await User.findOne({ where: { email } })
        if (!user) {
          // ❌ No crear usuario automáticamente
          console.log(`Usuario no registrado: ${email}`)
          return done(null, { notRegistered: true }) // respuesta personalizada
        }
        //  Obtener datos adicionales (jobTitle, companyName, etc)
        /*const microsoftProfile = await getMicrosoftProfile(accessToken)
        const cargo = microsoftProfile.jobTitle || null
        const empresa = microsoftProfile.companyName || null
        const departamento = microsoftProfile.department || null
        //console.log('profile: ',microsoftProfile);*/
        
        //  Intentar obtener la foto desde Microsoft Graph
        let photoUrl = null
        try {
          const response = await axios.get('https://graph.microsoft.com/v1.0/me/photo/$value', {
            headers: { Authorization: `Bearer ${accessToken}` },
            responseType: 'arraybuffer',
          })
          const base64Image = Buffer.from(response.data, 'binary').toString('base64')
          photoUrl = `data:image/jpeg;base64,${base64Image}`
        } catch (error) {
          console.log('⚠️ No se pudo obtener la foto de perfil:', error.response?.status)
        }

  
        if (user) {
          //  Si el usuario ya existe, actualiza campos vacíos o nulos
          let updated = false

          if ((!user.nombre || user.nombre.trim() === '') && nombreDesdeMicrosoft) {
            user.nombre = nombreDesdeMicrosoft
            updated = true
          }
          if (photoUrl) {
            user.foto_perfil = photoUrl
            updated = true
          }

          if (updated) await user.save()
        }

        return done(null, user)
      } catch (err) {
        console.error('❌ Error en autenticación Microsoft:', err)
        return done(err)
      }
    }
  )
)
