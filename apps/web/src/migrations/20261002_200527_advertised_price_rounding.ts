import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_tariff_advertised_rounding_mode" AS ENUM('up', 'down', 'nearest');
  ALTER TABLE "tariff" ADD COLUMN "advertised_rounding_step" numeric DEFAULT 1000 NOT NULL;
  ALTER TABLE "tariff" ADD COLUMN "advertised_rounding_mode" "enum_tariff_advertised_rounding_mode" DEFAULT 'up' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tariff" DROP COLUMN "advertised_rounding_step";
  ALTER TABLE "tariff" DROP COLUMN "advertised_rounding_mode";
  DROP TYPE "public"."enum_tariff_advertised_rounding_mode";`)
}
