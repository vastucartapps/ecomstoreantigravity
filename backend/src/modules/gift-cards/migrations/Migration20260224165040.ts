import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260224165040 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "gift_card" ("id" text not null, "code" text not null, "value" integer not null, "balance" integer not null, "currency_code" text not null default 'inr', "is_disabled" boolean not null default false, "ends_at" timestamptz null, "metadata_json" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "gift_card_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_gift_card_deleted_at" ON "gift_card" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "gift_card" cascade;`);
  }

}
