import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260217151824 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "active_session" ("id" text not null, "auth_identity_id" text not null, "device" text not null default 'Unknown', "ip_address" text not null default '0.0.0.0', "location" text not null default 'Unknown', "user_agent" text not null default '', "last_active" timestamptz not null, "is_current" boolean not null default false, "token_hash" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "active_session_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_active_session_deleted_at" ON "active_session" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "active_session" cascade;`);
  }

}
