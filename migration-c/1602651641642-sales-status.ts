import {MigrationInterface, QueryRunner} from "typeorm";

export class salesStatus1602651641642 implements MigrationInterface {
    name = 'salesStatus1602651641642'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_sales" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "date" datetime NOT NULL, "totalPrice" integer NOT NULL, "totalDiscount" integer NOT NULL, "totalCost" integer NOT NULL, "customerId" integer, "status" varchar NOT NULL, CONSTRAINT "FK_3a92cf6add00043cef9833db1cd" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_sales"("id", "createdAt", "updatedAt", "deletedAt", "date", "totalPrice", "totalDiscount", "totalCost", "customerId") SELECT "id", "createdAt", "updatedAt", "deletedAt", "date", "totalPrice", "totalDiscount", "totalCost", "customerId" FROM "sales"`);
        await queryRunner.query(`DROP TABLE "sales"`);
        await queryRunner.query(`ALTER TABLE "temporary_sales" RENAME TO "sales"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sales" RENAME TO "temporary_sales"`);
        await queryRunner.query(`CREATE TABLE "sales" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "date" datetime NOT NULL, "totalPrice" integer NOT NULL, "totalDiscount" integer NOT NULL, "totalCost" integer NOT NULL, "customerId" integer, CONSTRAINT "FK_3a92cf6add00043cef9833db1cd" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "sales"("id", "createdAt", "updatedAt", "deletedAt", "date", "totalPrice", "totalDiscount", "totalCost", "customerId") SELECT "id", "createdAt", "updatedAt", "deletedAt", "date", "totalPrice", "totalDiscount", "totalCost", "customerId" FROM "temporary_sales"`);
        await queryRunner.query(`DROP TABLE "temporary_sales"`);
    }

}
