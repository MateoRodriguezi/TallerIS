function suma(a, b) {
  return a + b;
}
test('suma 2 + 3 es igual a 5', () => {
  expect(suma(2, 3)).toBe(5);
});


const {
  validarEmail,
  validarTelefono,
  esDiaLaboral,
  normalizarServicio,
  duracionPorServicio,
  generarHorarios,
  formatearFecha
} = require('./reservas');

describe('validarEmail', () => {
  test('devuelve true para un email válido', () => {
    expect(validarEmail('juan@test.com')).toBe(true);
  });

  test('devuelve false para un email inválido', () => {
    expect(validarEmail('juan@@test')).toBe(false);
  });
});

describe('validarTelefono', () => {
  test('devuelve true para un número de 9 dígitos', () => {
    expect(validarTelefono('123456789')).toBe(true);
  });

  test('El teléfono no puede tener menos de 9 dígitos', () => {
    expect(validarTelefono.length).toBeLessThan(9);
  });
  test('El teléfono no puede tener mas de 9 dígitos', () => {
    expect(validarTelefono.length).toBeGreaterThan(9);
  });
});

describe('esDiaLaboral', () => {
  test('devuelve true para un lunes', () => {
    expect(esDiaLaboral('2026-02-16')).toBe(true); // lunes
  });

  test('devuelve false para un domingo', () => {
    expect(esDiaLaboral('2026-02-22')).toBe(false); // domingo
  });
});

describe('normalizarServicio', () => {
  test('convierte "Baño" a "bano"', () => {
    expect(normalizarServicio('Baño')).toBe('bano');
  });

  test('elimina espacios y mayúsculas', () => {
    expect(normalizarServicio('Veterinaria')).toBe('veterinaria');
  });
});

describe('duracionPorServicio', () => {
  test('devuelve 60 para servicios de veterinaria', () => {
    expect(duracionPorServicio('Veterinaria')).toBe(60);
  });

  test('devuelve 30 para servicios de baño', () => {
    expect(duracionPorServicio('Baño')).toBe(30);
  });
});

describe('generarHorarios', () => {
  test('genera horarios cada 60 minutos para veterinaria', () => {
    const horarios = generarHorarios('Veterinaria');
    expect(horarios[0]).toBe('09:00');
    expect(horarios[1]).toBe('10:00');
  });

  test('genera horarios cada 30 minutos para baño', () => {
    const horarios = generarHorarios('Baño');
    expect(horarios[0]).toBe('09:00');
    expect(horarios[1]).toBe('09:30');
  });
});

describe('formatearFecha', () => {
  test('formatea fecha YYYY-MM-DD a DD/MM/YYYY', () => {
    expect(formatearFecha('2026-02-16')).toBe('16/02/2026');
  });

  test('funciona con otra fecha', () => {
    expect(formatearFecha('2026-12-25')).toBe('25/12/2026');
  });
});
