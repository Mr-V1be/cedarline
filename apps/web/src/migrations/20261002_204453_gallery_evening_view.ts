import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_projects_gallery_view" ADD VALUE 'evening' BEFORE 'back';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects_gallery" ALTER COLUMN "view" SET DATA TYPE text;
  ALTER TABLE "projects_gallery" ALTER COLUMN "view" SET DEFAULT 'front'::text;
  DROP TYPE "public"."enum_projects_gallery_view";
  CREATE TYPE "public"."enum_projects_gallery_view" AS ENUM('front', 'back', 'side', 'aerial', 'detail');
  ALTER TABLE "projects_gallery" ALTER COLUMN "view" SET DEFAULT 'front'::"public"."enum_projects_gallery_view";
  ALTER TABLE "projects_gallery" ALTER COLUMN "view" SET DATA TYPE "public"."enum_projects_gallery_view" USING "view"::"public"."enum_projects_gallery_view";`)
}
