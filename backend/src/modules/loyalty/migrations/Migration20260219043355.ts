import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260219043355 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "loyalty_transaction" ("id" text not null, "customer_id" text not null, "points" integer not null, "type" text check ("type" in ('earned', 'redeemed', 'adjusted', 'expired')) not null, "description" text not null, "balance_after" integer not null, "expires_at" timestamptz null, "is_expired" boolean not null default false, "order_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "loyalty_transaction_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_loyalty_transaction_deleted_at" ON "loyalty_transaction" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "loyalty_transaction" cascade;`);
  }

}
