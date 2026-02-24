import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260224165038 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "booking" ("id" text not null, "customer_id" text not null, "title" text not null, "consultant_name" text not null default '', "date" text not null, "time" text not null, "status" text check ("status" in ('pending', 'confirmed', 'completed', 'cancelled')) not null default 'pending', "meeting_link" text not null default '', "price" integer not null default 0, "currency" text not null default 'INR', "notes" text not null default '', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "booking_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_booking_deleted_at" ON "booking" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "booking_blocked_date" ("id" text not null, "date" text not null, "reason" text not null default '', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "booking_blocked_date_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_booking_blocked_date_deleted_at" ON "booking_blocked_date" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "booking_slot_config" ("id" text not null, "config" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "booking_slot_config_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_booking_slot_config_deleted_at" ON "booking_slot_config" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "booking" cascade;`);

    this.addSql(`drop table if exists "booking_blocked_date" cascade;`);

    this.addSql(`drop table if exists "booking_slot_config" cascade;`);
  }

}
