import { getTestDatabaseUrl } from './database';

describe('getTestDatabaseUrl', () => {
  const originalUrl = process.env.TEST_DATABASE_URL;

  afterEach(() => {
    process.env.TEST_DATABASE_URL = originalUrl;
  });

  it('rejects a missing test database URL', () => {
    delete process.env.TEST_DATABASE_URL;

    expect(() => getTestDatabaseUrl()).toThrow(
      'TEST_DATABASE_URL must target nowayhome_test',
    );
  });

  it('rejects the local demo database', () => {
    process.env.TEST_DATABASE_URL =
      'postgresql://nowayhome:nowayhome@localhost:5432/nowayhome?schema=public';

    expect(() => getTestDatabaseUrl()).toThrow(
      'TEST_DATABASE_URL must target nowayhome_test',
    );
  });
});
