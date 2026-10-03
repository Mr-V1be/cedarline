import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site" ADD COLUMN "location" geometry(Point);
  ALTER TABLE "site" ADD COLUMN "tax_id" varchar;
  ALTER TABLE "site" ADD COLUMN "registration_number" varchar;
  ALTER TABLE "site" ADD COLUMN "privacy_email" varchar;
  ALTER TABLE "site" ADD COLUMN "privacy_edition" timestamp(3) with time zone;
  ALTER TABLE "site_locales" ADD COLUMN "legal_name" varchar;
  -- Existing company settings: the public email answers personal data requests and the policy
  -- dates from this release until the editors fill in the legal details.
  UPDATE "site" SET
    "tax_id" = '',
    "registration_number" = '',
    "privacy_email" = "email",
    "privacy_edition" = now();
  UPDATE "site_locales" SET "legal_name" = '';
  ALTER TABLE "site" ALTER COLUMN "tax_id" SET NOT NULL;
  ALTER TABLE "site" ALTER COLUMN "registration_number" SET NOT NULL;
  ALTER TABLE "site" ALTER COLUMN "privacy_email" SET NOT NULL;
  ALTER TABLE "site" ALTER COLUMN "privacy_edition" SET NOT NULL;
  ALTER TABLE "site_locales" ALTER COLUMN "legal_name" SET NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site" DROP COLUMN "location";
  ALTER TABLE "site" DROP COLUMN "tax_id";
  ALTER TABLE "site" DROP COLUMN "registration_number";
  ALTER TABLE "site" DROP COLUMN "privacy_email";
  ALTER TABLE "site" DROP COLUMN "privacy_edition";
  ALTER TABLE "site_locales" DROP COLUMN "legal_name";`)
}
