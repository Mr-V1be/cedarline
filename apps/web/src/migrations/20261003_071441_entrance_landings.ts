import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_projects_design_terrace_reach" AS ENUM('left', 'right', 'both');
  ALTER TYPE "public"."enum_tariff_rates_driver" ADD VALUE 'porchArea' BEFORE 'pileCount';
  ALTER TYPE "public"."enum_tariff_rates_driver" ADD VALUE 'stepCount' BEFORE 'pileCount';
  ALTER TYPE "public"."enum_tariff_stages_driver" ADD VALUE 'porchArea' BEFORE 'pileCount';
  ALTER TYPE "public"."enum_tariff_stages_driver" ADD VALUE 'stepCount' BEFORE 'pileCount';
  ALTER TABLE "projects" ADD COLUMN "design_terrace_entrance" varchar;
  ALTER TABLE "projects" ADD COLUMN "design_terrace_reach" "enum_projects_design_terrace_reach" DEFAULT 'left';
  -- A terrace now belongs to an entrance door: the door on the terrace's old wall closest to
  -- its middle. It reaches from the door towards where most of the old deck was.
  UPDATE "projects" AS p SET
    "design_terrace_entrance" = d."key",
    "design_terrace_reach" = (CASE
      WHEN p."design_terrace_length" >= 0.9 * (CASE WHEN p."design_terrace_side" IN ('front', 'back') THEN p."design_width" ELSE p."design_depth" END) THEN 'both'
      WHEN p."design_terrace_offset" + p."design_terrace_length" / 2 < d."offset" + d."width" / 2 THEN 'left'
      ELSE 'right'
    END)::"enum_projects_design_terrace_reach"
  FROM (
    SELECT DISTINCT ON (o."_parent_id") o."_parent_id", o."key", o."offset", o."width"
    FROM "projects_design_openings" AS o
    JOIN "projects" AS t ON t."id" = o."_parent_id"
    WHERE o."type" = 'door' AND o."side"::text = t."design_terrace_side"::text
    ORDER BY o."_parent_id",
      abs(o."offset" + o."width" / 2 - t."design_terrace_offset" - t."design_terrace_length" / 2)
  ) AS d
  WHERE d."_parent_id" = p."id" AND p."design_terrace_enabled" = true;
  -- No door on the terrace's wall: the terrace moves to the first exterior door, as long as
  -- that door's wall allows.
  UPDATE "projects" AS p SET
    "design_terrace_entrance" = d."key",
    "design_terrace_reach" = 'both',
    "design_terrace_length" = LEAST(
      p."design_terrace_length",
      CASE WHEN d."side" IN ('front', 'back') THEN p."design_width" ELSE p."design_depth" END
    )
  FROM (
    SELECT DISTINCT ON ("_parent_id") "_parent_id", "key", "side"::text AS "side"
    FROM "projects_design_openings" WHERE "type" = 'door' ORDER BY "_parent_id", "_order"
  ) AS d
  WHERE d."_parent_id" = p."id" AND p."design_terrace_enabled" = true
    AND p."design_terrace_entrance" IS NULL;
  ALTER TABLE "projects" DROP COLUMN "design_terrace_side";
  ALTER TABLE "projects" DROP COLUMN "design_terrace_offset";
  DROP TYPE "public"."enum_projects_design_terrace_side";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_projects_design_terrace_side" AS ENUM('front', 'right', 'back', 'left');
  ALTER TABLE "tariff_rates" ALTER COLUMN "driver" SET DATA TYPE text;
  DELETE FROM "tariff_rates" WHERE "driver" IN ('porchArea', 'stepCount');
  DROP TYPE "public"."enum_tariff_rates_driver";
  CREATE TYPE "public"."enum_tariff_rates_driver" AS ENUM('lumpSum', 'totalArea', 'footprintArea', 'groundFloorArea', 'slabArea', 'ceilingArea', 'wallArea', 'facadeArea', 'roofArea', 'roofInsulationArea', 'windowArea', 'panoramicWindowArea', 'windowCount', 'exteriorDoorCount', 'interiorDoorCount', 'terraceArea', 'pileCount', 'perimeter', 'wetZoneCount', 'chimneyCount');
  ALTER TABLE "tariff_rates" ALTER COLUMN "driver" SET DATA TYPE "public"."enum_tariff_rates_driver" USING "driver"::"public"."enum_tariff_rates_driver";
  ALTER TABLE "tariff_stages" ALTER COLUMN "driver" SET DATA TYPE text;
  UPDATE "tariff_stages" SET "driver" = NULL WHERE "driver" IN ('porchArea', 'stepCount');
  DROP TYPE "public"."enum_tariff_stages_driver";
  CREATE TYPE "public"."enum_tariff_stages_driver" AS ENUM('lumpSum', 'totalArea', 'footprintArea', 'groundFloorArea', 'slabArea', 'ceilingArea', 'wallArea', 'facadeArea', 'roofArea', 'roofInsulationArea', 'windowArea', 'panoramicWindowArea', 'windowCount', 'exteriorDoorCount', 'interiorDoorCount', 'terraceArea', 'pileCount', 'perimeter', 'wetZoneCount', 'chimneyCount');
  ALTER TABLE "tariff_stages" ALTER COLUMN "driver" SET DATA TYPE "public"."enum_tariff_stages_driver" USING "driver"::"public"."enum_tariff_stages_driver";
  ALTER TABLE "projects" ADD COLUMN "design_terrace_side" "enum_projects_design_terrace_side" DEFAULT 'front';
  ALTER TABLE "projects" ADD COLUMN "design_terrace_offset" numeric;
  -- Back to a terrace placed along a wall: the wall of its door, from where it reached.
  UPDATE "projects" AS p SET
    "design_terrace_side" = o."side"::text::"enum_projects_design_terrace_side",
    "design_terrace_offset" = GREATEST(0, LEAST(
      CASE WHEN o."side"::text IN ('front', 'back') THEN p."design_width" ELSE p."design_depth" END
        - p."design_terrace_length",
      CASE p."design_terrace_reach"
        WHEN 'right' THEN o."offset" - 400
        WHEN 'left' THEN o."offset" + o."width" + 400 - p."design_terrace_length"
        ELSE o."offset" + o."width" / 2 - p."design_terrace_length" / 2
      END
    ))
  FROM "projects_design_openings" AS o
  WHERE o."_parent_id" = p."id" AND o."key" = p."design_terrace_entrance";
  ALTER TABLE "projects" DROP COLUMN "design_terrace_entrance";
  ALTER TABLE "projects" DROP COLUMN "design_terrace_reach";
  DROP TYPE "public"."enum_projects_design_terrace_reach";`)
}
