import { Entity, Column, ManyToOne, JoinColumn  } from "typeorm";
import { BaseEntity } from './base-entity';
import { Product } from './products';
import { Purchase } from './purchase';

@Entity('purchase_particulars')
export class PurchaseParticulars extends BaseEntity {

  @ManyToOne(type => Purchase)
  @JoinColumn({ referencedColumnName: "id" })
  purchaseRecord: Purchase;

  @ManyToOne(type => Product)
  @JoinColumn({ referencedColumnName: "id" })
  product: Product;

  @Column()
  price: number;

  @Column()
  quantity: number;

  @Column()
  cost: number;

  @Column()
  discount: number;

  @Column()
  discountedCost: number;

}
