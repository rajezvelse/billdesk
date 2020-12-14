import {MigrationInterface, QueryRunner} from "typeorm";

export class salesChanges1602662254991 implements MigrationInterface {
    name = 'salesChanges1602662254991'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_customers" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "name" varchar NOT NULL, "phone" varchar NOT NULL)`);
        await queryRunner.query(`INSERT INTO "temporary_customers"("id", "createdAt", "updatedAt", "deletedAt", "name", "phone") SELECT "id", "createdAt", "updatedAt", "deletedAt", "name", "phone" FROM "customers"`);
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`ALTER TABLE "temporary_customers" RENAME TO "customers"`);
        await queryRunner.query(`CREATE TABLE "temporary_sales" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "date" datetime NOT NULL, "totalDiscount" integer NOT NULL, "totalCost" integer NOT NULL, "customerId" integer, "status" varchar NOT NULL, CONSTRAINT "FK_3a92cf6add00043cef9833db1cd" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_sales"("id", "createdAt", "updatedAt", "deletedAt", "date", "totalDiscount", "totalCost", "customerId", "status") SELECT "id", "createdAt", "updatedAt", "deletedAt", "date", "totalDiscount", "totalCost", "customerId", "status" FROM "sales"`);
        await queryRunner.query(`DROP TABLE "sales"`);
        await queryRunner.query(`ALTER TABLE "temporary_sales" RENAME TO "sales"`);
        await queryRunner.query(`CREATE TABLE "temporary_sales" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "date" datetime NOT NULL, "totalDiscount" integer NOT NULL, "totalCost" integer NOT NULL, "customerId" integer, "status" varchar NOT NULL, "totalDiscountedCost" integer NOT NULL, "outstandingAmount" integer NOT NULL, CONSTRAINT "FK_3a92cf6add00043cef9833db1cd" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_sales"("id", "createdAt", "updatedAt", "deletedAt", "date", "totalDiscount", "totalCost", "customerId", "status") SELECT "id", "createdAt", "updatedAt", "deletedAt", "date", "totalDiscount", "totalCost", "customerId", "status" FROM "sales"`);
        await queryRunner.query(`DROP TABLE "sales"`);
        await queryRunner.query(`ALTER TABLE "temporary_sales" RENAME TO "sales"`);
        await queryRunner.query(`CREATE TABLE "temporary_sales_payments" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "amount" integer NOT NULL, "salesRecordId" integer, "mode" varchar NOT NULL, CONSTRAINT "FK_3ef52ba43aa91b9b5a6ae67e97c" FOREIGN KEY ("salesRecordId") REFERENCES "sales" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_sales_payments"("id", "createdAt", "updatedAt", "deletedAt", "amount", "salesRecordId") SELECT "id", "createdAt", "updatedAt", "deletedAt", "amount", "salesRecordId" FROM "sales_payments"`);
        await queryRunner.query(`DROP TABLE "sales_payments"`);
        await queryRunner.query(`ALTER TABLE "temporary_sales_payments" RENAME TO "sales_payments"`);
        await queryRunner.query(`CREATE TABLE "temporary_customers" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "name" varchar NOT NULL, "phone" varchar)`);
        await queryRunner.query(`INSERT INTO "temporary_customers"("id", "createdAt", "updatedAt", "deletedAt", "name", "phone") SELECT "id", "createdAt", "updatedAt", "deletedAt", "name", "phone" FROM "customers"`);
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`ALTER TABLE "temporary_customers" RENAME TO "customers"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" RENAME TO "temporary_customers"`);
        await queryRunner.query(`CREATE TABLE "customers" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "name" varchar NOT NULL, "phone" varchar NOT NULL)`);
        await queryRunner.query(`INSERT INTO "customers"("id", "createdAt", "updatedAt", "deletedAt", "name", "phone") SELECT "id", "createdAt", "updatedAt", "deletedAt", "name", "phone" FROM "temporary_customers"`);
        await queryRunner.query(`DROP TABLE "temporary_customers"`);
        await queryRunner.query(`ALTER TABLE "sales_payments" RENAME TO "temporary_sales_payments"`);
        await queryRunner.query(`CREATE TABLE "sales_payments" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "amount" integer NOT NULL, "salesRecordId" integer, CONSTRAINT "FK_3ef52ba43aa91b9b5a6ae67e97c" FOREIGN KEY ("salesRecordId") REFERENCES "sales" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "sales_payments"("id", "createdAt", "updatedAt", "deletedAt", "amount", "salesRecordId") SELECT "id", "createdAt", "updatedAt", "deletedAt", "amount", "salesRecordId" FROM "temporary_sales_payments"`);
        await queryRunner.query(`DROP TABLE "temporary_sales_payments"`);
        await queryRunner.query(`ALTER TABLE "sales" RENAME TO "temporary_sales"`);
        await queryRunner.query(`CREATE TABLE "sales" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "date" datetime NOT NULL, "totalDiscount" integer NOT NULL, "totalCost" integer NOT NULL, "customerId" integer, "status" varchar NOT NULL, CONSTRAINT "FK_3a92cf6add00043cef9833db1cd" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "sales"("id", "createdAt", "updatedAt", "deletedAt", "date", "totalDiscount", "totalCost", "customerId", "status") SELECT "id", "createdAt", "updatedAt", "deletedAt", "date", "totalDiscount", "totalCost", "customerId", "status" FROM "temporary_sales"`);
        await queryRunner.query(`DROP TABLE "temporary_sales"`);
        await queryRunner.query(`ALTER TABLE "sales" RENAME TO "temporary_sales"`);
        await queryRunner.query(`CREATE TABLE "sales" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "date" datetime NOT NULL, "totalPrice" integer NOT NULL, "totalDiscount" integer NOT NULL, "totalCost" integer NOT NULL, "customerId" integer, "status" varchar NOT NULL, CONSTRAINT "FK_3a92cf6add00043cef9833db1cd" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "sales"("id", "createdAt", "updatedAt", "deletedAt", "date", "totalDiscount", "totalCost", "customerId", "status") SELECT "id", "createdAt", "updatedAt", "deletedAt", "date", "totalDiscount", "totalCost", "customerId", "status" FROM "temporary_sales"`);
        await queryRunner.query(`DROP TABLE "temporary_sales"`);
        await queryRunner.query(`ALTER TABLE "customers" RENAME TO "temporary_customers"`);
        await queryRunner.query(`CREATE TABLE "customers" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "name" varchar NOT NULL, "phone" varchar NOT NULL)`);
        await queryRunner.query(`INSERT INTO "customers"("id", "createdAt", "updatedAt", "deletedAt", "name", "phone") SELECT "id", "createdAt", "updatedAt", "deletedAt", "name", "phone" FROM "temporary_customers"`);
        await queryRunner.query(`DROP TABLE "temporary_customers"`);
    }

}
