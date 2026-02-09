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
  DURACION_TURNO: 30,
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

function generarHorarios() {
  const horarios = [];
  let hora = CONFIG.HORARIO_INICIO;
  let minutos = 0;
  
  while (hora < CONFIG.HORARIO_FIN || (hora === CONFIG.HORARIO_FIN - 1 && minutos === 30)) {
    const horaStr = hora.toString().padStart(2, '0');
    const minStr = minutos.toString().padStart(2, '0');
    horarios.push(`${horaStr}:${minStr}`);
    
    minutos += CONFIG.DURACION_TURNO;
    if (minutos >= 60) {
      hora++;
      minutos = 0;
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
  const turnos = obtenerTurnos();
  return turnos
    .filter(t => t.servicio === servicio && t.fecha === fecha)
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
    servicio: datos.servicio,
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