import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from './base-entity';
import { ProductCategory } from './product-categories';
import { Brand } from './brands';
import { encrypt } from '../utils';

@Entity('products')
export class Product extends BaseEntity {

  @ManyToOne(type => Brand)
  @JoinColumn({ referencedColumnName: "id" })
  brand: Brand;

  @ManyToOne(type => ProductCategory, { nullable: true })
  @JoinColumn({ referencedColumnName: "id" })
  category: ProductCategory;

  @Column()
  name: string;

  @Column()
  price: number;

}
