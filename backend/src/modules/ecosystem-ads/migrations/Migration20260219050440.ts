import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260219050440 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "banner_event" ("id" text not null, "banner_id" text not null, "site_id" text not null, "slot_id" text not null, "event_type" text check ("event_type" in ('impression', 'click')) not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "banner_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_banner_event_deleted_at" ON "banner_event" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ecosystem_banner" ("id" text not null, "name" text not null, "headline" text not null, "cta_text" text not null default '', "cta_url" text not null default '', "status" text check ("status" in ('draft', 'scheduled', 'live', 'expired')) not null default 'draft', "is_active" boolean not null default false, "start_date" timestamptz null, "end_date" timestamptz null, "priority" integer not null default 1, "product_ids_json" text not null default '[]', "product_names_json" text not null default '[]', "creatives_json" text not null default '[]', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ecosystem_banner_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ecosystem_banner_deleted_at" ON "ecosystem_banner" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ecosystem_site" ("id" text not null, "subdomain" text not null, "display_name" text not null, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ecosystem_site_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ecosystem_site_deleted_at" ON "ecosystem_site" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ecosystem_slot" ("id" text not null, "site_id" text not null, "name" text not null, "ratio" text not null, "is_active" boolean not null default true, "current_banner_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ecosystem_slot_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ecosystem_slot_deleted_at" ON "ecosystem_slot" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "social_post" ("id" text not null, "banner_id" text not null, "platform" text check ("platform" in ('pinterest', 'instagram', 'facebook', 'twitter', 'threads')) not null, "post_url" text not null default '', "status" text check ("status" in ('published', 'pending', 'failed')) not null default 'pending', "published_at" timestamptz null, "caption" text not null default '', "meta_json" text not null default '{}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "social_post_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_social_post_deleted_at" ON "social_post" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "banner_event" cascade;`);

    this.addSql(`drop table if exists "ecosystem_banner" cascade;`);

    this.addSql(`drop table if exists "ecosystem_site" cascade;`);

    this.addSql(`drop table if exists "ecosystem_slot" cascade;`);

    this.addSql(`drop table if exists "social_post" cascade;`);
  }

}
