import { createCorsOptions } from './cors.config';

describe('createCorsOptions', () => {
  it('allows only configured origins when credentials are enabled', () => {
    const options = createCorsOptions('http://localhost:5173,https://demo.example');

    expect(options.origin).toEqual([
      'http://localhost:5173',
      'https://demo.example',
    ]);
    expect(options.credentials).toBe(true);
  });

  it('does not reflect every origin when configuration is missing', () => {
    expect(createCorsOptions(undefined).origin).toEqual([]);
  });
});
