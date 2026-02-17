/**
 * Tests del core de reservas
 * - Validaciones (email/teléfono/fecha)
 * - Normalización
 * - Reglas de negocio (duración, horarios)
 * - Persistencia (localStorage)
 * - Flujo completo (crearReserva)
 */

const {
  validarEmail,
  validarTelefono,
  esDiaLaboral,
  normalizarServicio,
  duracionPorServicio,
  generarHorarios,
  obtenerTurnos,
  guardarTurnos,
  obtenerHorariosOcupados,
  verificarDisponibilidad,
  crearReserva,
  formatearFecha
} = require('./reservas');

// Helpers ------------------------------------------------------------

const STORAGE_KEY = 'veterinariaHuellasTurnos';

function makeDatos(overrides = {}) {
  return {
    servicio: 'Veterinaria',
    fecha: '2026-02-16', // lunes
    hora: '09:00',
    nombreDueno: '  Juan Pérez  ',
    telefono: '123 456 789',
    email: 'JUAN@TEST.COM ',
    nombreMascota: '  Luna  ',
    especie: 'Perro',
    ...overrides
  };
}

// Mock localStorage --------------------------------------------------

function makeLocalStorageMock(initial = {}) {
  let store = { ...initial };

  return {
    getItem: jest.fn((k) => (k in store ? store[k] : null)),
    setItem: jest.fn((k, v) => { store[k] = String(v); }),
    removeItem: jest.fn((k) => { delete store[k]; }),
    clear: jest.fn(() => { store = {}; }),
    // solo para debug/testing interno si querés
    _dump: () => ({ ...store })
  };
}

beforeEach(() => {
  global.localStorage = makeLocalStorageMock();
  jest.restoreAllMocks();
});

// -------------------------------------------------------------------
// validarEmail
// -------------------------------------------------------------------
describe('validarEmail', () => {
  test.each([
    ['juan@test.com', true],
    ['juan.perez+promo@test.com', true],
    ['a@b.co', true],
    [' juan@test.com ', true], // trim
    ['juan@@test', false],
    ['juan@test', false],      // falta TLD
    ['juan@.com', false],
    ['juan.com', false],
    ['', false],
    ['   ', false],
  ])('"%s" => %s', (email, esperado) => {
    expect(validarEmail(email)).toBe(esperado);
  });
});

// -------------------------------------------------------------------
// validarTelefono
// -------------------------------------------------------------------
describe('validarTelefono', () => {
  test.each([
    ['123456789', true],
    ['123 456 789', true],     // espacios permitidos (se limpian)
    [' 123456789 ', true],     // espacios a los costados
    ['12345', false],
    ['12345678910', false],
    ['123-456-789', false],    // no se limpian guiones (regla actual)
    ['abcdefghi', false],
    ['', false],
  ])('"%s" => %s', (tel, esperado) => {
    expect(validarTelefono(tel)).toBe(esperado);
  });
});

// -------------------------------------------------------------------
// esDiaLaboral
// -------------------------------------------------------------------
describe('esDiaLaboral', () => {
  test.each([
    ['2026-02-16', true],  // lunes
    ['2026-02-17', true],  // martes
    ['2026-02-18', true],  // miércoles
    ['2026-02-19', true],  // jueves
    ['2026-02-20', true],  // viernes
    ['2026-02-21', false], // sábado
    ['2026-02-22', false], // domingo
  ])('%s => %s', (fecha, esperado) => {
    expect(esDiaLaboral(fecha)).toBe(esperado);
  });

  test('fecha inválida (string rara) => false (comportamiento esperado)', () => {
    // Ojo: con Date inválida, getDay() da NaN y includes(NaN) => false
    expect(esDiaLaboral('no-es-fecha')).toBe(false);
  });
});

// -------------------------------------------------------------------
// normalizarServicio
// -------------------------------------------------------------------
describe('normalizarServicio', () => {
  test.each([
    ['Baño', 'bano'],
    ['  Veterinaria  ', 'veterinaria'],
    ['VETERINARÍA', 'veterinaria'],
    [null, ''],
    [undefined, ''],
    [123, '123'],
  ])('"%s" => "%s"', (input, esperado) => {
    expect(normalizarServicio(input)).toBe(esperado);
  });
});

// -------------------------------------------------------------------
// duracionPorServicio
// -------------------------------------------------------------------
describe('duracionPorServicio', () => {
  test('veterinaria => 60', () => {
    expect(duracionPorServicio('Veterinaria')).toBe(60);
    expect(duracionPorServicio(' VETERINARÍA ')).toBe(60);
  });

  test('baño/estética => 30 (baño normalizado)', () => {
    expect(duracionPorServicio('Baño')).toBe(30);
    expect(duracionPorServicio('baño')).toBe(30);
  });

  test('servicio desconocido => cae al default (30)', () => {
    expect(duracionPorServicio('Corte de uñas')).toBe(30);
    expect(duracionPorServicio('')).toBe(30);
  });
});

// -------------------------------------------------------------------
// generarHorarios
// -------------------------------------------------------------------
describe('generarHorarios', () => {
  test('veterinaria: arranca 09:00 y termina 17:00 (último turno)', () => {
    const horarios = generarHorarios('Veterinaria');
    expect(horarios[0]).toBe('09:00');
    expect(horarios).toContain('17:00');
    expect(horarios).not.toContain('18:00'); // fin exclusivo
    expect(horarios.length).toBe(9); // 09,10,11,12,13,14,15,16,17
  });

  test('baño: incluye 17:30 como último turno y no pasa de 18:00', () => {
    const horarios = generarHorarios('Baño');
    expect(horarios[0]).toBe('09:00');
    expect(horarios).toContain('17:30');
    expect(horarios).not.toContain('18:00');
    expect(horarios.length).toBe(18); // 9 horas * 2 turnos por hora
  });

  test('servicio desconocido usa default (30) y genera como baño', () => {
    const horarios = generarHorarios('algo raro');
    expect(horarios[1]).toBe('09:30');
    expect(horarios).toContain('17:30');
  });
});

// -------------------------------------------------------------------
// formatearFecha
// -------------------------------------------------------------------
describe('formatearFecha', () => {
  test.each([
    ['2026-02-16', '16/02/2026'],
    ['2026-12-25', '25/12/2026'],
    ['2026-01-01', '01/01/2026'],
  ])('%s => %s', (inFecha, outFecha) => {
    expect(formatearFecha(inFecha)).toBe(outFecha);
  });
});

// -------------------------------------------------------------------
// Persistencia: obtenerTurnos / guardarTurnos
// -------------------------------------------------------------------
describe('persistencia de turnos (localStorage)', () => {
  test('obtenerTurnos: si no hay nada => []', () => {
    expect(obtenerTurnos()).toEqual([]);
    expect(localStorage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  test('obtenerTurnos: lee JSON válido', () => {
    const data = JSON.stringify([{ id: '1', servicio: 'bano' }]);
    global.localStorage = makeLocalStorageMock({ [STORAGE_KEY]: data });

    expect(obtenerTurnos()).toEqual([{ id: '1', servicio: 'bano' }]);
  });

  test('obtenerTurnos: JSON corrupto => [] y no explota', () => {
    global.localStorage = makeLocalStorageMock({ [STORAGE_KEY]: '{no-json' });
    expect(obtenerTurnos()).toEqual([]);
  });

  test('guardarTurnos: guarda y devuelve true', () => {
    const ok = guardarTurnos([{ id: '1' }]);
    expect(ok).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledTimes(1);
  });

  test('guardarTurnos: si localStorage falla => devuelve false', () => {
    localStorage.setItem.mockImplementation(() => { throw new Error('quota'); });
    const ok = guardarTurnos([{ id: '1' }]);
    expect(ok).toBe(false);
  });
});

// -------------------------------------------------------------------
// Disponibilidad: obtenerHorariosOcupados / verificarDisponibilidad
// -------------------------------------------------------------------
describe('disponibilidad de horarios', () => {
  test('obtenerHorariosOcupados filtra por servicio normalizado + fecha', () => {
    const turnos = [
      { servicio: 'bano', fecha: '2026-02-16', hora: '09:00' },
      { servicio: 'bano', fecha: '2026-02-16', hora: '09:30' },
      { servicio: 'veterinaria', fecha: '2026-02-16', hora: '09:00' },
      { servicio: 'bano', fecha: '2026-02-17', hora: '10:00' },
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(turnos));

    expect(obtenerHorariosOcupados('Baño', '2026-02-16')).toEqual(['09:00', '09:30']);
    expect(obtenerHorariosOcupados('Veterinaria', '2026-02-16')).toEqual(['09:00']);
  });

  test('verificarDisponibilidad: false si está ocupado, true si no', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { servicio: 'bano', fecha: '2026-02-16', hora: '09:00' }
    ]));

    expect(verificarDisponibilidad('Baño', '2026-02-16', '09:00')).toBe(false);
    expect(verificarDisponibilidad('Baño', '2026-02-16', '09:30')).toBe(true);
  });
});

// -------------------------------------------------------------------
// crearReserva (flujo completo)
// -------------------------------------------------------------------
describe('crearReserva', () => {
  test('rechaza email inválido con mensaje claro', () => {
    const r = crearReserva(makeDatos({ email: 'mal@@mail' }));
    expect(r.exito).toBe(false);
    expect(r.mensaje).toMatch(/email/i);
  });

  test('rechaza teléfono inválido con mensaje claro', () => {
    const r = crearReserva(makeDatos({ telefono: '123' }));
    expect(r.exito).toBe(false);
    expect(r.mensaje).toMatch(/teléfono/i);
  });

  test('rechaza sábado/domingo', () => {
    const r = crearReserva(makeDatos({ fecha: '2026-02-22' })); // domingo
    expect(r.exito).toBe(false);
    expect(r.mensaje).toMatch(/lunes a viernes/i);
  });

  test('rechaza si el horario ya está ocupado', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { servicio: 'veterinaria', fecha: '2026-02-16', hora: '09:00' }
    ]));

    const r = crearReserva(makeDatos({ servicio: 'Veterinaria', hora: '09:00' }));
    expect(r.exito).toBe(false);
    expect(r.mensaje).toMatch(/no está disponible/i);
  });

  test('crea reserva y normaliza datos antes de guardar', () => {
    // Controlamos Date.now() para que el test sea determinista
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const r = crearReserva(makeDatos());
    expect(r.exito).toBe(true);

    // verifica normalizaciones
    expect(r.turno.id).toBe('1700000000000');
    expect(r.turno.servicio).toBe('veterinaria');
    expect(r.turno.telefono).toBe('123456789');
    expect(r.turno.email).toBe('juan@test.com');
    expect(r.turno.nombreDueno).toBe('Juan Pérez');
    expect(r.turno.nombreMascota).toBe('Luna');

    // y que efectivamente se guardó
    const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(guardado).toHaveLength(1);
    expect(guardado[0].id).toBe('1700000000000');
  });

  test('si falla guardarTurnos, devuelve error de guardado', () => {
    // Hacemos fallar el setItem a propósito
    localStorage.setItem.mockImplementation(() => { throw new Error('quota'); });

    const r = crearReserva(makeDatos());
    expect(r.exito).toBe(false);
    expect(r.mensaje).toMatch(/Error al guardar/i);
  });
});
