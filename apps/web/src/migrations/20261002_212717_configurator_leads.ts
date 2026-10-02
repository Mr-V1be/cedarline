import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_leads_deliveries_status" AS ENUM('delivered', 'failed');
  CREATE TYPE "public"."enum_leads_status" AS ENUM('new', 'in-progress', 'won', 'lost');
  CREATE TYPE "public"."enum_leads_locale" AS ENUM('ru', 'en');
  CREATE TYPE "public"."enum_configurations_locale" AS ENUM('ru', 'en');
  CREATE TYPE "public"."enum_documents_kind" AS ENUM('render', 'proposal');
  CREATE TYPE "public"."enum_catalog_options_roof_kinds" AS ENUM('gable', 'shed', 'gambrel');
  CREATE TYPE "public"."enum_catalog_options_window_styles" AS ENUM('standard', 'panoramic');
  CREATE TYPE "public"."enum_catalog_options_rules_conditions_option" AS ENUM('storeys', 'layout', 'roof', 'facade', 'windows', 'terrace', 'insulation', 'engineering');
  ALTER TYPE "public"."enum_tariff_rates_conditions_option" ADD VALUE 'storeys' BEFORE 'roof';
  ALTER TYPE "public"."enum_tariff_rates_conditions_option" ADD VALUE 'layout' BEFORE 'roof';
  ALTER TYPE "public"."enum_tariff_rates_conditions_option" ADD VALUE 'terrace' BEFORE 'insulation';
  ALTER TYPE "public"."enum_tariff_stages_conditions_option" ADD VALUE 'storeys' BEFORE 'roof';
  ALTER TYPE "public"."enum_tariff_stages_conditions_option" ADD VALUE 'layout' BEFORE 'roof';
  ALTER TYPE "public"."enum_tariff_stages_conditions_option" ADD VALUE 'terrace' BEFORE 'insulation';
  CREATE TABLE "projects_configurator_sizes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"width" numeric NOT NULL,
  	"depth" numeric NOT NULL
  );
  
  CREATE TABLE "leads_deliveries" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"channel" varchar NOT NULL,
  	"status" "enum_leads_deliveries_status" NOT NULL,
  	"reference" varchar,
  	"at" timestamp(3) with time zone NOT NULL,
  	"error" varchar
  );
  
  CREATE TABLE "leads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_leads_status" DEFAULT 'new' NOT NULL,
  	"notes" varchar,
  	"name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"comment" varchar,
  	"summary" varchar,
  	"total" numeric,
  	"locale" "enum_leads_locale",
  	"configuration_id" integer,
  	"project_id" integer,
  	"proposal_id" integer,
  	"consent_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "configurations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"project_id" integer,
  	"total" numeric,
  	"tariff_revision" numeric,
  	"locale" "enum_configurations_locale",
  	"render_id" integer,
  	"proposal_id" integer,
  	"configuration" jsonb NOT NULL,
  	"snapshot" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_documents_kind" NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "rate_limit_hits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"bucket" varchar NOT NULL,
  	"key" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "catalog_options_roof_kinds" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_catalog_options_roof_kinds",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "catalog_options_window_styles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_catalog_options_window_styles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "catalog_options_rules_conditions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"option" "enum_catalog_options_rules_conditions_option" NOT NULL
  );
  
  CREATE TABLE "catalog_options_rules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL
  );
  
  CREATE TABLE "catalog_options_rules_locales" (
  	"message" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "catalog_options_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "catalog_options_numbers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" numeric,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL
  );
  
  ALTER TABLE "projects" ADD COLUMN "configurator_variant_of_id" integer;
  ALTER TABLE "projects" ADD COLUMN "configurator_mirrorable" boolean DEFAULT true;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "leads_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "configurations_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "documents_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "rate_limit_hits_id" integer;
  ALTER TABLE "catalog_options" ADD COLUMN "terrace_removable" boolean DEFAULT true;
  ALTER TABLE "site" ADD COLUMN "leads_email" varchar;
  UPDATE "site" SET "leads_email" = "email";
  ALTER TABLE "site" ALTER COLUMN "leads_email" SET NOT NULL;
  ALTER TABLE "projects_configurator_sizes" ADD CONSTRAINT "projects_configurator_sizes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "leads_deliveries" ADD CONSTRAINT "leads_deliveries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_configuration_id_configurations_id_fk" FOREIGN KEY ("configuration_id") REFERENCES "public"."configurations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_proposal_id_documents_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "configurations" ADD CONSTRAINT "configurations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "configurations" ADD CONSTRAINT "configurations_render_id_documents_id_fk" FOREIGN KEY ("render_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "configurations" ADD CONSTRAINT "configurations_proposal_id_documents_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "catalog_options_roof_kinds" ADD CONSTRAINT "catalog_options_roof_kinds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."catalog_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "catalog_options_window_styles" ADD CONSTRAINT "catalog_options_window_styles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."catalog_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "catalog_options_rules_conditions" ADD CONSTRAINT "catalog_options_rules_conditions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."catalog_options_rules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "catalog_options_rules" ADD CONSTRAINT "catalog_options_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."catalog_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "catalog_options_rules_locales" ADD CONSTRAINT "catalog_options_rules_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."catalog_options_rules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "catalog_options_texts" ADD CONSTRAINT "catalog_options_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."catalog_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "catalog_options_numbers" ADD CONSTRAINT "catalog_options_numbers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."catalog_options"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_configurator_sizes_order_idx" ON "projects_configurator_sizes" USING btree ("_order");
  CREATE INDEX "projects_configurator_sizes_parent_id_idx" ON "projects_configurator_sizes" USING btree ("_parent_id");
  CREATE INDEX "leads_deliveries_order_idx" ON "leads_deliveries" USING btree ("_order");
  CREATE INDEX "leads_deliveries_parent_id_idx" ON "leads_deliveries" USING btree ("_parent_id");
  CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");
  CREATE INDEX "leads_configuration_idx" ON "leads" USING btree ("configuration_id");
  CREATE INDEX "leads_project_idx" ON "leads" USING btree ("project_id");
  CREATE INDEX "leads_proposal_idx" ON "leads" USING btree ("proposal_id");
  CREATE INDEX "leads_updated_at_idx" ON "leads" USING btree ("updated_at");
  CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");
  CREATE UNIQUE INDEX "configurations_code_idx" ON "configurations" USING btree ("code");
  CREATE INDEX "configurations_project_idx" ON "configurations" USING btree ("project_id");
  CREATE INDEX "configurations_render_idx" ON "configurations" USING btree ("render_id");
  CREATE INDEX "configurations_proposal_idx" ON "configurations" USING btree ("proposal_id");
  CREATE INDEX "configurations_updated_at_idx" ON "configurations" USING btree ("updated_at");
  CREATE INDEX "configurations_created_at_idx" ON "configurations" USING btree ("created_at");
  CREATE INDEX "documents_updated_at_idx" ON "documents" USING btree ("updated_at");
  CREATE INDEX "documents_created_at_idx" ON "documents" USING btree ("created_at");
  CREATE UNIQUE INDEX "documents_filename_idx" ON "documents" USING btree ("filename");
  CREATE INDEX "rate_limit_hits_bucket_idx" ON "rate_limit_hits" USING btree ("bucket");
  CREATE INDEX "rate_limit_hits_key_idx" ON "rate_limit_hits" USING btree ("key");
  CREATE INDEX "rate_limit_hits_updated_at_idx" ON "rate_limit_hits" USING btree ("updated_at");
  CREATE INDEX "rate_limit_hits_created_at_idx" ON "rate_limit_hits" USING btree ("created_at");
  CREATE INDEX "catalog_options_roof_kinds_order_idx" ON "catalog_options_roof_kinds" USING btree ("order");
  CREATE INDEX "catalog_options_roof_kinds_parent_idx" ON "catalog_options_roof_kinds" USING btree ("parent_id");
  CREATE INDEX "catalog_options_window_styles_order_idx" ON "catalog_options_window_styles" USING btree ("order");
  CREATE INDEX "catalog_options_window_styles_parent_idx" ON "catalog_options_window_styles" USING btree ("parent_id");
  CREATE INDEX "catalog_options_rules_conditions_order_idx" ON "catalog_options_rules_conditions" USING btree ("_order");
  CREATE INDEX "catalog_options_rules_conditions_parent_id_idx" ON "catalog_options_rules_conditions" USING btree ("_parent_id");
  CREATE INDEX "catalog_options_rules_order_idx" ON "catalog_options_rules" USING btree ("_order");
  CREATE INDEX "catalog_options_rules_parent_id_idx" ON "catalog_options_rules" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "catalog_options_rules_locales_locale_parent_id_unique" ON "catalog_options_rules_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "catalog_options_texts_order_parent" ON "catalog_options_texts" USING btree ("order","parent_id");
  CREATE INDEX "catalog_options_numbers_order_parent_idx" ON "catalog_options_numbers" USING btree ("order","parent_id");
  ALTER TABLE "projects" ADD CONSTRAINT "projects_configurator_variant_of_id_projects_id_fk" FOREIGN KEY ("configurator_variant_of_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leads_fk" FOREIGN KEY ("leads_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_configurations_fk" FOREIGN KEY ("configurations_id") REFERENCES "public"."configurations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_documents_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rate_limit_hits_fk" FOREIGN KEY ("rate_limit_hits_id") REFERENCES "public"."rate_limit_hits"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_configurator_configurator_variant_of_idx" ON "projects" USING btree ("configurator_variant_of_id");
  CREATE INDEX "payload_locked_documents_rels_leads_id_idx" ON "payload_locked_documents_rels" USING btree ("leads_id");
  CREATE INDEX "payload_locked_documents_rels_configurations_id_idx" ON "payload_locked_documents_rels" USING btree ("configurations_id");
  CREATE INDEX "payload_locked_documents_rels_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("documents_id");
  CREATE INDEX "payload_locked_documents_rels_rate_limit_hits_id_idx" ON "payload_locked_documents_rels" USING btree ("rate_limit_hits_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects_configurator_sizes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "leads_deliveries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "leads" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "configurations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "documents" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "rate_limit_hits" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "catalog_options_roof_kinds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "catalog_options_window_styles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "catalog_options_rules_conditions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "catalog_options_rules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "catalog_options_rules_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "catalog_options_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "catalog_options_numbers" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "projects_configurator_sizes" CASCADE;
  DROP TABLE "leads_deliveries" CASCADE;
  DROP TABLE "leads" CASCADE;
  DROP TABLE "configurations" CASCADE;
  DROP TABLE "documents" CASCADE;
  DROP TABLE "rate_limit_hits" CASCADE;
  DROP TABLE "catalog_options_roof_kinds" CASCADE;
  DROP TABLE "catalog_options_window_styles" CASCADE;
  DROP TABLE "catalog_options_rules_conditions" CASCADE;
  DROP TABLE "catalog_options_rules" CASCADE;
  DROP TABLE "catalog_options_rules_locales" CASCADE;
  DROP TABLE "catalog_options_texts" CASCADE;
  DROP TABLE "catalog_options_numbers" CASCADE;
  ALTER TABLE "projects" DROP CONSTRAINT "projects_configurator_variant_of_id_projects_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_leads_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_configurations_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_documents_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_rate_limit_hits_fk";
  
  ALTER TABLE "tariff_rates_conditions" ALTER COLUMN "option" SET DATA TYPE text;
  DROP TYPE "public"."enum_tariff_rates_conditions_option";
  CREATE TYPE "public"."enum_tariff_rates_conditions_option" AS ENUM('roof', 'facade', 'windows', 'insulation', 'engineering');
  ALTER TABLE "tariff_rates_conditions" ALTER COLUMN "option" SET DATA TYPE "public"."enum_tariff_rates_conditions_option" USING "option"::"public"."enum_tariff_rates_conditions_option";
  ALTER TABLE "tariff_stages_conditions" ALTER COLUMN "option" SET DATA TYPE text;
  DROP TYPE "public"."enum_tariff_stages_conditions_option";
  CREATE TYPE "public"."enum_tariff_stages_conditions_option" AS ENUM('roof', 'facade', 'windows', 'insulation', 'engineering');
  ALTER TABLE "tariff_stages_conditions" ALTER COLUMN "option" SET DATA TYPE "public"."enum_tariff_stages_conditions_option" USING "option"::"public"."enum_tariff_stages_conditions_option";
  DROP INDEX "projects_configurator_configurator_variant_of_idx";
  DROP INDEX "payload_locked_documents_rels_leads_id_idx";
  DROP INDEX "payload_locked_documents_rels_configurations_id_idx";
  DROP INDEX "payload_locked_documents_rels_documents_id_idx";
  DROP INDEX "payload_locked_documents_rels_rate_limit_hits_id_idx";
  ALTER TABLE "projects" DROP COLUMN "configurator_variant_of_id";
  ALTER TABLE "projects" DROP COLUMN "configurator_mirrorable";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "leads_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "configurations_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "documents_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "rate_limit_hits_id";
  ALTER TABLE "catalog_options" DROP COLUMN "terrace_removable";
  ALTER TABLE "site" DROP COLUMN "leads_email";
  DROP TYPE "public"."enum_leads_deliveries_status";
  DROP TYPE "public"."enum_leads_status";
  DROP TYPE "public"."enum_leads_locale";
  DROP TYPE "public"."enum_configurations_locale";
  DROP TYPE "public"."enum_documents_kind";
  DROP TYPE "public"."enum_catalog_options_roof_kinds";
  DROP TYPE "public"."enum_catalog_options_window_styles";
  DROP TYPE "public"."enum_catalog_options_rules_conditions_option";`)
}
