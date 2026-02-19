import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260217161142 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "testimonial" ("id" text not null, "quote" text not null, "name" text not null, "location" text not null, "avatar_url" text null, "rating" integer not null default 5, "type" text not null default 'testimonial', "product_name" text null, "is_active" boolean not null default true, "display_order" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "testimonial_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_testimonial_deleted_at" ON "testimonial" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "testimonial" cascade;`);
  }

}
