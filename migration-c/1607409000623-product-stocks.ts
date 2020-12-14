import {MigrationInterface, QueryRunner} from "typeorm";

export class productStocks1607409000623 implements MigrationInterface {
    name = 'productStocks1607409000623'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product_stocks" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "price" integer NOT NULL, "quantityAvailable" integer NOT NULL, "productId" integer)`);
  
        await queryRunner.query(`ALTER TABLE "sales_particulars" ADD COLUMN "purchaseCostPortions" text`);
        await queryRunner.query(`ALTER TABLE "sales_particulars" ADD COLUMN "profit" integer NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
       
    }

}
