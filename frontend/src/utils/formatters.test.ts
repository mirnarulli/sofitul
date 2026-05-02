import { describe, it, expect } from 'vitest';
import {
  formatGs,
  formatDate,
  diasHasta,
  calcularInteres,
  calcularDias,
} from './formatters';

// ── formatGs ──────────────────────────────────────────────────────────────────

describe('formatGs', () => {
  it('formatea un número positivo con separador de miles', () => {
    // Locale es-PY usa punto como separador de miles
    const result = formatGs(1000000);
    expect(result).toContain('1');
    expect(result).toContain('000');
    expect(result).toMatch(/^Gs\./);
  });

  it('retorna — para null', () => {
    expect(formatGs(null)).toBe('—');
  });

  it('retorna — para undefined', () => {
    expect(formatGs(undefined)).toBe('—');
  });

  it('retorna — para string vacío', () => {
    expect(formatGs('')).toBe('—');
  });

  it('parsea strings numéricos', () => {
    const result = formatGs('500000');
    expect(result).toMatch(/^Gs\./);
    expect(result).not.toBe('—');
  });

  it('retorna — para string no numérico', () => {
    expect(formatGs('abc')).toBe('—');
  });

  it('formatea cero', () => {
    expect(formatGs(0)).toMatch(/^Gs\./);
  });
});

// ── formatDate ────────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('retorna — para null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('retorna — para undefined', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('retorna — para string vacío', () => {
    expect(formatDate('')).toBe('—');
  });

  it('formatea una fecha ISO YYYY-MM-DD', () => {
    const result = formatDate('2024-03-15');
    // es-PY: dd/mm/aaaa
    expect(result).toMatch(/15/);
    expect(result).toMatch(/03/);
    expect(result).toMatch(/2024/);
  });
});

// ── calcularInteres ───────────────────────────────────────────────────────────

describe('calcularInteres', () => {
  it('calcula interés mensual completo (30 días)', () => {
    // 1.000.000 al 5% mensual por 30 días = 50.000
    expect(calcularInteres(1_000_000, 5, 30)).toBe(50_000);
  });

  it('calcula interés proporcional (15 días = mitad del mes)', () => {
    expect(calcularInteres(1_000_000, 5, 15)).toBe(25_000);
  });

  it('retorna 0 con monto 0', () => {
    expect(calcularInteres(0, 5, 30)).toBe(0);
  });

  it('retorna 0 con tasa 0', () => {
    expect(calcularInteres(1_000_000, 0, 30)).toBe(0);
  });
});

// ── calcularDias ──────────────────────────────────────────────────────────────

describe('calcularDias', () => {
  it('calcula días entre dos fechas', () => {
    expect(calcularDias('2024-01-01', '2024-01-31')).toBe(30);
  });

  it('retorna 0 para misma fecha', () => {
    expect(calcularDias('2024-06-01', '2024-06-01')).toBe(0);
  });

  it('retorna negativo si fin < inicio', () => {
    expect(calcularDias('2024-06-15', '2024-06-01')).toBeLessThan(0);
  });
});

// ── diasHasta — solo verifica el tipo de retorno (depende de fecha del sistema) ──

describe('diasHasta', () => {
  it('retorna un número', () => {
    const d = diasHasta('2099-12-31');
    expect(typeof d).toBe('number');
  });

  it('retorna positivo para fecha futura lejana', () => {
    expect(diasHasta('2099-12-31')).toBeGreaterThan(0);
  });

  it('retorna negativo para fecha pasada', () => {
    expect(diasHasta('2000-01-01')).toBeLessThan(0);
  });
});

// ── formatGs — casos adicionales ──────────────────────────────────────────────

describe('formatGs — casos adicionales', () => {
  it('formatea número negativo', () => {
    const result = formatGs(-500000);
    expect(result).toMatch(/^Gs\./);
    expect(result).toContain('-');
  });

  it('parsea número decimal y trunca (sin coma decimal)', () => {
    // es-PY usa coma como separador decimal; el resultado no debe tener ","
    const result = formatGs(1500.75);
    expect(result).toMatch(/^Gs\./);
    expect(result).not.toContain(',');   // no debe quedar decimal en el resultado
  });

  it('formatea NaN como —', () => {
    expect(formatGs(NaN)).toBe('—');
  });

  it('parsea string con decimales', () => {
    const result = formatGs('250000.5');
    expect(result).toMatch(/^Gs\./);
  });
});

// ── calcularInteres — casos adicionales ───────────────────────────────────────

describe('calcularInteres — casos adicionales', () => {
  it('redondea al entero más cercano', () => {
    // 100.000 al 5% mensual por 10 días → 100000 * 0.05 * (10/30) = 1666.67 → 1667
    expect(calcularInteres(100_000, 5, 10)).toBe(1667);
  });

  it('maneja días mayores a 30', () => {
    // 1.000.000 al 5% por 60 días = 100.000
    expect(calcularInteres(1_000_000, 5, 60)).toBe(100_000);
  });

  it('retorna 0 con días 0', () => {
    expect(calcularInteres(1_000_000, 5, 0)).toBe(0);
  });
});

// ── calcularDias — casos adicionales ──────────────────────────────────────────

describe('calcularDias — casos adicionales', () => {
  it('calcula días cruzando año', () => {
    expect(calcularDias('2023-12-25', '2024-01-04')).toBe(10);
  });

  it('calcula mes de febrero año bisiesto', () => {
    expect(calcularDias('2024-02-01', '2024-03-01')).toBe(29);
  });

  it('calcula mes de febrero año normal', () => {
    expect(calcularDias('2023-02-01', '2023-03-01')).toBe(28);
  });
});
