import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from './base-entity';
import { Role } from './role';
import { encrypt } from '../utils';

@Entity('users')
export class User extends BaseEntity {

    @Column({
        unique: true
    })
    username: string;

    @Column()
    password: string;

    @ManyToOne(type => Role)
    @JoinColumn({ referencedColumnName: "id" })
    role: Role;

    @Column()
    firstName: string;

    @Column({
        nullable: true
    })
    lastName: string;

    @Column()
    email: string;

    @Column({
        nullable: true
    })
    phone: string;

    @Column({
        default: 1
    })
    avatar: number;

    @Column({
        default: false
    })
    deleted: boolean;

    setRawPassword(password: string) {
        this.password = encrypt(password);
    }
}
