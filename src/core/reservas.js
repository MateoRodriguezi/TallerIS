/*
src/core/reservas.js
Lógica pura (testeable)
Validaciones
Verificar choques de reservas
Reglas del sistema
✔ No DOM
✔ No document
✔ No alert
*/

const CONFIG = {
  HORARIO_INICIO: 9,
  HORARIO_FIN: 18,
  DURACION_TURNO_BANO: 30,
  DURACION_TURNO_VETERINARIA: 60,
  DIAS_LABORABLES: [1, 2, 3, 4, 5],
  STORAGE_KEY: 'veterinariaHuellasTurnos'
};

function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

function validarTelefono(telefono) {
  const limpio = telefono.replace(/\s/g, '');
  const regex = /^[0-9]{9}$/;
  return regex.test(limpio);
}

function esDiaLaboral(fecha) {
  const date = new Date(fecha + 'T00:00:00');
  const dia = date.getDay();
  return CONFIG.DIAS_LABORABLES.includes(dia);
}

/**
 * Normaliza el string de servicio para evitar bugs por:
 * - mayúsculas/minúsculas
 * - espacios
 * - tildes (baño -> bano)
 */
function normalizarServicio(servicio) {
  return (servicio ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Devuelve la duración (en minutos) según el servicio.
 */
function duracionPorServicio(servicio) {
  const s = normalizarServicio(servicio);

  if (s === 'veterinaria') return CONFIG.DURACION_TURNO_VETERINARIA; // 60
  if (s === 'bano') return CONFIG.DURACION_TURNO_BANO;               // 30

  // fallback seguro
  return CONFIG.DURACION_TURNO_BANO;
}

/**
 * Genera horarios posibles para un servicio, dentro del rango laboral.
 * - veterinaria => 09:00, 10:00, 11:00...
 * - bano       => 09:00, 09:30, 10:00, 10:30...
 */
function generarHorarios(servicio) {
  const horarios = [];
  const duracion = duracionPorServicio(servicio);

  let hora = CONFIG.HORARIO_INICIO;
  let minutos = 0;

  while (hora < CONFIG.HORARIO_FIN) {
    const horaStr = hora.toString().padStart(2, '0');
    const minStr = minutos.toString().padStart(2, '0');
    horarios.push(`${horaStr}:${minStr}`);

    minutos += duracion;

    while (minutos >= 60) {
      hora++;
      minutos -= 60;
    }

    // si el próximo inicio cae fuera del horario fin, cortamos
    if (hora > CONFIG.HORARIO_FIN || (hora === CONFIG.HORARIO_FIN && minutos > 0)) {
      break;
    }
  }

  return horarios;
}

function obtenerTurnos() {
  try {
    const data = localStorage.getItem(CONFIG.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error al leer turnos:', error);
    return [];
  }
}

function guardarTurnos(turnos) {
  try {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(turnos));
    return true;
  } catch (error) {
    console.error('Error al guardar turnos:', error);
    return false;
  }
}

function obtenerHorariosOcupados(servicio, fecha) {
  const s = normalizarServicio(servicio);
  const turnos = obtenerTurnos();

  return turnos
    .filter(t => normalizarServicio(t.servicio) === s && t.fecha === fecha)
    .map(t => t.hora);
}

function verificarDisponibilidad(servicio, fecha, hora) {
  const ocupados = obtenerHorariosOcupados(servicio, fecha);
  return !ocupados.includes(hora);
}

function crearReserva(datos) {
  if (!validarEmail(datos.email)) {
    return {
      exito: false,
      mensaje: 'El formato del email es inválido. Ejemplo: usuario@email.com'
    };
  }

  if (!validarTelefono(datos.telefono)) {
    return {
      exito: false,
      mensaje: 'El teléfono debe tener exactamente 9 dígitos'
    };
  }

  if (!esDiaLaboral(datos.fecha)) {
    return {
      exito: false,
      mensaje: 'Solo se pueden agendar turnos de lunes a viernes'
    };
  }

  if (!verificarDisponibilidad(datos.servicio, datos.fecha, datos.hora)) {
    return {
      exito: false,
      mensaje: 'Este horario ya no está disponible para el servicio seleccionado'
    };
  }

  const turno = {
    id: Date.now().toString(),

    // guardamos el servicio normalizado para consistencia interna
    servicio: normalizarServicio(datos.servicio),

    fecha: datos.fecha,
    hora: datos.hora,
    nombreDueno: datos.nombreDueno.trim(),
    telefono: datos.telefono.replace(/\s/g, ''),
    email: datos.email.trim().toLowerCase(),
    nombreMascota: datos.nombreMascota.trim(),
    especie: datos.especie
  };

  const turnos = obtenerTurnos();
  turnos.push(turno);

  if (!guardarTurnos(turnos)) {
    return {
      exito: false,
      mensaje: 'Error al guardar la reserva. Intenta nuevamente.'
    };
  }

  return { exito: true, turno };
}

function formatearFecha(fecha) {
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}
