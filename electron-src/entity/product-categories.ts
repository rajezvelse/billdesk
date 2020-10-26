import { Entity, Column } from "typeorm";
import { BaseEntity } from './base-entity';

@Entity('product_category')
export class ProductCategory extends BaseEntity {

  @Column()
  category: string;

}
