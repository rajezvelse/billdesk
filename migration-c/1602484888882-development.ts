import {MigrationInterface, QueryRunner} from "typeorm";

export class development1602484888882 implements MigrationInterface {
    name = 'development1602484888882'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "customers" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "name" varchar NOT NULL, "phone" varchar NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "sales" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "date" datetime NOT NULL, "totalPrice" integer NOT NULL, "totalDiscount" integer NOT NULL, "totalCost" integer NOT NULL, "customerId" integer)`);
        await queryRunner.query(`CREATE TABLE "sales_particulars" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "price" integer NOT NULL, "quantity" integer NOT NULL, "cost" integer NOT NULL, "discount" integer NOT NULL, "discountedCost" integer NOT NULL, "salesRecordId" integer, "productId" integer)`);
        await queryRunner.query(`CREATE TABLE "sales_payments" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "amount" integer NOT NULL, "salesRecordId" integer)`);
        await queryRunner.query(`CREATE TABLE "temporary_sales" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "date" datetime NOT NULL, "totalPrice" integer NOT NULL, "totalDiscount" integer NOT NULL, "totalCost" integer NOT NULL, "customerId" integer, CONSTRAINT "FK_3a92cf6add00043cef9833db1cd" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_sales"("id", "createdAt", "updatedAt", "deletedAt", "date", "totalPrice", "totalDiscount", "totalCost", "customerId") SELECT "id", "createdAt", "updatedAt", "deletedAt", "date", "totalPrice", "totalDiscount", "totalCost", "customerId" FROM "sales"`);
        await queryRunner.query(`DROP TABLE "sales"`);
        await queryRunner.query(`ALTER TABLE "temporary_sales" RENAME TO "sales"`);
        await queryRunner.query(`CREATE TABLE "temporary_sales_particulars" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "price" integer NOT NULL, "quantity" integer NOT NULL, "cost" integer NOT NULL, "discount" integer NOT NULL, "discountedCost" integer NOT NULL, "salesRecordId" integer, "productId" integer, CONSTRAINT "FK_be3b461f75572000a14cd78219a" FOREIGN KEY ("salesRecordId") REFERENCES "sales" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_3df11c2e85c6751392f373c1e5d" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_sales_particulars"("id", "createdAt", "updatedAt", "deletedAt", "price", "quantity", "cost", "discount", "discountedCost", "salesRecordId", "productId") SELECT "id", "createdAt", "updatedAt", "deletedAt", "price", "quantity", "cost", "discount", "discountedCost", "salesRecordId", "productId" FROM "sales_particulars"`);
        await queryRunner.query(`DROP TABLE "sales_particulars"`);
        await queryRunner.query(`ALTER TABLE "temporary_sales_particulars" RENAME TO "sales_particulars"`);
        await queryRunner.query(`CREATE TABLE "temporary_sales_payments" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "amount" integer NOT NULL, "salesRecordId" integer, CONSTRAINT "FK_3ef52ba43aa91b9b5a6ae67e97c" FOREIGN KEY ("salesRecordId") REFERENCES "sales" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_sales_payments"("id", "createdAt", "updatedAt", "deletedAt", "amount", "salesRecordId") SELECT "id", "createdAt", "updatedAt", "deletedAt", "amount", "salesRecordId" FROM "sales_payments"`);
        await queryRunner.query(`DROP TABLE "sales_payments"`);
        await queryRunner.query(`ALTER TABLE "temporary_sales_payments" RENAME TO "sales_payments"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sales_payments" RENAME TO "temporary_sales_payments"`);
        await queryRunner.query(`CREATE TABLE "sales_payments" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "amount" integer NOT NULL, "salesRecordId" integer)`);
        await queryRunner.query(`INSERT INTO "sales_payments"("id", "createdAt", "updatedAt", "deletedAt", "amount", "salesRecordId") SELECT "id", "createdAt", "updatedAt", "deletedAt", "amount", "salesRecordId" FROM "temporary_sales_payments"`);
        await queryRunner.query(`DROP TABLE "temporary_sales_payments"`);
        await queryRunner.query(`ALTER TABLE "sales_particulars" RENAME TO "temporary_sales_particulars"`);
        await queryRunner.query(`CREATE TABLE "sales_particulars" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "price" integer NOT NULL, "quantity" integer NOT NULL, "cost" integer NOT NULL, "discount" integer NOT NULL, "discountedCost" integer NOT NULL, "salesRecordId" integer, "productId" integer)`);
        await queryRunner.query(`INSERT INTO "sales_particulars"("id", "createdAt", "updatedAt", "deletedAt", "price", "quantity", "cost", "discount", "discountedCost", "salesRecordId", "productId") SELECT "id", "createdAt", "updatedAt", "deletedAt", "price", "quantity", "cost", "discount", "discountedCost", "salesRecordId", "productId" FROM "temporary_sales_particulars"`);
        await queryRunner.query(`DROP TABLE "temporary_sales_particulars"`);
        await queryRunner.query(`ALTER TABLE "sales" RENAME TO "temporary_sales"`);
        await queryRunner.query(`CREATE TABLE "sales" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "date" datetime NOT NULL, "totalPrice" integer NOT NULL, "totalDiscount" integer NOT NULL, "totalCost" integer NOT NULL, "customerId" integer)`);
        await queryRunner.query(`INSERT INTO "sales"("id", "createdAt", "updatedAt", "deletedAt", "date", "totalPrice", "totalDiscount", "totalCost", "customerId") SELECT "id", "createdAt", "updatedAt", "deletedAt", "date", "totalPrice", "totalDiscount", "totalCost", "customerId" FROM "temporary_sales"`);
        await queryRunner.query(`DROP TABLE "temporary_sales"`);
        await queryRunner.query(`DROP TABLE "sales_payments"`);
        await queryRunner.query(`DROP TABLE "sales_particulars"`);
        await queryRunner.query(`DROP TABLE "sales"`);
        await queryRunner.query(`DROP TABLE "customers"`);
    }

}
