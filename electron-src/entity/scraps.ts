import { Entity, Column, ManyToOne, JoinColumn  } from "typeorm";
import { BaseEntity } from './base-entity';
import { Product } from './products';

@Entity('scraps')
export class Scraps extends BaseEntity {

  @Column()
  date: Date;
  
  @ManyToOne(type => Product)
  @JoinColumn({ referencedColumnName: "id" })
  product: Product;

  @Column()
  quantity: number;

  @Column({
    nullable: true,
    type: 'text'
  })
  purchaseCostPortions: string;

  @Column()
  loss: number;

}
