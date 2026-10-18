# PostgreSQL E2E Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add isolated PostgreSQL-backed HTTP E2E tests that never modify the `nowayhome` local demo database.

**Architecture:** Docker's existing PostgreSQL container holds `nowayhome` and disposable `nowayhome_test`. Test setup validates `TEST_DATABASE_URL` ends in `/nowayhome_test`, creates database only through the admin connection, applies Prisma migrations, and truncates only test database tables. Suites boot `AppModule` and call HTTP routes with Supertest; Prisma is never mocked.

**Tech Stack:** NestJS 11, Prisma 6, PostgreSQL 16 Docker, Jest 30, ts-jest, Supertest.

**Spec:** `docs/superpowers/specs/2026-10-18-e2e-test-database-design.md`

## Global Constraints

- Never connect E2E code to `nowayhome`.
- Refuse `TEST_DATABASE_URL` unless database name is exactly `nowayhome_test`.
- Do not use global seed data; each suite creates minimal fixture rows.
- Tests must use Nest HTTP routes, actual Prisma client, actual PostgreSQL transactions.
- Payment stays demo-only; no real provider or card flow.

## Review Focus

- `TEST_DATABASE_URL` points at `nowayhome`: setup must stop before SQL executes.
- PostgreSQL unavailable: preparation must return a clear failure and leave demo DB untouched.
- Test rerun after a failed suite: truncate must make results deterministic.
- Parallel booking requests: exactly one reservation succeeds when one `DailyRate.availableQty` remains.
- Concurrent voucher claims: exactly one booking consumes capped promotion usage.

---

### Task 1: Test database guard and lifecycle

**Files:**
- Create: `backend/test/e2e/database.ts`
- Create: `backend/test/e2e/database.spec.ts`
- Create: `backend/.env.test.example`
- Modify: `backend/package.json`
- Modify: `backend/docker-compose.yml`

**Interfaces:**
- Produces `getTestDatabaseUrl(): string`.
- Produces `prepareTestDatabase(): Promise<void>`.
- Produces `truncateTestDatabase(prisma: PrismaClient): Promise<void>`.
- Consumed by every E2E suite.

- [ ] **Step 1: Write failing guard tests**

```ts
expect(() => getTestDatabaseUrl()).toThrow('TEST_DATABASE_URL must target nowayhome_test');
process.env.TEST_DATABASE_URL = 'postgresql://nowayhome:nowayhome@localhost:5432/nowayhome';
expect(() => getTestDatabaseUrl()).toThrow('TEST_DATABASE_URL must target nowayhome_test');
```

- [ ] **Step 2: Run guard tests**

Run: `pnpm --filter backend exec jest --config jest.config.cjs --runInBand test/e2e/database.spec.ts`
Expected: FAIL because `database.ts` does not exist.

- [ ] **Step 3: Implement safe lifecycle**

```ts
export function getTestDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || new URL(url).pathname !== '/nowayhome_test') {
    throw new Error('TEST_DATABASE_URL must target nowayhome_test');
  }
  return url;
}
```

Use a separate admin URL with database `postgres` only to issue `CREATE DATABASE nowayhome_test` when absent. Run `prisma migrate deploy` with `DATABASE_URL` set to validated test URL. `truncateTestDatabase` queries `pg_tables` in schema `public`, then executes `TRUNCATE ... RESTART IDENTITY CASCADE` only against quoted table names returned by PostgreSQL.

- [ ] **Step 4: Configure local environment and commands**

Add to `backend/.env.test.example`:

```env
TEST_DATABASE_URL="postgresql://nowayhome:nowayhome@localhost:5432/nowayhome_test?schema=public"
```

Add scripts:

```json
"test:e2e:prepare": "tsx test/e2e/prepare.ts",
"test:e2e": "jest --config test/e2e/jest-e2e.config.cjs --runInBand"
```

Add `supertest`, `@types/supertest`, and `tsx` dev dependencies. Add `POSTGRES_DB_TEST=nowayhome_test` to Docker environment/init setup so first local boot creates test database without recreating `nowayhome`.

- [ ] **Step 5: Run lifecycle verification**

Run: `pnpm --filter backend run test:e2e:prepare`
Expected: migrations apply to `nowayhome_test`; no command uses `nowayhome` as a target database.

### Task 2: Nest application and deterministic fixture harness

**Files:**
- Create: `backend/test/e2e/app.ts`
- Create: `backend/test/e2e/fixtures.ts`
- Create: `backend/test/e2e/jest-e2e.config.cjs`
- Test: `backend/test/e2e/fixtures.spec.ts`

**Interfaces:**
- Consumes `prepareTestDatabase`, `truncateTestDatabase` from Task 1.
- Produces `createE2eApp(): Promise<INestApplication>`.
- Produces `createBookingFixture(prisma): Promise<BookingFixture>` with customer, property, room type, physical room, rate plan, and one or more daily rates.
- Produces `loginAsCustomer(app, email, password): Promise<string>` access token.

- [ ] **Step 1: Write failing fixture test**

```ts
const fixture = await createBookingFixture(prisma, { availableQty: 1 });
expect(fixture.dailyRates).toHaveLength(2);
expect(fixture.ratePlanId).toBeDefined();
expect(fixture.customer.email).toMatch(/@e2e.local$/);
```

- [ ] **Step 2: Run fixture test**

Run: `pnpm --filter backend exec jest --config test/e2e/jest-e2e.config.cjs --runInBand test/e2e/fixtures.spec.ts`
Expected: FAIL because fixture harness does not exist.

- [ ] **Step 3: Implement harness**

`createE2eApp` sets required environment values before importing `AppModule`: test `DATABASE_URL`, 32+ character JWT secrets, `DEMO_PAYMENTS_ENABLED=true`, `CORS_ORIGINS=http://localhost:5173`, and `PORT=0`. It calls `app.init()` and returns the initialized app.

`createBookingFixture` creates:

```text
active customer with bcrypt password
active partner and approved PartnerProfile
active Property
active RoomType with totalRooms=1
physical Room status=available
active RatePlan
DailyRate rows for 2026-11-10 and 2026-11-11
```

Fixtures use fixed dates and unique e2e email suffixes. No fixture writes outside `nowayhome_test`.

- [ ] **Step 4: Run fixture verification**

Run: `pnpm --filter backend exec jest --config test/e2e/jest-e2e.config.cjs --runInBand test/e2e/fixtures.spec.ts`
Expected: PASS.

### Task 3: Auth session E2E flow

**Files:**
- Create: `backend/test/e2e/auth.e2e-spec.ts`
- Modify: `backend/test/e2e/fixtures.ts` only if fixture login data needs export.

**Interfaces:**
- Consumes Task 1 DB lifecycle and Task 2 app/fixtures.
- Calls `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, and `GET /api/auth/me`.

- [ ] **Step 1: Write failing auth E2E test**

```ts
const login = await request(app.getHttpServer())
  .post('/api/auth/login')
  .send({ email: fixture.customer.email, password: fixture.customer.password });
expect(login.status).toBe(201);

const refresh = await request(app.getHttpServer())
  .post('/api/auth/refresh')
  .send({ refreshToken: login.body.refreshToken });
expect(refresh.body.accessToken).not.toBe(login.body.accessToken);

await request(app.getHttpServer())
  .post('/api/auth/logout')
  .set('Authorization', `Bearer ${refresh.body.accessToken}`)
  .expect(200);

await request(app.getHttpServer())
  .get('/api/auth/me')
  .set('Authorization', `Bearer ${refresh.body.accessToken}`)
  .expect(401);
```

- [ ] **Step 2: Run auth E2E test**

Run: `pnpm --filter backend run test:e2e -- auth.e2e-spec.ts`
Expected: FAIL before route/fixture integration is complete, then PASS after harness setup.

- [ ] **Step 3: Verify suite isolation**

Run auth test twice consecutively.
Expected: Both runs PASS; second run does not see sessions from first run.

### Task 4: Booking inventory and cancellation E2E flow

**Files:**
- Create: `backend/test/e2e/bookings.e2e-spec.ts`

**Interfaces:**
- Consumes Task 2 fixture and customer login helper.
- Calls `POST /api/bookings` and `POST /api/bookings/:id/cancel`.

- [ ] **Step 1: Write failing booking E2E test**

```ts
const response = await authenticatedRequest.post('/api/bookings').send({
  propertyId: fixture.propertyId,
  roomTypeId: fixture.roomTypeId,
  ratePlanId: fixture.ratePlanId,
  checkInDate: '2026-11-10',
  checkOutDate: '2026-11-12',
  numAdults: 1,
  numChildren: 0,
  roomsNeeded: 1,
});
expect(response.status).toBe(201);
expect(await dailyRateQty('2026-11-10')).toBe(0);
expect(await dailyRateQty('2026-11-11')).toBe(0);
```

- [ ] **Step 2: Run booking test**

Run: `pnpm --filter backend run test:e2e -- bookings.e2e-spec.ts`
Expected: FAIL before fixture/harness route contract is aligned, then PASS.

- [ ] **Step 3: Add race and cancellation assertions**

```ts
const [first, second] = await Promise.all([
  createBooking(token, fixture),
  createBooking(token, fixture),
]);
expect([first.status, second.status].sort()).toEqual([201, 400]);

await cancelBooking(token, first.body.id).expect(201);
expect(await dailyRateQty('2026-11-10')).toBe(1);
await cancelBooking(token, first.body.id).expect(400);
expect(await dailyRateQty('2026-11-10')).toBe(1);
```

- [ ] **Step 4: Run booking E2E suite twice**

Run: `pnpm --filter backend run test:e2e -- bookings.e2e-spec.ts`
Expected: PASS twice with no inventory leakage.

### Task 5: Voucher cap E2E flow and documentation

**Files:**
- Create: `backend/test/e2e/vouchers.e2e-spec.ts`
- Modify: `README.md`
- Modify: `HUONG_DAN_CHAY_DU_AN.md`

**Interfaces:**
- Consumes fixture factory and booking helper.
- Creates active promotion with `maxUses=1`, active voucher, then makes concurrent booking requests.

- [ ] **Step 1: Write failing voucher race test**

```ts
const [first, second] = await Promise.all([
  createBooking(token, fixture, voucher.id),
  createBooking(token, fixture, voucher.id),
]);
expect([first.status, second.status].sort()).toEqual([201, 400]);
expect(await promotionUsage(promotion.id)).toBe(1);
```

- [ ] **Step 2: Run voucher E2E test**

Run: `pnpm --filter backend run test:e2e -- vouchers.e2e-spec.ts`
Expected: FAIL before E2E fixture and booking requests are aligned, then PASS.

- [ ] **Step 3: Document safe commands**

Add a short E2E section:

```powershell
copy backend\.env.test.example backend\.env.test
pnpm --filter backend run test:e2e:prepare
pnpm --filter backend run test:e2e
```

Document exact rule: E2E tests truncate only `nowayhome_test`; local demo DB `nowayhome` remains untouched.

- [ ] **Step 4: Run full final verification**

Run:

```powershell
pnpm --filter backend run test
pnpm --filter backend run test:e2e
pnpm --filter backend run typecheck
pnpm --filter backend run build
```

Expected: unit tests, E2E tests, typecheck, and build PASS.

## Self-review

- DB guard, lifecycle, migrations, fixture isolation, HTTP auth, booking inventory, concurrent booking, cancellation idempotency, voucher race, and docs each map to a task.
- Every destructive DB operation validates `nowayhome_test` first.
- All fixture/helper names are produced before consumption.
- No real payment or shared runtime data is added.
