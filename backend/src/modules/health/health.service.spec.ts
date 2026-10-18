import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns ready after database probe succeeds', async () => {
    const service = new HealthService({
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as never);

    await expect(service.check()).resolves.toEqual({ status: 'ok' });
  });
});
