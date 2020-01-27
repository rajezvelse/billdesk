import { Entity, Column } from "typeorm";
import { BaseEntity } from './base-entity';

@Entity('roles')
export class Role extends BaseEntity {

    @Column({
        unique: true
    })
    name: string;

    @Column({
        nullable: true
    })
    description: string;

    @Column({
        type: 'simple-array'
    })
    permissions: string[];

    @Column({
        default: true
    })
    deletable: boolean;

    @Column({
        default: false
    })
    deleted: boolean;
}