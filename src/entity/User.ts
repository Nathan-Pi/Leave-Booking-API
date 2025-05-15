import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  BeforeInsert,
} from "typeorm";
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";
import { Role } from "./Role";
import { Exclude } from "class-transformer";
import { PasswordHandler } from "../helper/PasswordHandler";

@Entity({ name: "user" })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsString()
  firstname: string;

  @Column()
  @IsString()
  surname: string;

  @Column({ select: false }) //obscure from get queries
  @Exclude()
  @IsString()
  @MinLength(10, { message: "Password must be at least 10 characters long" })
  password: string;

  @Column({ select: false })
  @Exclude() // after post queries
  salt: string;

  @Column({ unique: true })
  @IsEmail({}, { message: "Must be a valid email address" })
  email: string;

  @ManyToOne(() => Role, { nullable: false, eager: true })
  @IsNotEmpty({ message: "Role is required" })
  role: Role;

  @ManyToOne(() => User, { nullable: true})
  manager: User;

  @Column({ default: 25 })
  @IsOptional()
  @IsInt({ message: "initialAlTotal must be an integer number" })
  @Min(0, { message: "initialAlTotal must not be less than 0" })
  initialAlTotal: number;

  @Column({ default: 0 })
  @IsOptional()
  @IsInt({ message: "remainingAl must be an integer number" })
  @Min(0, { message: "remainingAl must not be less than 0" })
  remainingAl: number;
  user: any;

  @BeforeInsert()
  hashPassword() {
    if (!this.password) {
      throw new Error("Password must be provided before inserting a user.");
    }
    const { hashedPassword, salt } = PasswordHandler.hashPassword(
      this.password
    );
    this.password = hashedPassword;
    this.salt = salt;
  }

  @BeforeInsert()
  setDefaultAlTotal() {
    if (this.remainingAl === undefined || this.remainingAl === null) {
      this.remainingAl = this.initialAlTotal ?? 25; // fallback just in case
    }
  }
}