import { calcularNuevoEstadoOp, type ChequeEstado } from './auto-cierre.utils';

describe('calcularNuevoEstadoOp', () => {
  // ── Caso: quedan cheques VIGENTES → sin cambio ──────────────────────────────

  it('retorna null si hay cheques VIGENTES todavía', () => {
    const cheques: ChequeEstado[] = [
      { id: '1', estado: 'VIGENTE' },
      { id: '2', estado: 'VIGENTE' },
    ];
    expect(calcularNuevoEstadoOp(cheques, '1', 'COBRADO')).toBeNull();
  });

  it('retorna null si solo se cobraron algunos y quedan VIGENTES', () => {
    const cheques: ChequeEstado[] = [
      { id: '1', estado: 'COBRADO' },
      { id: '2', estado: 'VIGENTE' },
      { id: '3', estado: 'VIGENTE' },
    ];
    expect(calcularNuevoEstadoOp(cheques, '2', 'COBRADO')).toBeNull();
  });

  // ── Caso: todos COBRADOS → operación COBRADA ────────────────────────────────

  it('retorna COBRADO cuando el último cheque se cobra y todos están COBRADOS', () => {
    const cheques: ChequeEstado[] = [
      { id: '1', estado: 'COBRADO' },
      { id: '2', estado: 'COBRADO' },
      { id: '3', estado: 'VIGENTE' }, // ← el que se está actualizando
    ];
    expect(calcularNuevoEstadoOp(cheques, '3', 'COBRADO')).toBe('COBRADO');
  });

  it('retorna COBRADO con un solo cheque que se cobra', () => {
    const cheques: ChequeEstado[] = [
      { id: '1', estado: 'VIGENTE' },
    ];
    expect(calcularNuevoEstadoOp(cheques, '1', 'COBRADO')).toBe('COBRADO');
  });

  // ── Caso: resultado mixto → EN_COBRANZA ────────────────────────────────────

  it('retorna EN_COBRANZA cuando hay un cheque devuelto y el resto se cobra', () => {
    const cheques: ChequeEstado[] = [
      { id: '1', estado: 'DEVUELTO' },
      { id: '2', estado: 'COBRADO' },
      { id: '3', estado: 'VIGENTE' },
    ];
    expect(calcularNuevoEstadoOp(cheques, '3', 'COBRADO')).toBe('EN_COBRANZA');
  });

  it('retorna EN_COBRANZA cuando el último cheque queda PROTESTADO', () => {
    const cheques: ChequeEstado[] = [
      { id: '1', estado: 'COBRADO' },
      { id: '2', estado: 'COBRADO' },
      { id: '3', estado: 'VIGENTE' },
    ];
    expect(calcularNuevoEstadoOp(cheques, '3', 'PROTESTADO')).toBe('EN_COBRANZA');
  });

  it('retorna EN_COBRANZA cuando todos están devueltos', () => {
    const cheques: ChequeEstado[] = [
      { id: '1', estado: 'DEVUELTO' },
      { id: '2', estado: 'DEVUELTO' },
      { id: '3', estado: 'VIGENTE' },
    ];
    expect(calcularNuevoEstadoOp(cheques, '3', 'DEVUELTO')).toBe('EN_COBRANZA');
  });

  // ── Edge cases ──────────────────────────────────────────────────────────────

  it('usa el nuevo estado del cheque actualizado, no el anterior', () => {
    // Cheque "1" estaba VIGENTE, se actualiza a COBRADO
    // Cheque "2" ya estaba COBRADO
    // → todos cobrados → COBRADO
    const cheques: ChequeEstado[] = [
      { id: '1', estado: 'VIGENTE' },
      { id: '2', estado: 'COBRADO' },
    ];
    expect(calcularNuevoEstadoOp(cheques, '1', 'COBRADO')).toBe('COBRADO');
  });

  it('no cambia el estado si el cheque actualizado sigue VIGENTE', () => {
    const cheques: ChequeEstado[] = [
      { id: '1', estado: 'VIGENTE' },
      { id: '2', estado: 'COBRADO' },
    ];
    // actualizar cheque 1 a VIGENTE (sin cambio real) → quedan VIGENTES
    expect(calcularNuevoEstadoOp(cheques, '1', 'VIGENTE')).toBeNull();
  });
});
