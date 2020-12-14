import {MigrationInterface, QueryRunner} from "typeorm";

export class salespaymentDate1602841552124 implements MigrationInterface {
    name = 'salespaymentDate1602841552124'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sales_payments" ADD "date" datetime NOT NULL DEFAULT NOW`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
