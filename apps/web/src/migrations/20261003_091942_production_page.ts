import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_production_stages_illustration" AS ENUM('design', 'cutting', 'panels', 'inspection', 'delivery', 'assembly');
  CREATE TYPE "public"."enum_production_stages_place" AS ENUM('workshop', 'site');
  CREATE TABLE "production_stages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"illustration" "enum_production_stages_illustration" NOT NULL,
  	"place" "enum_production_stages_place" DEFAULT 'workshop' NOT NULL
  );
  
  CREATE TABLE "production_stages_locales" (
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "production" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "production_locales" (
  	"title" varchar NOT NULL,
  	"lead" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "production_stages" ADD CONSTRAINT "production_stages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."production"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "production_stages_locales" ADD CONSTRAINT "production_stages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."production_stages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "production_locales" ADD CONSTRAINT "production_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."production"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "production_stages_order_idx" ON "production_stages" USING btree ("_order");
  CREATE INDEX "production_stages_parent_id_idx" ON "production_stages" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "production_stages_locales_locale_parent_id_unique" ON "production_stages_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "production_locales_locale_parent_id_unique" ON "production_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "production_stages" CASCADE;
  DROP TABLE "production_stages_locales" CASCADE;
  DROP TABLE "production" CASCADE;
  DROP TABLE "production_locales" CASCADE;
  DROP TYPE "public"."enum_production_stages_illustration";
  DROP TYPE "public"."enum_production_stages_place";`)
}
