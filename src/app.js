/*
src/app.js
Interacción con la página
addEventListener
Lectura de inputs
Mostrar errores / mensajes
Guardar y leer del localStorage
Llama funciones del core
❌ No validaciones complejas
❌ No reglas de negocio
*/

document.addEventListener('DOMContentLoaded', function () {

  const formReserva = document.getElementById('formReserva');
  if (!formReserva) return;

  const inputFecha = document.getElementById('fecha');
  const selectHora = document.getElementById('hora');
  const selectServicio = document.getElementById('servicio');
  const inputTelefono = document.getElementById('telefono');
  const mensajeError = document.getElementById('mensajeError');

  // ✅ UX HU03: no mostrar opciones inválidas → hora deshabilitada hasta tener servicio + fecha
  selectHora.disabled = true;

  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);
  inputFecha.min = manana.toISOString().split('T')[0];

  inputTelefono.addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9]/g, '');
  });

  inputFecha.addEventListener('change', function () {
    const fecha = this.value;

    if (!fecha) {
      cargarHorariosVacios();
      return;
    }

    if (!esDiaLaboral(fecha)) {
      mostrarError('Solo puedes reservar turnos de lunes a viernes');
      this.value = '';
      cargarHorariosVacios();
      return;
    }

    ocultarError();
    actualizarHorariosDisponibles();
  });

  selectServicio.addEventListener('change', function () {
    actualizarHorariosDisponibles();
  });

  function enviarEmailConfirmacion(turno) {
    const params = {
      email: turno.email,
      mascota: turno.nombreMascota,
      servicio: turno.servicio,
      fecha: formatearFecha(turno.fecha),
      hora: turno.hora
    };

    return emailjs.send(
      "service_7pautcp",
      "template_35ivlqm",
      params,
      "8yxTf1yMGfmQKL_Kr"
    );
  }

  // ------------------------------------------

  formReserva.addEventListener('submit', function (e) {
    e.preventDefault();

    const datos = {
      servicio: selectServicio.value,
      fecha: inputFecha.value,
      hora: selectHora.value,
      nombreDueno: document.getElementById('nombreDueno').value,
      telefono: inputTelefono.value,
      email: document.getElementById('email').value,
      nombreMascota: document.getElementById('nombreMascota').value,
      especie: document.getElementById('especie').value
    };

    const resultado = crearReserva(datos);

    if (resultado.exito) {
      enviarEmailConfirmacion(resultado.turno)
        .then(() => {
          mostrarConfirmacion(resultado.turno);
          formReserva.reset();
          cargarHorariosVacios();
          ocultarError();
        })
        .catch((error) => {
          console.error("EmailJS error:", error);
          mostrarError("La reserva se guardó, pero hubo un error enviando el email.");
        });
    } else {
      mostrarError(resultado.mensaje);
    }
  });

  function cargarHorariosVacios() {
    selectHora.disabled = true;
    selectHora.innerHTML = '<option value="">Selecciona servicio y fecha</option>';
  }

  function actualizarHorariosDisponibles() {
    const servicio = selectServicio.value;
    const fecha = inputFecha.value;

    // ✅ Si falta algo, no mostramos horarios “genéricos”
    if (!servicio || !fecha) {
      cargarHorariosVacios();
      return;
    }

    // ✅ Generamos horarios válidos para ese servicio
    const todosLosHorarios = generarHorarios(servicio);
    const horariosOcupados = obtenerHorariosOcupados(servicio, fecha);

    selectHora.disabled = false;
    selectHora.innerHTML = '<option value="">Selecciona una hora</option>';

    let hayDisponibles = false;

    todosLosHorarios.forEach(hora => {
      if (!horariosOcupados.includes(hora)) {
        const option = document.createElement('option');
        option.value = hora;
        option.textContent = hora;
        selectHora.appendChild(option);
        hayDisponibles = true;
      }
    });

    // ✅ Si no hay disponibles: no dejes elegir algo que va a fallar después
    if (!hayDisponibles) {
      selectHora.disabled = true;
      selectHora.innerHTML = '<option value="">Sin horarios disponibles</option>';
      mostrarError('No hay horarios disponibles para esta fecha y servicio. Intenta con otra fecha.');
    } else {
      ocultarError();
    }
  }

  function mostrarError(mensaje) {
    mensajeError.textContent = mensaje;
    mensajeError.style.display = 'flex';
    mensajeError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function ocultarError() {
    mensajeError.style.display = 'none';
  }

  function mostrarConfirmacion(turno) {
    document.getElementById('emailConfirmacion').textContent = turno.email;
    document.getElementById('resumenMascota').textContent = turno.nombreMascota;

    const servicioLindo =
      turno.servicio === 'veterinaria' ? 'Veterinaria' :
      turno.servicio === 'bano' ? 'Estética/Baño' :
      turno.servicio;

    document.getElementById('resumenServicio').textContent = servicioLindo;
    document.getElementById('resumenFecha').textContent = formatearFecha(turno.fecha);
    document.getElementById('resumenHora').textContent = turno.hora;

    document.getElementById('modalConfirmacion').style.display = 'flex';
  }

  cargarHorariosVacios();
});

function cerrarModal() {
  document.getElementById('modalConfirmacion').style.display = 'none';
}

//  Listar reservas y Login
(function(){
  // hacemos una precarga de reservas
  if (typeof reservas === 'undefined' || !Array.isArray(reservas)) {
    window.reservas = [
      { cliente: "Ana Pérez", mascota: "Luna", servicio: "Consulta veterinaria", fecha: "2026-02-15", hora: "09:00" },
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

  // Secciones publicas para ocultar cuando nos loqueamos
  const sectionsToHide = [
    document.querySelector('.hero'),
    document.querySelector('#servicios'),
    document.getElementById('reservar'),
    document.querySelector('.mobile-preview'),
    document.querySelector('#galeria'),
    document.querySelector('.footer')
  ];

  function ocultarSeccionesPublicas() {
    sectionsToHide.forEach(s => { if (s) s.style.display = 'none'; });
  }
  function mostrarSeccionesPublicas() {
    sectionsToHide.forEach(s => { if (s) s.style.display = ''; });
  }

  // Login
  if (loginForm) {
    loginForm.addEventListener('submit', function(e){
      e.preventDefault();
      const usuario = (document.getElementById('nombreUsuario') || document.getElementById('usuario') || {}).value || '';
      const pass = (document.getElementById('password') || {}).value || '';

      if (usuario.trim() === 'admin' && pass.trim() === '1234') {
        ocultarSeccionesPublicas();
        if (adminPanel) adminPanel.style.display = 'block';
        if (listarBtn) listarBtn.style.display = 'inline-block';
        if (cerrarSesionBtn) cerrarSesionBtn.style.display = 'inline-block';
        if (loginSection) loginSection.style.display = 'none';
        alert('Bienvenido Administrador');
      } else {
        alert('Usuario o contraseña incorrectos');
      }
    });
  }

  // Listamos las reservas creando la tabla
  if (listarBtn) {
    listarBtn.addEventListener('click', function(){
      const tbody = tabla.querySelector('tbody');
      tbody.innerHTML = ''; // limpiar
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

  // Cerrar sesión
  if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener('click', function(){
      // Oculatamos el panel del adminsitrador y la tabla
      if (adminPanel) adminPanel.style.display = 'none';
      if (tablaWrapper) tablaWrapper.style.display = 'none';
      if (listarBtn) listarBtn.style.display = 'none';
      if (cerrarSesionBtn) cerrarSesionBtn.style.display = 'none';
      // volvemos a mostrar las secciones publicas
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