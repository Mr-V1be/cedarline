import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "financing" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"mortgage_margin" numeric NOT NULL,
  	"mortgage_min_down_percent" numeric NOT NULL,
  	"mortgage_default_down_percent" numeric NOT NULL,
  	"mortgage_min_years" numeric NOT NULL,
  	"mortgage_max_years" numeric NOT NULL,
  	"mortgage_default_years" numeric NOT NULL,
  	"installment_interest_free_months" numeric NOT NULL,
  	"installment_max_months" numeric NOT NULL,
  	"installment_default_months" numeric NOT NULL,
  	"installment_min_down_percent" numeric NOT NULL,
  	"installment_default_down_percent" numeric NOT NULL,
  	"installment_key_rate_share" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "key_rate" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"rate" numeric,
  	"effective_from" timestamp(3) with time zone,
  	"fetched_at" timestamp(3) with time zone,
  	"source" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "financing" CASCADE;
  DROP TABLE "key_rate" CASCADE;`)
}
