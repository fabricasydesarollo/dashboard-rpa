import { Bot } from './Bot.js';
import { Registro } from './Registro.js';
import { UsuarioBot } from './UsuarioBot.js';
import { User } from './User.js';
import { SolicitudUsuario } from './SolicitudUsuario.js';


User.belongsToMany(Bot, {
  through: UsuarioBot,
  foreignKey: 'user_id',
  otherKey: 'bot_id',
});

Bot.belongsToMany(User, {
  through: UsuarioBot,
  foreignKey: 'bot_id',
  otherKey: 'user_id',
});

Bot.hasMany(Registro, {
  foreignKey: 'bot_id',
  onDelete: 'CASCADE',
});


Registro.belongsTo(Bot, {
  foreignKey: 'bot_id',
});

// 🔹 Un registro pertenece a una solicitud (opcional)
Registro.belongsTo(SolicitudUsuario, {
  foreignKey: 'solicitud_id',
  onDelete: 'CASCADE' // o CASCADE si quieres borrarlos en cadena
});

User.hasMany(SolicitudUsuario, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
});
// 🔹 Una solicitud puede tener muchos registros
SolicitudUsuario.hasMany(Registro, {
  foreignKey: 'solicitud_id',
  onDelete: 'CASCADE'
});

SolicitudUsuario.belongsTo(User, { foreignKey: 'user_id' });

Bot.hasMany(SolicitudUsuario, { foreignKey: 'bot_id', onDelete: 'CASCADE' });
SolicitudUsuario.belongsTo(Bot, { foreignKey: 'bot_id' });
