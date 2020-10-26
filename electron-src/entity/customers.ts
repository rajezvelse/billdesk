import { Entity, Column } from "typeorm";
import { BaseEntity } from './base-entity';

@Entity('customers')
export class Customer extends BaseEntity {

  @Column()
  name: string;

  @Column({
    nullable: true
  })
  phone: string;

}
