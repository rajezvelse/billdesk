import { Entity, Column, ManyToOne, JoinColumn  } from "typeorm";
import { BaseEntity } from './base-entity';
import { Product } from './products';
import { Sales } from './sales';

@Entity('sales_particulars')
export class SalesParticulars extends BaseEntity {

  @ManyToOne(type => Sales)
  @JoinColumn({ referencedColumnName: "id" })
  salesRecord: Sales;

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

  @Column({
    nullable: true,
    type: 'text'
  })
  purchaseCostPortions: string | null;

  @Column()
  profit: number;

}
