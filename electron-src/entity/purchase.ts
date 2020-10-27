import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from './base-entity';
import { Vendor } from './vendor';

@Entity('purchase')
export class Purchase extends BaseEntity {

  @Column({
    nullable: true
  })
  purchaseNumber: string;

  @Column()
  date: Date;

  @ManyToOne(type => Vendor)
  @JoinColumn({ referencedColumnName: "id" })
  vendor: Vendor;

  @Column()
  totalCost: number;

  @Column()
  totalDiscount: number;

  @Column()
  totalDiscountedCost: number;

  @Column()
  paymentPaid: number;

  @Column()
  balanceAmount: number;

  @Column()
  status: 'DRAFT' | 'SUBMITTED';

}
