import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260301000001 extends Migration {

  override async up(): Promise<void> {
    // Create booking_service_type table (includes all fields from initial design + Phase 1 enhancements)
    this.addSql(`
      create table if not exists "booking_service_type" (
        "id" text not null,
        "title" text not null,
        "description" text not null default '',
        "duration_minutes" integer not null default 45,
        "price" integer not null default 0,
        "currency" text not null default 'INR',
        "is_active" boolean not null default true,
        "display_order" integer not null default 0,
        "image_1" text not null default '',
        "image_2" text not null default '',
        "image_3" text not null default '',
        "what_is_included" text not null default '',
        "outcomes" text not null default '',
        "mode" text not null default 'online',
        "badge_text" text not null default '',
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "booking_service_type_pkey" primary key ("id")
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_booking_service_type_deleted_at" ON "booking_service_type" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "booking_service_type" cascade;`);
  }

}
