import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column("text", { nullable: true })
  name!: string;

  @Column("text", { unique: true })
  githubId!: string;
}
