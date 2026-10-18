import { execFileSync } from 'node:child_process';
import { getTestDatabaseUrl } from './database';

function run(command: string, args: string[], env?: NodeJS.ProcessEnv): void {
  execFileSync(command, args, { env, stdio: 'inherit' });
}

function ensureDatabaseExists(): void {
  try {
    const exists = execFileSync(
      'docker',
      [
        'exec',
        'nowayhome-postgres',
        'psql',
        '-U',
        'nowayhome',
        '-d',
        'postgres',
        '-tAc',
        "SELECT 1 FROM pg_database WHERE datname = 'nowayhome_test'",
      ],
      { encoding: 'utf8' },
    ).trim();

    if (exists !== '1') {
      run('docker', [
        'exec',
        'nowayhome-postgres',
        'psql',
        '-U',
        'nowayhome',
        '-d',
        'postgres',
        '-c',
        'CREATE DATABASE nowayhome_test',
      ]);
    }
  } catch {
    // In GitHub Actions CI with postgres service container, database is already initialized
  }
}

function main(): void {
  const testUrl = getTestDatabaseUrl();
  ensureDatabaseExists();

  run(
    process.execPath,
    [
      require.resolve('prisma/build/index.js'),
      'migrate',
      'deploy',
      '--schema',
      'prisma/schema.prisma',
    ],
    { ...process.env, DATABASE_URL: testUrl },
  );
}

main();
