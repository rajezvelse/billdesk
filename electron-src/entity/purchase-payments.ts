import { Entity, Column, ManyToOne, JoinColumn  } from "typeorm";
import { BaseEntity } from './base-entity';
import { Purchase } from './purchase';

@Entity('purchase_payments')
export class PurchasePayment extends BaseEntity {

  @ManyToOne(type => Purchase)
  @JoinColumn({ referencedColumnName: "id" })
  purchaseRecord: Purchase;

  @Column()
  date: Date;
  
  @Column()
  mode: 'CASH' | 'GPAY' | 'NETBANKING';

  @Column()
  amount: number;

}
