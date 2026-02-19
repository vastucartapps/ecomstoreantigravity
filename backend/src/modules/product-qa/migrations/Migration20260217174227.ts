import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260217174227 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "product_question" ("id" text not null, "product_id" text not null, "question" text not null, "asked_by" text not null, "answer" text null, "answered_by" text null, "answered_at" text null, "is_admin_answer" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_question_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_question_deleted_at" ON "product_question" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_question" cascade;`);
  }

}
