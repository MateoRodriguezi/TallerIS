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

// --- Control admin: mostrar/ocultar secciones y listar reservas ---
(function(){
  // Si no existe arreglo reservas, lo creamos con precarga
  if (typeof reservas === 'undefined' || !Array.isArray(reservas)) {
    window.reservas = [
      { cliente: "Ana Pérez", mascota: "Luna", servicio: "Consulta veterinaria", fecha: "2026-02-15--", hora: "09:00" },
      { cliente: "Carlos Gómez", mascota: "Max", servicio: "Estética/Baño", fecha: "2026-02-15", hora: "10:00" },
      { cliente: "María Rodríguez", mascota: "Nina", servicio: "Consulta veterinaria", fecha: "2026-02-15", hora: "11:00" },
      { cliente: "José Fernández", mascota: "Rocky", servicio: "Estética/Baño", fecha: "2026-02-15", hora: "12:00" },
      { cliente: "Lucía Silva", mascota: "Toby", servicio: "Consulta veterinaria", fecha: "2026-02-15", hora: "13:00" },
      { cliente: "Martín López", mascota: "Milo", servicio: "Estética/Baño", fecha: "2026-02-15", hora: "14:00" },
      { cliente: "Sofía Cabrera", mascota: "Kira", servicio: "Consulta veterinaria", fecha: "2026-02-15", hora: "15:00" },
      { cliente: "Diego Torres", mascota: "Simba", servicio: "Estética/Baño", fecha: "2026-02-15", hora: "16:00" },
      { cliente: "Valentina Méndez", mascota: "Coco", servicio: "Consulta veterinaria", fecha: "2026-02-15", hora: "17:00" },
      { cliente: "Federico Castro", mascota: "Bella", servicio: "Estética/Baño", fecha: "2026-02-16", hora: "09:00" },
      { cliente: "Camila Duarte", mascota: "Zeus", servicio: "Consulta veterinaria", fecha: "2026-02-16", hora: "10:00" },
      { cliente: "Agustín Morales", mascota: "Lola", servicio: "Estética/Baño", fecha: "2026-02-16", hora: "11:00" },
      { cliente: "Florencia Rivas", mascota: "Bruno", servicio: "Consulta veterinaria", fecha: "2026-02-16", hora: "12:00" },
      { cliente: "Sebastián Núñez", mascota: "Mora", servicio: "Estética/Baño", fecha: "2026-02-16", hora: "13:00" },
      { cliente: "Paula Hernández", mascota: "Leo", servicio: "Consulta veterinaria", fecha: "2026-02-16", hora: "14:00" },
      { cliente: "Gonzalo Martínez", mascota: "Nala", servicio: "Estética/Baño", fecha: "2026-02-16", hora: "15:00" },
      { cliente: "Carolina Vega", mascota: "Tommy", servicio: "Consulta veterinaria", fecha: "2026-02-16", hora: "16:00" },
      { cliente: "Rodrigo Pereira", mascota: "Maya", servicio: "Estética/Baño", fecha: "2026-02-16", hora: "17:00" },
      { cliente: "Julieta Ramos", mascota: "Chispa", servicio: "Consulta veterinaria", fecha: "2026-02-17", hora: "09:00" },
      { cliente: "Nicolás Sosa", mascota: "Duke", servicio: "Estética/Baño", fecha: "2026-02-17", hora: "10:00" }
    ];
  }

  // Referencias UI
  const loginForm = document.getElementById('loginForm') || null;
  const loginSection = document.getElementById('login') || null;
  const adminPanel = document.getElementById('adminPanel');
  const listarBtn = document.getElementById('listarBtn');
  const cerrarSesionBtn = document.getElementById('cerrarSesionBtn');
  const tablaWrapper = document.getElementById('tablaWrapper');
  const tabla = document.getElementById('tablaReservas');

  // Secciones públicas a ocultar al loguear
  const sectionsToHide = [
    document.querySelector('.hero'),
    document.querySelector('#servicios'),
    document.getElementById('reservar'),
    document.querySelector('.mobile-preview'),
    document.querySelector('#galeria'),
    document.querySelector('.footer')
  ];

  // Función para ocultar todas las secciones públicas
  function ocultarSeccionesPublicas() {
    sectionsToHide.forEach(s => { if (s) s.style.display = 'none'; });
  }
  function mostrarSeccionesPublicas() {
    sectionsToHide.forEach(s => { if (s) s.style.display = ''; });
  }

  // Manejo del submit del login (usa el formulario que ya tienes)
  if (loginForm) {
    loginForm.addEventListener('submit', function(e){
      e.preventDefault();
      // toma valores (adapta ids si usas otros)
      const usuario = (document.getElementById('nombreUsuario') || document.getElementById('usuario') || {}).value || '';
      const pass = (document.getElementById('password') || {}).value || '';

      if (usuario.trim() === 'admin' && pass.trim() === '1234') {
        ocultarSeccionesPublicas();
        // mostrar panel admin y botones
        if (adminPanel) adminPanel.style.display = 'block';
        if (listarBtn) listarBtn.style.display = 'inline-block';
        if (cerrarSesionBtn) cerrarSesionBtn.style.display = 'inline-block';
        // ocultar el formulario de login
        if (loginSection) loginSection.style.display = 'none';
        alert('Bienvenido Administrador');
      } else {
        alert('Usuario o contraseña incorrectos');
      }
    });
  }

  // Listar reservas: solo cuando admin haga click
  if (listarBtn) {
    listarBtn.addEventListener('click', function(){
      const tbody = tabla.querySelector('tbody');
      tbody.innerHTML = ''; // limpiar
      // Ordenar por fecha y hora (opcional)
      const copia = reservas.slice().sort((a,b) => {
        if (a.fecha === b.fecha) return a.hora.localeCompare(b.hora);
        return a.fecha.localeCompare(b.fecha);
      });
      copia.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${r.cliente}</td>
          <td>${r.mascota}</td>
          <td>${r.servicio}</td>
          <td>${r.fecha}</td>
          <td>${r.hora}</td>
        `;
        tbody.appendChild(tr);
      });
      tablaWrapper.style.display = 'block';
      tabla.style.display = 'table';
      tabla.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // Cerrar sesión: volver al estado público
  if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener('click', function(){
      // ocultar panel admin
      if (adminPanel) adminPanel.style.display = 'none';
      // ocultar tabla y botones
      if (tablaWrapper) tablaWrapper.style.display = 'none';
      if (listarBtn) listarBtn.style.display = 'none';
      if (cerrarSesionBtn) cerrarSesionBtn.style.display = 'none';
      // mostrar secciones públicas
      mostrarSeccionesPublicas();
      // limpiar login inputs si existen
      const u = document.getElementById('nombreUsuario') || document.getElementById('usuario');
      const p = document.getElementById('password');
      if (u) u.value = '';
      if (p) p.value = '';
      // opcional: scroll al inicio
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();



