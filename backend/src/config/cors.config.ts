import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export function createCorsOptions(origins?: string): CorsOptions {
  return {
    credentials: true,
    origin: (origins ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
}
