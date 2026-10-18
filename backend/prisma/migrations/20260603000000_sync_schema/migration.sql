-- AlterTable: properties
ALTER TABLE "public"."properties"
    ADD COLUMN IF NOT EXISTS "highlights" JSONB,
    ADD COLUMN IF NOT EXISTS "transport_connections" JSONB,
    ADD COLUMN IF NOT EXISTS "nearby_places" JSONB,
    ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(6);

-- AlterTable: bookings
ALTER TABLE "public"."bookings"
    ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(6);

-- AlterTable: promotions
ALTER TABLE "public"."promotions"
    ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(6);

-- AlterTable: room_types
ALTER TABLE "public"."room_types"
    ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(6);

-- AlterTable: users
ALTER TABLE "public"."users"
    ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(6);

-- CreateTable: partner_blacklist
CREATE TABLE IF NOT EXISTS "public"."partner_blacklist" (
    "id" BIGSERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "rejected_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "partner_blacklist_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "uq_partner_blacklist_email" ON "public"."partner_blacklist"("email");
CREATE INDEX IF NOT EXISTS "idx_partner_blacklist_expires" ON "public"."partner_blacklist"("expires_at");

-- CreateTable: booking_rooms
CREATE TABLE IF NOT EXISTS "public"."booking_rooms" (
    "id" BIGSERIAL NOT NULL,
    "booking_id" BIGINT NOT NULL,
    "room_id" BIGINT NOT NULL,
    "rate_plan_id" BIGINT NOT NULL,
    "room_price" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_rooms_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "uq_br_booking_room" ON "public"."booking_rooms"("booking_id", "room_id");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_br_booking') THEN
        ALTER TABLE "public"."booking_rooms" ADD CONSTRAINT "fk_br_booking" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_br_room') THEN
        ALTER TABLE "public"."booking_rooms" ADD CONSTRAINT "fk_br_room" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_br_rp') THEN
        ALTER TABLE "public"."booking_rooms" ADD CONSTRAINT "fk_br_rp" FOREIGN KEY ("rate_plan_id") REFERENCES "public"."rate_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
END $$;

-- CreateTable: legacy_source_rows
CREATE TABLE IF NOT EXISTS "public"."legacy_source_rows" (
    "id" BIGSERIAL NOT NULL,
    "source_table" VARCHAR(255) NOT NULL,
    "source_id" VARCHAR(255),
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legacy_source_rows_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "uq_legacy_source_rows" ON "public"."legacy_source_rows"("source_table", "source_id");
