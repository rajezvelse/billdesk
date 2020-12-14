import { Entity, Column, ManyToOne, JoinColumn  } from "typeorm";
import { BaseEntity } from './base-entity';
import { Product } from './products';

@Entity('product_stocks')
export class ProductStocks extends BaseEntity {

  @ManyToOne(type => Product)
  @JoinColumn({ referencedColumnName: "id" })
  product: Product;

  @Column()
  price: number;

  @Column()
  quantityAvailable: number;

}
