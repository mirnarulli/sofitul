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
