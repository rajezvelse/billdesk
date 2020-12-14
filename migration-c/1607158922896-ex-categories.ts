import {MigrationInterface, QueryRunner} from "typeorm";

export class exCategories1607158922896 implements MigrationInterface {
    name = 'exCategories1607158922896'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "expense_category" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "category" varchar NOT NULL)`);
       
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        
    }

}
