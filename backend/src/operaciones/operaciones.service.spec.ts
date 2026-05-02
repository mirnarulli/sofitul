/**
 * Tests unitarios de OperacionesService
 * Cubre: procesarVencidas, getAlertasVencimiento, busquedaGlobal
 *
 * Se instancia el service directamente con mocks mínimos para evitar
 * la carga del módulo NestJS completo.
 */
import { OperacionesService } from './operaciones.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Crea un mock de QueryBuilder encadenable */
function makeQb(rows: unknown[] = []) {
  const qb = {
    where:     jest.fn().mockReturnThis(),
    andWhere:  jest.fn().mockReturnThis(),
    orderBy:   jest.fn().mockReturnThis(),
    getMany:   jest.fn().mockResolvedValue(rows),
  };
  return qb;
}

/** Crea el service con repos/datasource mínimos */
function makeService(opts: {
  operRows?:  unknown[];
  updateResult?: unknown;
  dsRows?:    unknown[][];  // una entrada por cada llamada a ds.query()
} = {}) {
  const qb         = makeQb(opts.operRows ?? []);
  const mockUpdate = jest.fn().mockResolvedValue(opts.updateResult ?? { affected: 1 });
  const mockOperRepo = {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    update:             mockUpdate,
  };

  let dsCallIndex = 0;
  const dsQueryMock = jest.fn().mockImplementation(() => {
    const rows = opts.dsRows?.[dsCallIndex++] ?? [];
    return Promise.resolve(rows);
  });
  const mockDs = { query: dsQueryMock };

  const noop = {} as any;

  const svc = new OperacionesService(
    mockOperRepo as any,
    noop,   // chequeRepo
    noop,   // cuotaRepo
    noop,   // estadoRepo
    noop,   // transRepo
    noop,   // tipoCargoRepo
    noop,   // cargoOpRepo
    mockDs  as any,
    noop,   // feriadosSvc
  );

  return { svc, mockOperRepo, mockUpdate, mockDs, qb };
}

// ── procesarVencidas ─────────────────────────────────────────────────────────

describe('OperacionesService.procesarVencidas', () => {
  it('retorna { procesadas: 0, ids: [] } cuando no hay operaciones vencidas', async () => {
    const { svc } = makeService({ operRows: [] });
    const result = await svc.procesarVencidas();
    expect(result).toEqual({ procesadas: 0, ids: [] });
  });

  it('actualiza cada operación vencida a MORA', async () => {
    const ops = [
      { id: 'op-1', estado: 'EN_COBRANZA', bitacora: [] },
      { id: 'op-2', estado: 'DESEMBOLSADO', bitacora: null },
    ];
    const { svc, mockUpdate } = makeService({ operRows: ops });

    const result = await svc.procesarVencidas();

    expect(result.procesadas).toBe(2);
    expect(result.ids).toEqual(['op-1', 'op-2']);
    expect(mockUpdate).toHaveBeenCalledTimes(2);

    // Cada update recibe el id y un objeto con estado MORA + bitacora ampliada
    const [id1, payload1] = mockUpdate.mock.calls[0];
    expect(id1).toBe('op-1');
    expect(payload1.estado).toBe('MORA');
    expect(Array.isArray(payload1.bitacora)).toBe(true);
    expect(payload1.bitacora[0].a).toBe('MORA');
    expect(payload1.bitacora[0].usuario).toBe('SISTEMA');
  });

  it('conserva la bitacora existente y agrega la entrada nueva', async () => {
    const entradaExistente = { fecha: '2024-01-01', de: 'APROBADO', a: 'EN_COBRANZA' };
    const ops = [
      { id: 'op-3', estado: 'EN_COBRANZA', bitacora: [entradaExistente] },
    ];
    const { svc, mockUpdate } = makeService({ operRows: ops });

    await svc.procesarVencidas();

    const [, payload] = mockUpdate.mock.calls[0];
    expect(payload.bitacora).toHaveLength(2);
    expect(payload.bitacora[0]).toEqual(entradaExistente);
    expect(payload.bitacora[1].a).toBe('MORA');
  });

  it('trata bitacora null como array vacío', async () => {
    const ops = [{ id: 'op-4', estado: 'PRORROGADO', bitacora: null }];
    const { svc, mockUpdate } = makeService({ operRows: ops });

    await svc.procesarVencidas();

    const [, payload] = mockUpdate.mock.calls[0];
    expect(payload.bitacora).toHaveLength(1);
    expect(payload.bitacora[0].de).toBe('PRORROGADO');
  });
});

// ── getAlertasVencimiento ────────────────────────────────────────────────────

describe('OperacionesService.getAlertasVencimiento', () => {
  it('retorna las filas del query builder', async () => {
    const ops = [
      { id: 'op-5', estado: 'EN_COBRANZA', fechaVencimiento: '2026-05-07' },
    ];
    const { svc } = makeService({ operRows: ops });

    const result = await svc.getAlertasVencimiento(14);
    expect(result).toEqual(ops);
  });

  it('usa 14 días como default', async () => {
    const { svc, qb } = makeService({ operRows: [] });
    await svc.getAlertasVencimiento(14);
    // Verifica que andWhere fue llamado con el parámetro dias
    const calls = (qb.andWhere as jest.Mock).mock.calls;
    const diasCall = calls.find((c: unknown[]) => String(c[0]).includes(':dias'));
    expect(diasCall).toBeDefined();
    expect((diasCall as unknown[])[1]).toMatchObject({ dias: 14 });
  });

  it('pasa el parámetro dias al query', async () => {
    const { svc, qb } = makeService({ operRows: [] });
    await svc.getAlertasVencimiento(30);
    const calls = (qb.andWhere as jest.Mock).mock.calls;
    const diasCall = calls.find((c: unknown[]) => String(c[0]).includes(':dias'));
    expect((diasCall as unknown[])[1]).toMatchObject({ dias: 30 });
  });
});

// ── busquedaGlobal ───────────────────────────────────────────────────────────

describe('OperacionesService.busquedaGlobal', () => {
  const opRows  = [{ id: 'op-1', nro_operacion: 'OP-26-00001', contacto_nombre: 'Juan', estado: 'EN_COBRANZA' }];
  const pfRows  = [{ id: 'pf-1', primer_nombre: 'Juan', primer_apellido: 'Perez', nro_documento: '1234567' }];
  const pjRows  = [{ id: 'pj-1', razon_social: 'Empresa SA', ruc: '80012345-1' }];

  it('retorna array vacío para queries de menos de 2 caracteres', async () => {
    const { svc } = makeService();
    expect(await svc.busquedaGlobal('')).toEqual([]);
    expect(await svc.busquedaGlobal('a')).toEqual([]);
    expect(await svc.busquedaGlobal(' ')).toEqual([]);
  });

  it('combina resultados de operaciones, personas y empresas', async () => {
    const { svc } = makeService({ dsRows: [opRows, pfRows, pjRows] });
    const results = await svc.busquedaGlobal('juan');

    const tipos = results.map(r => r.tipo);
    expect(tipos).toContain('operacion');
    expect(tipos).toContain('persona');
    expect(tipos).toContain('empresa');
    expect(results).toHaveLength(3);
  });

  it('mapea correctamente una operación', async () => {
    const { svc } = makeService({ dsRows: [opRows, [], []] });
    const results = await svc.busquedaGlobal('OP-26');

    expect(results[0]).toMatchObject({
      tipo:      'operacion',
      id:        'op-1',
      titulo:    'OP-26-00001',
      url:       '/operaciones/op-1',
    });
    expect(results[0].subtitulo).toContain('Juan');
    expect(results[0].subtitulo).toContain('EN_COBRANZA');
  });

  it('mapea correctamente una persona física', async () => {
    const { svc } = makeService({ dsRows: [[], pfRows, []] });
    const results = await svc.busquedaGlobal('juan');

    expect(results[0]).toMatchObject({
      tipo:  'persona',
      id:    'pf-1',
      titulo: 'Juan Perez',
      url:   '/contactos/personas/pf-1',
    });
    expect(results[0].subtitulo).toContain('1234567');
  });

  it('mapea correctamente una empresa', async () => {
    const { svc } = makeService({ dsRows: [[], [], pjRows] });
    const results = await svc.busquedaGlobal('empresa');

    expect(results[0]).toMatchObject({
      tipo:  'empresa',
      id:    'pj-1',
      titulo: 'Empresa SA',
      url:   '/contactos/empresas/pj-1',
    });
    expect(results[0].subtitulo).toContain('80012345-1');
  });

  it('retorna vacío cuando todos los queries dan vacío', async () => {
    const { svc } = makeService({ dsRows: [[], [], []] });
    const results = await svc.busquedaGlobal('inexistente');
    expect(results).toEqual([]);
  });

  it('llama a ds.query exactamente 3 veces', async () => {
    const { svc, mockDs } = makeService({ dsRows: [[], [], []] });
    await svc.busquedaGlobal('test');
    expect(mockDs.query).toHaveBeenCalledTimes(3);
  });
});
