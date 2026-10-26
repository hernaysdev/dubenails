import { formatoDuracion } from 'src/app/services/disponibilidad.service';

// opciones de duracion de un servicio: de 30 min a 8 h, en bloques de 30 min (se guarda en horas: 1.5 = 1 h 30 min)
export const OPCIONES_DURACION = Array.from({ length: 16 }, (_, i) => (i + 1) / 2)
  .map(horas => ({ horas, texto: formatoDuracion(horas) }));
