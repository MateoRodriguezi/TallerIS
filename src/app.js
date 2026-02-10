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
    // Cuando cambia el servicio, recalculamos horarios según duración
    actualizarHorariosDisponibles();
  });

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
      mostrarConfirmacion(resultado.turno);
      formReserva.reset();
      cargarHorariosVacios();
      ocultarError();
    } else {
      mostrarError(resultado.mensaje);
    }
  });

  function cargarHorariosVacios() {
    selectHora.innerHTML = '<option value="">Primero selecciona fecha</option>';
  }

  function actualizarHorariosDisponibles() {
    const servicio = selectServicio.value;
    const fecha = inputFecha.value;

    // Si falta fecha, seguimos igual que antes
    if (!fecha) {
      cargarHorariosVacios();
      return;
    }

    // Si hay fecha pero no hay servicio, no podemos decidir 30 vs 60
    if (!servicio) {
      selectHora.innerHTML = '<option value="">Selecciona un servicio</option>';
      return;
    }

    // ✅ ACÁ está el fix: pasamos servicio al core
    const todosLosHorarios = generarHorarios(servicio);
    const horariosOcupados = obtenerHorariosOcupados(servicio, fecha);

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

    if (!hayDisponibles) {
      selectHora.innerHTML = '<option value="">No hay horarios disponibles</option>';
      mostrarError('No hay horarios disponibles para esta fecha y servicio. Intenta con otra fecha.');
    } else {
      ocultarError();
    }
  }

  function cargarTodosLosHorarios() {
    // Esto ya no tiene sentido si hay 2 duraciones distintas.
    // Lo dejamos coherente: pedimos servicio primero.
    selectHora.innerHTML = '<option value="">Selecciona un servicio</option>';
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

    // Si en el core guardaste servicio normalizado, acá capaz querés mostrarlo lindo
    document.getElementById('resumenServicio').textContent = turno.servicio;

    document.getElementById('resumenFecha').textContent = formatearFecha(turno.fecha);
    document.getElementById('resumenHora').textContent = turno.hora;

    document.getElementById('modalConfirmacion').style.display = 'flex';
  }

  cargarHorariosVacios();
});

function cerrarModal() {
  document.getElementById('modalConfirmacion').style.display = 'none';
}
