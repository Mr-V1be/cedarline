import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'reset-demo';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'reset-demo';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // The older schema has no such task: its queued runs go before the type shrinks.
  await db.execute(sql`
   DELETE FROM "payload_jobs" WHERE "task_slug" = 'reset-demo';
  DELETE FROM "payload_jobs_log" WHERE "task_slug" = 'reset-demo';
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'deliver-lead', 'purge-mailbox', 'refresh-key-rate');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'deliver-lead', 'purge-mailbox', 'refresh-key-rate');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";`)
}
