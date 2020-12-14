import {MigrationInterface, QueryRunner} from "typeorm";

export class salePaymentReceived1603381455041 implements MigrationInterface {
    name = 'salePaymentReceived1603381455041'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sales" ADD "paymentReceived" integer NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
