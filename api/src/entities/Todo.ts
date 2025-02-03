import { BaseEntity, Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

@Entity()
export class Todo extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: string;

    @Column("text", {nullable : true})
    text: string;

    @Column("boolean", {default: false})
    completed : boolean;

    @Column()
    creatorId : number

    @ManyToOne(() => User, u => u.todos)
    @JoinColumn({name : 'creatorId'})
    creator : Promise<User>
}