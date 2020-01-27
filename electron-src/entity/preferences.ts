import { Entity, Column } from "typeorm";
import { BaseEntity } from './base-entity';

@Entity('preferences')
export class Preferences extends BaseEntity {
    @Column()
    name: string;

    @Column()
    value: string;
}