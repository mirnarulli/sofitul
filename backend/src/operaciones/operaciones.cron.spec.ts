/**
 * Tests de OperacionesCron
 * Verifica que el cron llama a procesarVencidas y maneja errores sin explotar.
 */
import { OperacionesCron } from './operaciones.cron';

function makeCron(procesarResult: unknown = { procesadas: 0, ids: [] }, throws = false) {
  const mockSvc = {
    procesarVencidas: throws
      ? jest.fn().mockRejectedValue(new Error('DB error'))
      : jest.fn().mockResolvedValue(procesarResult),
  };
  const cron = new OperacionesCron(mockSvc as any);
  return { cron, mockSvc };
}

describe('OperacionesCron.procesarVencidas', () => {
  it('llama a svc.procesarVencidas una vez', async () => {
    const { cron, mockSvc } = makeCron();
    await cron.procesarVencidas();
    expect(mockSvc.procesarVencidas).toHaveBeenCalledTimes(1);
  });

  it('no lanza excepción aunque el service falle', async () => {
    const { cron } = makeCron(undefined, true);
    await expect(cron.procesarVencidas()).resolves.not.toThrow();
  });

  it('no lanza cuando hay operaciones marcadas como MORA', async () => {
    const { cron } = makeCron({ procesadas: 3, ids: ['a', 'b', 'c'] });
    await expect(cron.procesarVencidas()).resolves.not.toThrow();
  });
});
