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
      // 1) Mandamos email real
      enviarEmailConfirmacion(resultado.turno)
        .then(() => {
          // 2) Si salió OK, mostramos confirmación y reseteamos
          mostrarConfirmacion(resultado.turno);
          formReserva.reset();
          cargarHorariosVacios();
          ocultarError();
        })
        .catch((error) => {
          console.error("EmailJS error:", error);
          // La reserva ya quedó guardada igual, pero avisamos
          mostrarError("La reserva se guardó, pero hubo un error enviando el email.");
        });

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

    if (!fecha) {
      cargarHorariosVacios();
      return;
    }

    if (!servicio) {
      selectHora.innerHTML = '<option value="">Selecciona un servicio</option>';
      return;
    }

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
