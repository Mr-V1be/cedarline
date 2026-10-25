import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * Display currencies: the «Exchange rates» global and, on every lead, the currency and the rate
 * the customer read the prices in. Safe on live data and repeatable: every statement checks
 * what is already there. Leads go through expand → backfill → contract, so no row is ever
 * without a currency and the table is never locked for a rewrite.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_leads_display_currency" AS ENUM('RUB', 'USD');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_exchange_rates_rates_currency" AS ENUM('USD');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

  CREATE TABLE IF NOT EXISTS "exchange_rates_rates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"currency" "enum_exchange_rates_rates_currency" NOT NULL,
  	"rate" numeric NOT NULL,
  	"set_on" timestamp(3) with time zone,
  	CONSTRAINT "exchange_rates_rates_rate_positive" CHECK ("rate" > 0)
  );

  CREATE TABLE IF NOT EXISTS "exchange_rates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  DO $$ BEGIN
    ALTER TABLE "exchange_rates_rates" ADD CONSTRAINT "exchange_rates_rates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."exchange_rates"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  CREATE INDEX IF NOT EXISTS "exchange_rates_rates_order_idx" ON "exchange_rates_rates" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "exchange_rates_rates_parent_id_idx" ON "exchange_rates_rates" USING btree ("_parent_id");
  -- One rate per currency.
  CREATE UNIQUE INDEX IF NOT EXISTS "exchange_rates_rates_currency_idx" ON "exchange_rates_rates" USING btree ("_parent_id", "currency");

  -- Expand: the columns arrive empty, existing leads stay as they are.
  ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "display_currency" "enum_leads_display_currency";
  ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "display_rate" numeric;
  ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "display_rate_set_on" timestamp(3) with time zone;
  -- Backfill: before display currencies every customer, in either language, read rubles.
  UPDATE "leads" SET "display_currency" = 'RUB' WHERE "display_currency" IS NULL;
  -- Contract: from now on the site writes the currency with every lead.
  ALTER TABLE "leads" ALTER COLUMN "display_currency" SET NOT NULL;
  -- Rubles need no rate; any other currency has its rate and the date it was set.
  DO $$ BEGIN
    ALTER TABLE "leads" ADD CONSTRAINT "leads_display_rate_matches_currency" CHECK (
      ("display_currency" = 'RUB' AND "display_rate" IS NULL AND "display_rate_set_on" IS NULL)
      OR ("display_currency" <> 'RUB' AND "display_rate" > 0 AND "display_rate_set_on" IS NOT NULL)
    );
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "exchange_rates_rates" CASCADE;
  DROP TABLE IF EXISTS "exchange_rates" CASCADE;
  ALTER TABLE "leads" DROP CONSTRAINT IF EXISTS "leads_display_rate_matches_currency";
  ALTER TABLE "leads" DROP COLUMN IF EXISTS "display_currency";
  ALTER TABLE "leads" DROP COLUMN IF EXISTS "display_rate";
  ALTER TABLE "leads" DROP COLUMN IF EXISTS "display_rate_set_on";
  DROP TYPE IF EXISTS "public"."enum_leads_display_currency";
  DROP TYPE IF EXISTS "public"."enum_exchange_rates_rates_currency";`)
}
