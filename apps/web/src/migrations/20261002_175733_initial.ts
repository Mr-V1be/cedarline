import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('ru', 'en');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'content-manager', 'sales-manager');
  CREATE TYPE "public"."enum_projects_gallery_view" AS ENUM('front', 'back', 'side', 'aerial', 'detail');
  CREATE TYPE "public"."enum_projects_design_openings_type" AS ENUM('window', 'door');
  CREATE TYPE "public"."enum_projects_design_openings_role" AS ENUM('view', 'standard');
  CREATE TYPE "public"."enum_projects_design_openings_side" AS ENUM('front', 'right', 'back', 'left');
  CREATE TYPE "public"."enum_projects_design_doors_orientation" AS ENUM('horizontal', 'vertical');
  CREATE TYPE "public"."enum_projects_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_projects_design_ridge_axis" AS ENUM('x', 'y');
  CREATE TYPE "public"."enum_projects_design_terrace_side" AS ENUM('front', 'right', 'back', 'left');
  CREATE TYPE "public"."enum_projects_defaults_roof_kind" AS ENUM('gable', 'shed', 'gambrel');
  CREATE TYPE "public"."enum_projects_defaults_facade_finish" AS ENUM('timber-imitation', 'planken', 'fiber-cement');
  CREATE TYPE "public"."enum_projects_defaults_window_style" AS ENUM('standard', 'panoramic');
  CREATE TYPE "public"."enum_built_objects_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_tariff_rates_conditions_option" AS ENUM('roof', 'facade', 'windows', 'insulation', 'engineering');
  CREATE TYPE "public"."enum_tariff_rates_driver" AS ENUM('lumpSum', 'totalArea', 'footprintArea', 'groundFloorArea', 'slabArea', 'ceilingArea', 'wallArea', 'facadeArea', 'roofArea', 'roofInsulationArea', 'windowArea', 'panoramicWindowArea', 'windowCount', 'exteriorDoorCount', 'interiorDoorCount', 'terraceArea', 'pileCount', 'perimeter', 'wetZoneCount', 'chimneyCount');
  CREATE TYPE "public"."enum_tariff_stages_conditions_option" AS ENUM('roof', 'facade', 'windows', 'insulation', 'engineering');
  CREATE TYPE "public"."enum_tariff_stages_driver" AS ENUM('lumpSum', 'totalArea', 'footprintArea', 'groundFloorArea', 'slabArea', 'ceilingArea', 'wallArea', 'facadeArea', 'roofArea', 'roofInsulationArea', 'windowArea', 'panoramicWindowArea', 'windowCount', 'exteriorDoorCount', 'interiorDoorCount', 'terraceArea', 'pileCount', 'perimeter', 'wetZoneCount', 'chimneyCount');
  CREATE TYPE "public"."enum_catalog_options_facade_palettes_finish" AS ENUM('timber-imitation', 'planken', 'fiber-cement');
  CREATE TYPE "public"."enum_technology_layers_role" AS ENUM('cladding', 'air-gap', 'membrane', 'insulation', 'batten', 'lining');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source" varchar NOT NULL,
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
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "project_types" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"order" numeric DEFAULT 100 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "project_types_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "room_kinds" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"bedroom" boolean DEFAULT false,
  	"wet_zone" boolean DEFAULT false,
  	"stair" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "room_kinds_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "projects_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"view" "enum_projects_gallery_view" DEFAULT 'front' NOT NULL
  );
  
  CREATE TABLE "projects_design_rooms" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"kind_id" integer NOT NULL,
  	"level" numeric DEFAULT 0 NOT NULL,
  	"x" numeric NOT NULL,
  	"y" numeric NOT NULL,
  	"width" numeric NOT NULL,
  	"depth" numeric NOT NULL
  );
  
  CREATE TABLE "projects_design_openings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"type" "enum_projects_design_openings_type" DEFAULT 'window' NOT NULL,
  	"role" "enum_projects_design_openings_role" DEFAULT 'standard' NOT NULL,
  	"level" numeric DEFAULT 0 NOT NULL,
  	"side" "enum_projects_design_openings_side" NOT NULL,
  	"offset" numeric NOT NULL,
  	"width" numeric NOT NULL,
  	"height" numeric NOT NULL,
  	"sill" numeric NOT NULL,
  	"panoramic_width" numeric
  );
  
  CREATE TABLE "projects_design_doors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"level" numeric DEFAULT 0 NOT NULL,
  	"orientation" "enum_projects_design_doors_orientation" NOT NULL,
  	"x" numeric NOT NULL,
  	"y" numeric NOT NULL,
  	"width" numeric NOT NULL
  );
  
  CREATE TABLE "projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"status" "enum_projects_status" DEFAULT 'draft' NOT NULL,
  	"sort_order" numeric DEFAULT 100 NOT NULL,
  	"type_id" integer NOT NULL,
  	"design_width" numeric NOT NULL,
  	"design_depth" numeric NOT NULL,
  	"design_storeys" numeric DEFAULT 1 NOT NULL,
  	"design_storey_height" numeric NOT NULL,
  	"design_attic" boolean DEFAULT false,
  	"design_ridge_axis" "enum_projects_design_ridge_axis" DEFAULT 'x' NOT NULL,
  	"design_terrace_enabled" boolean DEFAULT false,
  	"design_terrace_side" "enum_projects_design_terrace_side" DEFAULT 'front',
  	"design_terrace_offset" numeric,
  	"design_terrace_length" numeric,
  	"design_terrace_depth" numeric,
  	"design_chimney_enabled" boolean DEFAULT false,
  	"design_chimney_x" numeric,
  	"design_chimney_y" numeric,
  	"defaults_roof_kind" "enum_projects_defaults_roof_kind" DEFAULT 'gable' NOT NULL,
  	"defaults_roof_pitch" numeric DEFAULT 30 NOT NULL,
  	"defaults_insulation" numeric DEFAULT 150 NOT NULL,
  	"defaults_facade_finish" "enum_projects_defaults_facade_finish" DEFAULT 'planken' NOT NULL,
  	"defaults_facade_color" varchar NOT NULL,
  	"defaults_window_style" "enum_projects_defaults_window_style" DEFAULT 'standard' NOT NULL,
  	"metrics_total_area" numeric,
  	"metrics_terrace_area" numeric,
  	"metrics_bedrooms" numeric,
  	"metrics_wet_zones" numeric,
  	"metrics_levels" numeric,
  	"metrics_storeys" numeric,
  	"metrics_attic" boolean,
  	"metrics_storey_type" varchar,
  	"metrics_width" numeric,
  	"metrics_depth" numeric,
  	"metrics_ridge_height" numeric,
  	"pricing_from_price" numeric,
  	"pricing_from_completeness" varchar,
  	"pricing_total_weeks" numeric,
  	"pricing_tariff_revision" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "projects_locales" (
  	"title" varchar NOT NULL,
  	"summary" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "projects_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "built_objects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"status" "enum_built_objects_status" DEFAULT 'draft' NOT NULL,
  	"project_id" integer,
  	"year" numeric NOT NULL,
  	"area" numeric NOT NULL,
  	"location" geometry(Point) NOT NULL,
  	"cover_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "built_objects_locales" (
  	"title" varchar NOT NULL,
  	"settlement" varchar NOT NULL,
  	"region" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"project_types_id" integer,
  	"room_kinds_id" integer,
  	"projects_id" integer,
  	"built_objects_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tariff_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL
  );
  
  CREATE TABLE "tariff_sections_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "tariff_rates_conditions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"option" "enum_tariff_rates_conditions_option" NOT NULL
  );
  
  CREATE TABLE "tariff_rates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"section" varchar NOT NULL,
  	"driver" "enum_tariff_rates_driver" NOT NULL,
  	"unit_price" numeric NOT NULL
  );
  
  CREATE TABLE "tariff_rates_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "tariff_completeness" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL
  );
  
  CREATE TABLE "tariff_completeness_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "tariff_phases" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL
  );
  
  CREATE TABLE "tariff_phases_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "tariff_stages_conditions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"option" "enum_tariff_stages_conditions_option" NOT NULL
  );
  
  CREATE TABLE "tariff_stages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"phase" varchar NOT NULL,
  	"section" varchar,
  	"driver" "enum_tariff_stages_driver",
  	"base_days" numeric NOT NULL,
  	"days_per_unit" numeric DEFAULT 0 NOT NULL
  );
  
  CREATE TABLE "tariff_stages_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "tariff" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"revision" numeric DEFAULT 0,
  	"working_days_per_week" numeric DEFAULT 5 NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "tariff_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "catalog_options_facade_palettes_colors" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hex" varchar NOT NULL
  );
  
  CREATE TABLE "catalog_options_facade_palettes_colors_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "catalog_options_facade_palettes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"finish" "enum_catalog_options_facade_palettes_finish" NOT NULL
  );
  
  CREATE TABLE "catalog_options_engineering_systems" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL
  );
  
  CREATE TABLE "catalog_options_engineering_systems_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "catalog_options" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "technology_layers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"role" "enum_technology_layers_role" NOT NULL,
  	"thickness" numeric NOT NULL,
  	"conductivity" numeric
  );
  
  CREATE TABLE "technology_layers_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "technology_insulation_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"thickness" numeric NOT NULL
  );
  
  CREATE TABLE "technology" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_project_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"projects_id" integer,
  	"built_objects_id" integer
  );
  
  CREATE TABLE "site" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_locales" (
  	"address" varchar NOT NULL,
  	"hours" varchar NOT NULL,
  	"region" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "project_types_locales" ADD CONSTRAINT "project_types_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."project_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "room_kinds_locales" ADD CONSTRAINT "room_kinds_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."room_kinds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_gallery" ADD CONSTRAINT "projects_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_gallery" ADD CONSTRAINT "projects_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_design_rooms" ADD CONSTRAINT "projects_design_rooms_kind_id_room_kinds_id_fk" FOREIGN KEY ("kind_id") REFERENCES "public"."room_kinds"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_design_rooms" ADD CONSTRAINT "projects_design_rooms_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_design_openings" ADD CONSTRAINT "projects_design_openings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_design_doors" ADD CONSTRAINT "projects_design_doors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_type_id_project_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."project_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_locales" ADD CONSTRAINT "projects_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_texts" ADD CONSTRAINT "projects_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "built_objects" ADD CONSTRAINT "built_objects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "built_objects" ADD CONSTRAINT "built_objects_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "built_objects_locales" ADD CONSTRAINT "built_objects_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."built_objects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_project_types_fk" FOREIGN KEY ("project_types_id") REFERENCES "public"."project_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_room_kinds_fk" FOREIGN KEY ("room_kinds_id") REFERENCES "public"."room_kinds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_built_objects_fk" FOREIGN KEY ("built_objects_id") REFERENCES "public"."built_objects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tariff_sections" ADD CONSTRAINT "tariff_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tariff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tariff_sections_locales" ADD CONSTRAINT "tariff_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tariff_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tariff_rates_conditions" ADD CONSTRAINT "tariff_rates_conditions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tariff_rates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tariff_rates" ADD CONSTRAINT "tariff_rates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tariff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tariff_rates_locales" ADD CONSTRAINT "tariff_rates_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tariff_rates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tariff_completeness" ADD CONSTRAINT "tariff_completeness_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tariff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tariff_completeness_locales" ADD CONSTRAINT "tariff_completeness_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tariff_completeness"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tariff_phases" ADD CONSTRAINT "tariff_phases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tariff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tariff_phases_locales" ADD CONSTRAINT "tariff_phases_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tariff_phases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tariff_stages_conditions" ADD CONSTRAINT "tariff_stages_conditions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tariff_stages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tariff_stages" ADD CONSTRAINT "tariff_stages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tariff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tariff_stages_locales" ADD CONSTRAINT "tariff_stages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tariff_stages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tariff_texts" ADD CONSTRAINT "tariff_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tariff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "catalog_options_facade_palettes_colors" ADD CONSTRAINT "catalog_options_facade_palettes_colors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."catalog_options_facade_palettes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "catalog_options_facade_palettes_colors_locales" ADD CONSTRAINT "catalog_options_facade_palettes_colors_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."catalog_options_facade_palettes_colors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "catalog_options_facade_palettes" ADD CONSTRAINT "catalog_options_facade_palettes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."catalog_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "catalog_options_engineering_systems" ADD CONSTRAINT "catalog_options_engineering_systems_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."catalog_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "catalog_options_engineering_systems_locales" ADD CONSTRAINT "catalog_options_engineering_systems_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."catalog_options_engineering_systems"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "technology_layers" ADD CONSTRAINT "technology_layers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."technology"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "technology_layers_locales" ADD CONSTRAINT "technology_layers_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."technology_layers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "technology_insulation_options" ADD CONSTRAINT "technology_insulation_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."technology"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_hero_project_id_projects_id_fk" FOREIGN KEY ("hero_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_rels" ADD CONSTRAINT "home_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_rels" ADD CONSTRAINT "home_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_rels" ADD CONSTRAINT "home_rels_built_objects_fk" FOREIGN KEY ("built_objects_id") REFERENCES "public"."built_objects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_locales" ADD CONSTRAINT "site_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "project_types_slug_idx" ON "project_types" USING btree ("slug");
  CREATE INDEX "project_types_order_idx" ON "project_types" USING btree ("order");
  CREATE INDEX "project_types_updated_at_idx" ON "project_types" USING btree ("updated_at");
  CREATE INDEX "project_types_created_at_idx" ON "project_types" USING btree ("created_at");
  CREATE UNIQUE INDEX "project_types_locales_locale_parent_id_unique" ON "project_types_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "room_kinds_key_idx" ON "room_kinds" USING btree ("key");
  CREATE INDEX "room_kinds_updated_at_idx" ON "room_kinds" USING btree ("updated_at");
  CREATE INDEX "room_kinds_created_at_idx" ON "room_kinds" USING btree ("created_at");
  CREATE UNIQUE INDEX "room_kinds_locales_locale_parent_id_unique" ON "room_kinds_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_gallery_order_idx" ON "projects_gallery" USING btree ("_order");
  CREATE INDEX "projects_gallery_parent_id_idx" ON "projects_gallery" USING btree ("_parent_id");
  CREATE INDEX "projects_gallery_image_idx" ON "projects_gallery" USING btree ("image_id");
  CREATE INDEX "projects_design_rooms_order_idx" ON "projects_design_rooms" USING btree ("_order");
  CREATE INDEX "projects_design_rooms_parent_id_idx" ON "projects_design_rooms" USING btree ("_parent_id");
  CREATE INDEX "projects_design_rooms_kind_idx" ON "projects_design_rooms" USING btree ("kind_id");
  CREATE INDEX "projects_design_openings_order_idx" ON "projects_design_openings" USING btree ("_order");
  CREATE INDEX "projects_design_openings_parent_id_idx" ON "projects_design_openings" USING btree ("_parent_id");
  CREATE INDEX "projects_design_doors_order_idx" ON "projects_design_doors" USING btree ("_order");
  CREATE INDEX "projects_design_doors_parent_id_idx" ON "projects_design_doors" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");
  CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");
  CREATE INDEX "projects_sort_order_idx" ON "projects" USING btree ("sort_order");
  CREATE INDEX "projects_type_idx" ON "projects" USING btree ("type_id");
  CREATE INDEX "projects_metrics_metrics_total_area_idx" ON "projects" USING btree ("metrics_total_area");
  CREATE INDEX "projects_metrics_metrics_bedrooms_idx" ON "projects" USING btree ("metrics_bedrooms");
  CREATE INDEX "projects_metrics_metrics_storey_type_idx" ON "projects" USING btree ("metrics_storey_type");
  CREATE INDEX "projects_pricing_pricing_from_price_idx" ON "projects" USING btree ("pricing_from_price");
  CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE UNIQUE INDEX "projects_locales_locale_parent_id_unique" ON "projects_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_texts_order_parent" ON "projects_texts" USING btree ("order","parent_id");
  CREATE UNIQUE INDEX "built_objects_slug_idx" ON "built_objects" USING btree ("slug");
  CREATE INDEX "built_objects_status_idx" ON "built_objects" USING btree ("status");
  CREATE INDEX "built_objects_project_idx" ON "built_objects" USING btree ("project_id");
  CREATE INDEX "built_objects_year_idx" ON "built_objects" USING btree ("year");
  CREATE INDEX "built_objects_cover_idx" ON "built_objects" USING btree ("cover_id");
  CREATE INDEX "built_objects_updated_at_idx" ON "built_objects" USING btree ("updated_at");
  CREATE INDEX "built_objects_created_at_idx" ON "built_objects" USING btree ("created_at");
  CREATE UNIQUE INDEX "built_objects_locales_locale_parent_id_unique" ON "built_objects_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_project_types_id_idx" ON "payload_locked_documents_rels" USING btree ("project_types_id");
  CREATE INDEX "payload_locked_documents_rels_room_kinds_id_idx" ON "payload_locked_documents_rels" USING btree ("room_kinds_id");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");
  CREATE INDEX "payload_locked_documents_rels_built_objects_id_idx" ON "payload_locked_documents_rels" USING btree ("built_objects_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "tariff_sections_order_idx" ON "tariff_sections" USING btree ("_order");
  CREATE INDEX "tariff_sections_parent_id_idx" ON "tariff_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "tariff_sections_locales_locale_parent_id_unique" ON "tariff_sections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "tariff_rates_conditions_order_idx" ON "tariff_rates_conditions" USING btree ("_order");
  CREATE INDEX "tariff_rates_conditions_parent_id_idx" ON "tariff_rates_conditions" USING btree ("_parent_id");
  CREATE INDEX "tariff_rates_order_idx" ON "tariff_rates" USING btree ("_order");
  CREATE INDEX "tariff_rates_parent_id_idx" ON "tariff_rates" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "tariff_rates_locales_locale_parent_id_unique" ON "tariff_rates_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "tariff_completeness_order_idx" ON "tariff_completeness" USING btree ("_order");
  CREATE INDEX "tariff_completeness_parent_id_idx" ON "tariff_completeness" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "tariff_completeness_locales_locale_parent_id_unique" ON "tariff_completeness_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "tariff_phases_order_idx" ON "tariff_phases" USING btree ("_order");
  CREATE INDEX "tariff_phases_parent_id_idx" ON "tariff_phases" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "tariff_phases_locales_locale_parent_id_unique" ON "tariff_phases_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "tariff_stages_conditions_order_idx" ON "tariff_stages_conditions" USING btree ("_order");
  CREATE INDEX "tariff_stages_conditions_parent_id_idx" ON "tariff_stages_conditions" USING btree ("_parent_id");
  CREATE INDEX "tariff_stages_order_idx" ON "tariff_stages" USING btree ("_order");
  CREATE INDEX "tariff_stages_parent_id_idx" ON "tariff_stages" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "tariff_stages_locales_locale_parent_id_unique" ON "tariff_stages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "tariff_texts_order_parent" ON "tariff_texts" USING btree ("order","parent_id");
  CREATE INDEX "catalog_options_facade_palettes_colors_order_idx" ON "catalog_options_facade_palettes_colors" USING btree ("_order");
  CREATE INDEX "catalog_options_facade_palettes_colors_parent_id_idx" ON "catalog_options_facade_palettes_colors" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "catalog_options_facade_palettes_colors_locales_locale_parent" ON "catalog_options_facade_palettes_colors_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "catalog_options_facade_palettes_order_idx" ON "catalog_options_facade_palettes" USING btree ("_order");
  CREATE INDEX "catalog_options_facade_palettes_parent_id_idx" ON "catalog_options_facade_palettes" USING btree ("_parent_id");
  CREATE INDEX "catalog_options_engineering_systems_order_idx" ON "catalog_options_engineering_systems" USING btree ("_order");
  CREATE INDEX "catalog_options_engineering_systems_parent_id_idx" ON "catalog_options_engineering_systems" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "catalog_options_engineering_systems_locales_locale_parent_id" ON "catalog_options_engineering_systems_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "technology_layers_order_idx" ON "technology_layers" USING btree ("_order");
  CREATE INDEX "technology_layers_parent_id_idx" ON "technology_layers" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "technology_layers_locales_locale_parent_id_unique" ON "technology_layers_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "technology_insulation_options_order_idx" ON "technology_insulation_options" USING btree ("_order");
  CREATE INDEX "technology_insulation_options_parent_id_idx" ON "technology_insulation_options" USING btree ("_parent_id");
  CREATE INDEX "home_hero_project_idx" ON "home" USING btree ("hero_project_id");
  CREATE INDEX "home_rels_order_idx" ON "home_rels" USING btree ("order");
  CREATE INDEX "home_rels_parent_idx" ON "home_rels" USING btree ("parent_id");
  CREATE INDEX "home_rels_path_idx" ON "home_rels" USING btree ("path");
  CREATE INDEX "home_rels_projects_id_idx" ON "home_rels" USING btree ("projects_id");
  CREATE INDEX "home_rels_built_objects_id_idx" ON "home_rels" USING btree ("built_objects_id");
  CREATE UNIQUE INDEX "site_locales_locale_parent_id_unique" ON "site_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "project_types" CASCADE;
  DROP TABLE "project_types_locales" CASCADE;
  DROP TABLE "room_kinds" CASCADE;
  DROP TABLE "room_kinds_locales" CASCADE;
  DROP TABLE "projects_gallery" CASCADE;
  DROP TABLE "projects_design_rooms" CASCADE;
  DROP TABLE "projects_design_openings" CASCADE;
  DROP TABLE "projects_design_doors" CASCADE;
  DROP TABLE "projects" CASCADE;
  DROP TABLE "projects_locales" CASCADE;
  DROP TABLE "projects_texts" CASCADE;
  DROP TABLE "built_objects" CASCADE;
  DROP TABLE "built_objects_locales" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "tariff_sections" CASCADE;
  DROP TABLE "tariff_sections_locales" CASCADE;
  DROP TABLE "tariff_rates_conditions" CASCADE;
  DROP TABLE "tariff_rates" CASCADE;
  DROP TABLE "tariff_rates_locales" CASCADE;
  DROP TABLE "tariff_completeness" CASCADE;
  DROP TABLE "tariff_completeness_locales" CASCADE;
  DROP TABLE "tariff_phases" CASCADE;
  DROP TABLE "tariff_phases_locales" CASCADE;
  DROP TABLE "tariff_stages_conditions" CASCADE;
  DROP TABLE "tariff_stages" CASCADE;
  DROP TABLE "tariff_stages_locales" CASCADE;
  DROP TABLE "tariff" CASCADE;
  DROP TABLE "tariff_texts" CASCADE;
  DROP TABLE "catalog_options_facade_palettes_colors" CASCADE;
  DROP TABLE "catalog_options_facade_palettes_colors_locales" CASCADE;
  DROP TABLE "catalog_options_facade_palettes" CASCADE;
  DROP TABLE "catalog_options_engineering_systems" CASCADE;
  DROP TABLE "catalog_options_engineering_systems_locales" CASCADE;
  DROP TABLE "catalog_options" CASCADE;
  DROP TABLE "technology_layers" CASCADE;
  DROP TABLE "technology_layers_locales" CASCADE;
  DROP TABLE "technology_insulation_options" CASCADE;
  DROP TABLE "technology" CASCADE;
  DROP TABLE "home" CASCADE;
  DROP TABLE "home_rels" CASCADE;
  DROP TABLE "site" CASCADE;
  DROP TABLE "site_locales" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_projects_gallery_view";
  DROP TYPE "public"."enum_projects_design_openings_type";
  DROP TYPE "public"."enum_projects_design_openings_role";
  DROP TYPE "public"."enum_projects_design_openings_side";
  DROP TYPE "public"."enum_projects_design_doors_orientation";
  DROP TYPE "public"."enum_projects_status";
  DROP TYPE "public"."enum_projects_design_ridge_axis";
  DROP TYPE "public"."enum_projects_design_terrace_side";
  DROP TYPE "public"."enum_projects_defaults_roof_kind";
  DROP TYPE "public"."enum_projects_defaults_facade_finish";
  DROP TYPE "public"."enum_projects_defaults_window_style";
  DROP TYPE "public"."enum_built_objects_status";
  DROP TYPE "public"."enum_tariff_rates_conditions_option";
  DROP TYPE "public"."enum_tariff_rates_driver";
  DROP TYPE "public"."enum_tariff_stages_conditions_option";
  DROP TYPE "public"."enum_tariff_stages_driver";
  DROP TYPE "public"."enum_catalog_options_facade_palettes_finish";
  DROP TYPE "public"."enum_technology_layers_role";`)
}
