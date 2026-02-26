import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260226_SupportTickets extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "support_ticket" (
        "id" text not null,
        "customer_id" text not null,
        "customer_email" text not null,
        "customer_name" text not null,
        "category" text not null,
        "message" text not null,
        "status" text not null default 'open',
        "admin_reply" text null,
        "admin_reply_at" timestamptz null,
        "admin_reply_by" text null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "support_ticket_pkey" primary key ("id")
      );
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_support_ticket_deleted_at" ON "support_ticket" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_support_ticket_customer_id" ON "support_ticket" ("customer_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_support_ticket_status" ON "support_ticket" ("status");`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "support_ticket" cascade;`)
  }
}
