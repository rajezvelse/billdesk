import {MigrationInterface, QueryRunner} from "typeorm";

export class expense1607170817205 implements MigrationInterface {
    name = 'expense1607170817205'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "expenses" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "date" datetime NOT NULL, "description" varchar NOT NULL, "amount" integer NOT NULL, "categoryId" integer)`);
        
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" RENAME TO "temporary_expenses"`);
        await queryRunner.query(`CREATE TABLE "expenses" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "date" datetime NOT NULL, "description" varchar NOT NULL, "amount" integer NOT NULL, "categoryId" integer)`);
        await queryRunner.query(`INSERT INTO "expenses"("id", "createdAt", "updatedAt", "deletedAt", "date", "description", "amount", "categoryId") SELECT "id", "createdAt", "updatedAt", "deletedAt", "date", "description", "amount", "categoryId" FROM "temporary_expenses"`);
        await queryRunner.query(`DROP TABLE "temporary_expenses"`);
        await queryRunner.query(`DROP TABLE "expenses"`);
    }

}
