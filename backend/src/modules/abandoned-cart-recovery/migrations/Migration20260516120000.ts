import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Adds opted_out_at to abandoned_cart_recovery so the recovery job can honor
 * one-click unsubscribe from the email footer without storing the opt-out
 * flag in some side table.
 */
export class Migration20260516120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "abandoned_cart_recovery" add column if not exists "opted_out_at" timestamptz null;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_abandoned_cart_recovery_opted_out_at" ON "abandoned_cart_recovery" ("opted_out_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "abandoned_cart_recovery" drop column if exists "opted_out_at";`
    )
  }
}
