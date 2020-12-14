import {MigrationInterface, QueryRunner} from "typeorm";

export class purchaseTables1603882457603 implements MigrationInterface {
    name = 'purchaseTables1603882457603'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "purchase" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "purchaseNumber" varchar, "date" datetime NOT NULL, "totalCost" integer NOT NULL, "totalDiscount" integer NOT NULL, "totalDiscountedCost" integer NOT NULL, "paymentPaid" integer NOT NULL, "balanceAmount" integer NOT NULL, "status" varchar NOT NULL, "vendorId" integer)`);
        await queryRunner.query(`CREATE TABLE "purchase_particulars" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "price" integer NOT NULL, "quantity" integer NOT NULL, "cost" integer NOT NULL, "discount" integer NOT NULL, "discountedCost" integer NOT NULL, "purchaseRecordId" integer, "productId" integer)`);
        await queryRunner.query(`CREATE TABLE "purchase_payments" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "date" datetime NOT NULL, "mode" varchar NOT NULL, "amount" integer NOT NULL, "purchaseRecordId" integer)`);
        await queryRunner.query(`CREATE TABLE "temporary_purchase" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "purchaseNumber" varchar, "date" datetime NOT NULL, "totalCost" integer NOT NULL, "totalDiscount" integer NOT NULL, "totalDiscountedCost" integer NOT NULL, "paymentPaid" integer NOT NULL, "balanceAmount" integer NOT NULL, "status" varchar NOT NULL, "vendorId" integer, CONSTRAINT "FK_e3f5fe271c0ce3c9a3f93124674" FOREIGN KEY ("vendorId") REFERENCES "vendors" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_purchase"("id", "createdAt", "updatedAt", "deletedAt", "purchaseNumber", "date", "totalCost", "totalDiscount", "totalDiscountedCost", "paymentPaid", "balanceAmount", "status", "vendorId") SELECT "id", "createdAt", "updatedAt", "deletedAt", "purchaseNumber", "date", "totalCost", "totalDiscount", "totalDiscountedCost", "paymentPaid", "balanceAmount", "status", "vendorId" FROM "purchase"`);
        await queryRunner.query(`DROP TABLE "purchase"`);
        await queryRunner.query(`ALTER TABLE "temporary_purchase" RENAME TO "purchase"`);
        await queryRunner.query(`CREATE TABLE "temporary_purchase_particulars" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "price" integer NOT NULL, "quantity" integer NOT NULL, "cost" integer NOT NULL, "discount" integer NOT NULL, "discountedCost" integer NOT NULL, "purchaseRecordId" integer, "productId" integer, CONSTRAINT "FK_af7088987e6f9a99b823bb07313" FOREIGN KEY ("purchaseRecordId") REFERENCES "purchase" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_f3a0213772de00440ddb1d092c1" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_purchase_particulars"("id", "createdAt", "updatedAt", "deletedAt", "price", "quantity", "cost", "discount", "discountedCost", "purchaseRecordId", "productId") SELECT "id", "createdAt", "updatedAt", "deletedAt", "price", "quantity", "cost", "discount", "discountedCost", "purchaseRecordId", "productId" FROM "purchase_particulars"`);
        await queryRunner.query(`DROP TABLE "purchase_particulars"`);
        await queryRunner.query(`ALTER TABLE "temporary_purchase_particulars" RENAME TO "purchase_particulars"`);
        await queryRunner.query(`CREATE TABLE "temporary_purchase_payments" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "date" datetime NOT NULL, "mode" varchar NOT NULL, "amount" integer NOT NULL, "purchaseRecordId" integer, CONSTRAINT "FK_428248441b065a73c0355c59646" FOREIGN KEY ("purchaseRecordId") REFERENCES "purchase" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_purchase_payments"("id", "createdAt", "updatedAt", "deletedAt", "date", "mode", "amount", "purchaseRecordId") SELECT "id", "createdAt", "updatedAt", "deletedAt", "date", "mode", "amount", "purchaseRecordId" FROM "purchase_payments"`);
        await queryRunner.query(`DROP TABLE "purchase_payments"`);
        await queryRunner.query(`ALTER TABLE "temporary_purchase_payments" RENAME TO "purchase_payments"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchase_payments" RENAME TO "temporary_purchase_payments"`);
        await queryRunner.query(`CREATE TABLE "purchase_payments" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "date" datetime NOT NULL, "mode" varchar NOT NULL, "amount" integer NOT NULL, "purchaseRecordId" integer)`);
        await queryRunner.query(`INSERT INTO "purchase_payments"("id", "createdAt", "updatedAt", "deletedAt", "date", "mode", "amount", "purchaseRecordId") SELECT "id", "createdAt", "updatedAt", "deletedAt", "date", "mode", "amount", "purchaseRecordId" FROM "temporary_purchase_payments"`);
        await queryRunner.query(`DROP TABLE "temporary_purchase_payments"`);
        await queryRunner.query(`ALTER TABLE "purchase_particulars" RENAME TO "temporary_purchase_particulars"`);
        await queryRunner.query(`CREATE TABLE "purchase_particulars" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "price" integer NOT NULL, "quantity" integer NOT NULL, "cost" integer NOT NULL, "discount" integer NOT NULL, "discountedCost" integer NOT NULL, "purchaseRecordId" integer, "productId" integer)`);
        await queryRunner.query(`INSERT INTO "purchase_particulars"("id", "createdAt", "updatedAt", "deletedAt", "price", "quantity", "cost", "discount", "discountedCost", "purchaseRecordId", "productId") SELECT "id", "createdAt", "updatedAt", "deletedAt", "price", "quantity", "cost", "discount", "discountedCost", "purchaseRecordId", "productId" FROM "temporary_purchase_particulars"`);
        await queryRunner.query(`DROP TABLE "temporary_purchase_particulars"`);
        await queryRunner.query(`ALTER TABLE "purchase" RENAME TO "temporary_purchase"`);
        await queryRunner.query(`CREATE TABLE "purchase" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "purchaseNumber" varchar, "date" datetime NOT NULL, "totalCost" integer NOT NULL, "totalDiscount" integer NOT NULL, "totalDiscountedCost" integer NOT NULL, "paymentPaid" integer NOT NULL, "balanceAmount" integer NOT NULL, "status" varchar NOT NULL, "vendorId" integer)`);
        await queryRunner.query(`INSERT INTO "purchase"("id", "createdAt", "updatedAt", "deletedAt", "purchaseNumber", "date", "totalCost", "totalDiscount", "totalDiscountedCost", "paymentPaid", "balanceAmount", "status", "vendorId") SELECT "id", "createdAt", "updatedAt", "deletedAt", "purchaseNumber", "date", "totalCost", "totalDiscount", "totalDiscountedCost", "paymentPaid", "balanceAmount", "status", "vendorId" FROM "temporary_purchase"`);
        await queryRunner.query(`DROP TABLE "temporary_purchase"`);
        await queryRunner.query(`DROP TABLE "purchase_payments"`);
        await queryRunner.query(`DROP TABLE "purchase_particulars"`);
        await queryRunner.query(`DROP TABLE "purchase"`);
    }

}
