import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "origin_key" varchar;
  ALTER TABLE "media" ADD COLUMN "origin_checksum" varchar;
  CREATE UNIQUE INDEX "media_origin_origin_key_idx" ON "media" USING btree ("origin_key");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "media_origin_origin_key_idx";
  ALTER TABLE "media" DROP COLUMN "origin_key";
  ALTER TABLE "media" DROP COLUMN "origin_checksum";`)
}
