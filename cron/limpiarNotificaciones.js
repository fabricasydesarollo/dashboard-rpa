import cron from 'node-cron';
import { Op } from 'sequelize';
import { Notificacion } from '../models/Notificacion.js';

cron.schedule('0 3 * * *', async () => {
  console.log('CRON: ejecutando limpieza...');
  try {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 21);

    const eliminadas = await Notificacion.destroy({
      where: {
        createdAt: { [Op.lt]: fechaLimite },
      }
    });
    console.log('CRON: Notificaciones eliminadas:', eliminadas);
  } catch (error) {
    console.error('CRON ERROR:', error);
  }
});
