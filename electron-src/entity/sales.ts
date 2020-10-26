import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from './base-entity';
import { Customer } from './customers';

@Entity('sales')
export class Sales extends BaseEntity {

  @Column({
    nullable: true
  })
  saleNumber: string;

  @Column()
  date: Date;

  @ManyToOne(type => Customer)
  @JoinColumn({ referencedColumnName: "id" })
  customer: Customer;

  @Column()
  totalCost: number;

  @Column()
  totalDiscount: number;

  @Column()
  totalDiscountedCost: number;

  @Column()
  paymentReceived: number;

  @Column()
  outstandingAmount: number;

  @Column()
  status: 'DRAFT' | 'SUBMITTED';

}
