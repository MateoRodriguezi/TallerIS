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
