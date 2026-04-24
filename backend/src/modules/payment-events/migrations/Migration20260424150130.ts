import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260424150130 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "payment_event" ("id" text not null, "cart_id" text not null, "order_id" text null, "stage" text check ("stage" in ('initiated', 'succeeded', 'failed', 'dismissed')) not null, "provider" text not null, "currency" text not null, "amount" integer not null default 0, "error_code" text null, "error_message" text null, "user_agent" text null, "ip_address" text null, "email" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payment_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_event_cart_id" ON "payment_event" ("cart_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_event_stage" ON "payment_event" ("stage") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_event_created_at" ON "payment_event" ("created_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_event_deleted_at" ON "payment_event" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "payment_event" cascade;`);
  }

}
