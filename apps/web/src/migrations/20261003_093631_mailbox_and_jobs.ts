import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'deliver-lead', 'purge-mailbox', 'refresh-key-rate');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'deliver-lead', 'purge-mailbox', 'refresh-key-rate');
  CREATE TABLE "mailbox_attachments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"file_id" integer NOT NULL,
  	"filename" varchar NOT NULL,
  	"size" numeric NOT NULL
  );
  
  CREATE TABLE "mailbox" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key_hash" varchar NOT NULL,
  	"to" varchar NOT NULL,
  	"from" varchar NOT NULL,
  	"sent_at" timestamp(3) with time zone NOT NULL,
  	"subject" varchar NOT NULL,
  	"text" varchar,
  	"html" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "mailbox_files" (
  	"id" serial PRIMARY KEY NOT NULL,
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
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_jobs_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "mailbox_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "mailbox_files_id" integer;
  ALTER TABLE "mailbox_attachments" ADD CONSTRAINT "mailbox_attachments_file_id_mailbox_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."mailbox_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "mailbox_attachments" ADD CONSTRAINT "mailbox_attachments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mailbox"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "mailbox_attachments_order_idx" ON "mailbox_attachments" USING btree ("_order");
  CREATE INDEX "mailbox_attachments_parent_id_idx" ON "mailbox_attachments" USING btree ("_parent_id");
  CREATE INDEX "mailbox_attachments_file_idx" ON "mailbox_attachments" USING btree ("file_id");
  CREATE UNIQUE INDEX "mailbox_key_hash_idx" ON "mailbox" USING btree ("key_hash");
  CREATE INDEX "mailbox_sent_at_idx" ON "mailbox" USING btree ("sent_at");
  CREATE INDEX "mailbox_updated_at_idx" ON "mailbox" USING btree ("updated_at");
  CREATE INDEX "mailbox_created_at_idx" ON "mailbox" USING btree ("created_at");
  CREATE INDEX "mailbox_files_updated_at_idx" ON "mailbox_files" USING btree ("updated_at");
  CREATE INDEX "mailbox_files_created_at_idx" ON "mailbox_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "mailbox_files_filename_idx" ON "mailbox_files" USING btree ("filename");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_mailbox_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailbox"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_mailbox_files_fk" FOREIGN KEY ("mailbox_files_id") REFERENCES "public"."mailbox_files"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_mailbox_id_idx" ON "payload_locked_documents_rels" USING btree ("mailbox_id");
  CREATE INDEX "payload_locked_documents_rels_mailbox_files_id_idx" ON "payload_locked_documents_rels" USING btree ("mailbox_files_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "mailbox_attachments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "mailbox" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "mailbox_files" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs_stats" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "mailbox_attachments" CASCADE;
  DROP TABLE "mailbox" CASCADE;
  DROP TABLE "mailbox_files" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_jobs_stats" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_mailbox_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_mailbox_files_fk";
  
  DROP INDEX "payload_locked_documents_rels_mailbox_id_idx";
  DROP INDEX "payload_locked_documents_rels_mailbox_files_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "mailbox_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "mailbox_files_id";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";`)
}
