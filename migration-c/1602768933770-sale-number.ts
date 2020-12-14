import {MigrationInterface, QueryRunner} from "typeorm";

export class saleNumber1602768933770 implements MigrationInterface {
    name = 'saleNumber1602768933770'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sales" ADD COLUMN "saleNumber" varchar`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
