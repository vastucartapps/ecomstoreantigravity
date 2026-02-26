import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260226_GiftCardV2 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "gift_card" add column if not exists "customer_id" text null;`)
    this.addSql(`alter table "gift_card" add column if not exists "recipient_email" text null;`)
    this.addSql(`alter table "gift_card" add column if not exists "recipient_name" text null;`)
    this.addSql(`alter table "gift_card" add column if not exists "gift_message" text null;`)
    this.addSql(`alter table "gift_card" add column if not exists "purchased_by_customer_id" text null;`)
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "gift_card" drop column if exists "customer_id";`)
    this.addSql(`alter table "gift_card" drop column if exists "recipient_email";`)
    this.addSql(`alter table "gift_card" drop column if exists "recipient_name";`)
    this.addSql(`alter table "gift_card" drop column if exists "gift_message";`)
    this.addSql(`alter table "gift_card" drop column if exists "purchased_by_customer_id";`)
  }
}
