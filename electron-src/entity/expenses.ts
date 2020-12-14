import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from './base-entity';
import { ExpenseCategory } from './expense-categories';
import { encrypt } from '../utils';

@Entity('expenses')
export class Expense extends BaseEntity {
  @Column()
  date: Date;

  @ManyToOne(type => ExpenseCategory, { nullable: true })
  @JoinColumn({ referencedColumnName: "id" })
  category: ExpenseCategory;

  @Column()
  description: string;

  @Column()
  amount: number;

}
