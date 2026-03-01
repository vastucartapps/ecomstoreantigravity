import { Migration } from "@mikro-orm/migrations"

export class Migration20260301000002 extends Migration {
  override async up(): Promise<void> {
    // Add slug column to booking_service_type
    this.addSql(`
      ALTER TABLE "booking_service_type"
      ADD COLUMN IF NOT EXISTS "slug" text;
    `)

    // Unique partial index — allows multiple NULL slugs but enforces uniqueness for non-null values
    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_booking_service_type_slug"
      ON "booking_service_type" ("slug")
      WHERE slug IS NOT NULL AND deleted_at IS NULL;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_booking_service_type_slug";`)
    this.addSql(`ALTER TABLE "booking_service_type" DROP COLUMN IF EXISTS "slug";`)
  }
}
