import { Entity, Column } from "typeorm";
import { BaseEntity } from './base-entity';

@Entity('branches')
export class Branch extends BaseEntity {

  @Column()
  name: string;

  @Column({
    nullable: true
  })
  phone: string;

  @Column({
    nullable: true
  })
  address: string;

}
