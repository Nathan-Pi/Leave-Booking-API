import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

@Entity({ name: "leave_requests" })
export class LeaveRequest {
  @PrimaryGeneratedColumn()
  leaveId: number;

  @ManyToOne(() => User, { nullable: false })
  user: User;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column({ type: "text", nullable: true })
  reason: string;

  @Column({ default: "Pending" })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}