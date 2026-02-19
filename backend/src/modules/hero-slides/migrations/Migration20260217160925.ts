import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260217160925 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "hero_slide" ("id" text not null, "image_url" text not null, "heading" text not null, "subtext" text not null, "cta_label" text not null default 'Shop Now', "cta_link" text not null default '/', "is_active" boolean not null default true, "display_order" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "hero_slide_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_hero_slide_deleted_at" ON "hero_slide" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "hero_slide" cascade;`);
  }

}
