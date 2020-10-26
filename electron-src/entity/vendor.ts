import { Entity, Column } from "typeorm";
import { BaseEntity } from './base-entity';

@Entity('vendors')
export class Vendor extends BaseEntity {

  @Column()
  name: string;

  @Column({
    nullable: true
  })
  mobile: string;

  @Column({
    nullable: true
  })
  email: string;

  @Column({
    nullable: true
  })
  gstin: string;

  @Column({
    nullable: true
  })
  address: string;

}
