import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260217151603 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "marketing_slide" ("id" text not null, "image_url" text not null, "quote" text not null, "attribution" text not null default 'VastuCart', "is_active" boolean not null default true, "display_order" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "marketing_slide_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_slide_deleted_at" ON "marketing_slide" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "marketing_slide" cascade;`);
  }

}
