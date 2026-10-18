import type { PrismaClient } from '@prisma/client';

export function getTestDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || new URL(url).pathname !== '/nowayhome_test') {
    throw new Error('TEST_DATABASE_URL must target nowayhome_test');
  }
  return url;
}

export async function truncateTestDatabase(
  prisma: PrismaClient,
): Promise<void> {
  getTestDatabaseUrl();
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  `;
  if (tables.length === 0) return;

  const names = tables
    .map(({ tablename }) => `"${tablename.replaceAll('"', '""')}"`)
    .join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`);
}
