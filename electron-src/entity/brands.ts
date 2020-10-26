import { Entity, Column } from "typeorm";
import { BaseEntity } from './base-entity';

@Entity('brand')
export class Brand extends BaseEntity {

  @Column()
  name: string;

}
