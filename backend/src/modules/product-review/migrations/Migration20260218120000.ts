import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260218120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "product_review" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'pending';`)
    this.addSql(`ALTER TABLE "product_review" ADD COLUMN IF NOT EXISTS "admin_response" text NULL;`)
    this.addSql(`ALTER TABLE "product_review" ADD COLUMN IF NOT EXISTS "customer_email" text NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "product_review" DROP COLUMN IF EXISTS "customer_email";`)
    this.addSql(`ALTER TABLE "product_review" DROP COLUMN IF EXISTS "admin_response";`)
    this.addSql(`ALTER TABLE "product_review" DROP COLUMN IF EXISTS "status";`)
  }

}
