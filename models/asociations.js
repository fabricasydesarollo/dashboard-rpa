import { Bot } from './Bot.js';
import { Registro } from './Registro.js';
import { UsuarioBot } from './UsuarioBot.js';
import { User } from './User.js';
import { SolicitudUsuario } from './SolicitudUsuario.js';
import { Paciente } from './Paciente.js';
import { HistoriaClinica } from './HistoriaClinica.js';
import { TrazabilidadEnvio } from './TrazabilidadEnvio.js';
import { Notificacion } from './Notificacion.js';
import { RegistroGeneral } from './RegistroGeneral.js';
import { AutorizacionBot } from './AutorizacionBot.js';
import { Maquina } from './Maquina.js';
import { Log } from './Log.js';
import { NotaCreditoMasiva } from './NotaCreditoMasiva.js';


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

//  Un registro pertenece a una solicitud (opcional)
Registro.belongsTo(SolicitudUsuario, {
  foreignKey: 'solicitud_id',
  onDelete: 'CASCADE' // o CASCADE si quieres borrarlos en cadena
});

User.hasMany(SolicitudUsuario, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
});
//  Una solicitud puede tener muchos registros
SolicitudUsuario.hasOne(Registro, {
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

// Bot -> TrazabilidadEnvios
Bot.hasMany(TrazabilidadEnvio, {
  foreignKey: 'bot_id',
  onDelete: 'CASCADE'
});
TrazabilidadEnvio.belongsTo(Bot, {
  foreignKey: 'bot_id'
});

// asociaciones de las notificaciones

//  Un usuario puede tener muchas notificaciones
User.hasMany(Notificacion, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE'
});

//  Una notificación pertenece a un usuario
Notificacion.belongsTo(User, {
  foreignKey: 'user_id'
});

// Bot -> RegistroGeneral
Bot.hasMany(RegistroGeneral, {
  foreignKey: 'bot_id',
  onDelete: 'CASCADE'
});
RegistroGeneral.belongsTo(Bot, {
  foreignKey: 'bot_id'
});

// Bot -> Log
Bot.hasMany(Log, {
  foreignKey: 'bot_id',
  onDelete: 'CASCADE'
});
Log.belongsTo(Bot, {
  foreignKey: 'bot_id'
});

// Paciente -> Autorizaciones
Paciente.hasMany(AutorizacionBot, {
  foreignKey: 'paciente_id',
  onDelete: 'SET NULL'  // si se elimina un paciente, las autorizaciones no se borran, solo se setea null
});

// Autorización -> Paciente
AutorizacionBot.belongsTo(Paciente, {
  foreignKey: 'paciente_id'
});

// Bot -> Autorizaciones
Bot.hasMany(AutorizacionBot, {
  foreignKey: 'bot_id',
  onDelete: 'CASCADE', // o SET NULL si quieres conservar historial aunque el bot se elimine
});

// Autorización -> Bot
AutorizacionBot.belongsTo(Bot, {
  foreignKey: 'bot_id'
});


// relaciones de Maquina
// Bot -> Maquinas
Bot.hasMany(Maquina, {
  foreignKey: 'bot_id',
  onDelete: 'CASCADE'
});

// Maquina -> Bot
Maquina.belongsTo(Bot, {
  foreignKey: 'bot_id'
});

// esto sera para cuando necesite cargar los registros asociados a una maquina -----------------------------------------

/*// Maquina -> Registros 
Maquina.hasMany(Registro, {
  foreignKey: 'maquina_id',
  onDelete: 'SET NULL'  //para conservar histórico
});

// Registro -> Maquina
Registro.belongsTo(Maquina, {
  foreignKey: 'maquina_id'
});

Maquina.hasMany(Registro, {
  foreignKey: 'maquina_id',
  onDelete: 'SET NULL'  //para conservar histórico
});

// RegistroGeneral -> Maquina
RegistroGeneral.belongsTo(Maquina, {
  foreignKey: 'maquina_id'
});

Maquina.hasMany(RegistroGeneral, {
  foreignKey: 'maquina_id',
  onDelete: 'SET NULL'  //para conservar histórico
});

// RegistroGeneral -> Maquina
RegistroGeneral.belongsTo(Maquina, {
  foreignKey: 'maquina_id'
});

// Maquina -> Trazabilidad de envíos
Maquina.hasMany(TrazabilidadEnvio, {
  foreignKey: 'maquina_id',
  onDelete: 'SET NULL'
});

// TrazabilidadEnvio -> Maquina
TrazabilidadEnvio.belongsTo(Maquina, {
  foreignKey: 'maquina_id'
});*/
//---------------------------------------------------------------------------------------------------------------------------
// Maquina -> Logs
Maquina.hasMany(Log, {
  foreignKey: 'maquina_id',
  onDelete: 'SET NULL'
});

// Log -> Maquina
Log.belongsTo(Maquina, {
  foreignKey: 'maquina_id'
});

// asociaciones de NotaCreditoMasiva---------------------------------------------------------------------------------
Bot.hasMany(NotaCreditoMasiva, {
  foreignKey: 'bot_id',
  onDelete: 'CASCADE'
});

NotaCreditoMasiva.belongsTo(Bot, {
  foreignKey: 'bot_id'
});

Maquina.hasMany(NotaCreditoMasiva, {
  foreignKey: 'maquina_id',
  onDelete: 'SET NULL'
});

NotaCreditoMasiva.belongsTo(Maquina, {
  foreignKey: 'maquina_id'
});



