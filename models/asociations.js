import { Bot } from './Bot.js';
import { Registro } from './Registro.js';
import { UsuarioBot } from './UsuarioBot.js';
import { User } from './User.js';
import { SolicitudUsuario } from './SolicitudUsuario.js';
import { Paciente } from './Paciente.js';
import { HistoriaClinica } from './HistoriaClinica.js';
import { TrazabilidadEnvio } from './TrazabilidadEnvio.js';


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
  onDelete: 'CASCADE',
  as: 'Registro'
});

SolicitudUsuario.belongsTo(User, { foreignKey: 'user_id' });

Bot.hasMany(SolicitudUsuario, { foreignKey: 'bot_id', onDelete: 'CASCADE' });
SolicitudUsuario.belongsTo(Bot, { foreignKey: 'bot_id' });

// Paciente -> Historias clínicas
Paciente.hasMany(HistoriaClinica, {
  foreignKey: 'paciente_id',
  onDelete: 'CASCADE'
});
HistoriaClinica.belongsTo(Paciente, {
  foreignKey: 'paciente_id'
});

// Historia clínica -> Trazabilidad de envíos
HistoriaClinica.hasMany(TrazabilidadEnvio, {
  foreignKey: 'historia_id',
  onDelete: 'CASCADE'
});
TrazabilidadEnvio.belongsTo(HistoriaClinica, {
  foreignKey: 'historia_id'
});