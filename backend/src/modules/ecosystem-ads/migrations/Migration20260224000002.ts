import { Migration } from "@mikro-orm/migrations"

export class Migration20260224000002 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_banner_event_banner_id" ON "banner_event" ("banner_id");'
    )
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_banner_event_type" ON "banner_event" ("event_type");'
    )
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_ecosystem_slot_current_banner_id" ON "ecosystem_slot" ("current_banner_id");'
    )
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_ecosystem_slot_site_id" ON "ecosystem_slot" ("site_id");'
    )
  }

  async down(): Promise<void> {
    this.addSql('DROP INDEX IF EXISTS "IDX_banner_event_banner_id";')
    this.addSql('DROP INDEX IF EXISTS "IDX_banner_event_type";')
    this.addSql('DROP INDEX IF EXISTS "IDX_ecosystem_slot_current_banner_id";')
    this.addSql('DROP INDEX IF EXISTS "IDX_ecosystem_slot_site_id";')
  }
}
