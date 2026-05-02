/**
 * auto-cierre.utils.ts
 *
 * Lógica pura de auto-cierre de operaciones cuando todos los cheques
 * llegan a un estado terminal. Extraída del service para ser testeable
 * sin necesidad de mocks de base de datos.
 */

export type EstadoCheque = 'VIGENTE' | 'COBRADO' | 'DEVUELTO' | 'PROTESTADO';

export interface ChequeEstado {
  id: string;
  estado: EstadoCheque;
}

/**
 * Determina el nuevo estado de la operación tras actualizar un cheque.
 *
 * @returns
 *   - null            si quedan cheques VIGENTES (no hay cambio en la operación)
 *   - 'COBRADO'       si todos los cheques están COBRADOS
 *   - 'EN_COBRANZA'   si todos son terminales pero hay devueltos/protestados
 */
export function calcularNuevoEstadoOp(
  cheques: ChequeEstado[],
  chequeActualizadoId: string,
  nuevoEstado: EstadoCheque,
): 'COBRADO' | 'EN_COBRANZA' | null {
  const estadoEfectivo = (c: ChequeEstado) =>
    c.id === chequeActualizadoId ? nuevoEstado : c.estado;

  const todosTerminal = cheques.every(c => estadoEfectivo(c) !== 'VIGENTE');
  if (!todosTerminal) return null;

  const todosCobrados = cheques.every(c => estadoEfectivo(c) === 'COBRADO');
  return todosCobrados ? 'COBRADO' : 'EN_COBRANZA';
}
