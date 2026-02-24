import { Migration } from "@mikro-orm/migrations"

export class Migration20260224000001 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_loyalty_transaction_customer_id" ON "loyalty_transaction" ("customer_id");'
    )
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_loyalty_transaction_type" ON "loyalty_transaction" ("type");'
    )
  }

  async down(): Promise<void> {
    this.addSql('DROP INDEX IF EXISTS "IDX_loyalty_transaction_customer_id";')
    this.addSql('DROP INDEX IF EXISTS "IDX_loyalty_transaction_type";')
  }
}
