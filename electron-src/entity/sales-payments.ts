import { Entity, Column, ManyToOne, JoinColumn  } from "typeorm";
import { BaseEntity } from './base-entity';
import { Sales } from './sales';

@Entity('sales_payments')
export class SalesPayment extends BaseEntity {

  @ManyToOne(type => Sales)
  @JoinColumn({ referencedColumnName: "id" })
  salesRecord: Sales;

  @Column()
  date: Date;
  
  @Column()
  mode: 'CASH' | 'GPAY' | 'NETBANKING';

  @Column()
  amount: number;

}
