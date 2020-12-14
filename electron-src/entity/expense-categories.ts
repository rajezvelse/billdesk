import { Entity, Column } from "typeorm";
import { BaseEntity } from './base-entity';

@Entity('expense_category')
export class ExpenseCategory extends BaseEntity {

  @Column()
  category: string;

}
