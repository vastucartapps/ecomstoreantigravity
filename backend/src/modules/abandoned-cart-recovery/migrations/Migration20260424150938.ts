import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260424150938 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "abandoned_cart_recovery" ("id" text not null, "cart_id" text not null, "email" text not null, "stage" integer not null, "sent_at" timestamptz not null default now(), "recovery_token" text not null, "discount_code" text null, "discount_expires_at" timestamptz null, "recovered_at" timestamptz null, "recovered_order_id" text null, "recovered_amount" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "abandoned_cart_recovery_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_abandoned_cart_recovery_token" ON "abandoned_cart_recovery" ("recovery_token") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_abandoned_cart_recovery_cart" ON "abandoned_cart_recovery" ("cart_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_abandoned_cart_recovery_email" ON "abandoned_cart_recovery" ("email") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_abandoned_cart_recovery_sent_at" ON "abandoned_cart_recovery" ("sent_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_abandoned_cart_recovery_deleted_at" ON "abandoned_cart_recovery" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "abandoned_cart_recovery" cascade;`);
  }

}
