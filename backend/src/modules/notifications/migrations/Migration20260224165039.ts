import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260224165039 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "customer_notification" ("id" text not null, "customer_id" text not null, "type" text check ("type" in ('order', 'promotion', 'stock', 'loyalty')) not null, "title" text not null, "message" text not null, "link" text not null default '', "is_read" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "customer_notification_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_customer_notification_deleted_at" ON "customer_notification" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "customer_notification" cascade;`);
  }

}
