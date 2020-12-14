import {MigrationInterface, QueryRunner} from "typeorm";

export class scraps1607691682225 implements MigrationInterface {
    name = 'scraps1607691682225'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "scraps" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "date" datetime NOT NULL, "quantity" integer NOT NULL, "purchaseCostPortions" text, "loss" integer NOT NULL, "productId" integer)`);
        
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      
    }

}
