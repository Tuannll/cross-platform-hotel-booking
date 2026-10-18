# E2E Test Database Design

## Goal

Run Nest HTTP end-to-end tests against PostgreSQL in Docker without changing the local demo database.

## Database isolation

One PostgreSQL container owns two databases:

```text
nowayhome       local demo/development data
nowayhome_test  disposable E2E data
```

Every E2E command requires `TEST_DATABASE_URL`. It refuses any URL whose database name is not `nowayhome_test`. Setup creates this database if missing, applies current Prisma migrations, and truncates only tables in that database.

## Test harness

- `test/e2e/setup.ts` reads `TEST_DATABASE_URL`, validates DB name, runs `prisma migrate deploy`, and provides truncate/fixture helpers.
- `test/e2e/app.ts` creates Nest application from `AppModule` with environment supplied before module load.
- Tests use `supertest` against HTTP routes. Prisma is never mocked.
- Each suite truncates test tables and inserts only rows it needs.

## First scenarios

1. Auth: login returns tokens; refresh rotates token; logout revokes current access token.
2. Booking: valid booking decreases every requested daily rate.
3. Booking race: two concurrent requests against one remaining unit yield one success and one availability failure.
4. Cancellation: first cancellation restores daily rates; second cancellation fails and does not restore again.
5. Voucher race: capped promotion accepts one concurrent booking and rejects the other.

## Commands

```text
pnpm --filter backend run test:e2e:prepare
pnpm --filter backend run test:e2e
```

`test:e2e` fails before database access if `TEST_DATABASE_URL` is missing or not named `nowayhome_test`.

## Non-goals

- No production DB tests.
- No shared runtime data between teammates.
- No real payment-provider test.
- No global seed; fixtures remain local to each suite.
