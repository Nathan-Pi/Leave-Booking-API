import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { LeaveRequest } from "../entity/LeaveRequest";
import { In, Repository } from "typeorm";
import { ResponseHandler } from "../helper/ResponseHandler";
import { StatusCodes } from "http-status-codes";
import { User } from "../entity/User";


function calculateNumberOfDays(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}


export class LeaveController {
  private leaveRepository: Repository<LeaveRequest>;

  constructor() {
    this.leaveRepository = AppDataSource.getRepository(LeaveRequest);
  }

  public requestLeave = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate, reason } = req.body;
     
    //get userid from email  
    const email = req.signedInUser.email;
    const userRepository = AppDataSource.getRepository(User);
    const dbUser = await userRepository.findOne({ where: { email } });
      if (!startDate || !endDate) {
        
        throw new Error("Start date and end date are required.");
      }

      // Ensure startDate is before endDate
      if (new Date(startDate) >= new Date(endDate)) {
        throw new Error("Start date must be before end date.");
      }
    //   console.log("standard " + user);
    //   console.log("id " + user.id);
    //   console.log("uid " + user.uid);
    //   console.log("req " + req.signedInUser.id);
      const leaveRequest = new LeaveRequest();
      leaveRequest.startDate = new Date(startDate);
      leaveRequest.endDate = new Date(endDate);
      leaveRequest.reason = reason || "";
      leaveRequest.user = dbUser;

      const savedLeaveRequest = await this.leaveRepository.save(leaveRequest);

      ResponseHandler.sendSuccessResponse(res, savedLeaveRequest, StatusCodes.CREATED);
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(res, StatusCodes.BAD_REQUEST, error.message);
    }
  };



public approveLeave = async (req: Request, res: Response): Promise<void> => {
    try {
        const { leaveId } = req.body;
        if (!leaveId) {
            return res.status(400).json({ error: "Invalid leave request IDs" });
        }

        const leaveRequest = await this.leaveRepository.findOne({
            where: { Id: leaveId },
            relations: ["user"], // <-- add this!

        });

        if (!leaveRequest) {
            return res.status(400).json({ error: "Invalid leave request ID" });
        }

        leaveRequest.status = "approved";
        const start = new Date(leaveRequest.startDate);
        const end = new Date(leaveRequest.endDate);
        const diffDays = calculateNumberOfDays(start, end);
         if (leaveRequest.user.remainingAl < diffDays) {
            return res.status(400).json({ error: "Not enough annual leave balance." });
        }
        leaveRequest.user.remainingAl -= diffDays;

        const updatedLeaveRequest = await this.leaveRepository.save(leaveRequest);

        console.log("diffdays", diffDays)

        return res.status(200).json({
            message: `Leave request ${leaveId} has been approved`,
            data: {
                reason: "OK to approve"
            }
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

public rejectLeave = async (req: Request, res: Response): Promise<void> => {
    try {
        const { leaveID, reason } = req.body;
        if (!leaveID) {
            return res.status(400).json({ error: "Invalid leave request ID" });
        }

        const leaveRequest = await this.leaveRepository.findOne({
            where: { Id: leaveID },
                relations: ["user"], // <-- add this!

        });

        if (!leaveRequest) {
            return res.status(400).json({ error: "Invalid leave request ID" });
        }

        leaveRequest.status = "rejected";
        const updatedLeaveRequest = await this.leaveRepository.save(leaveRequest);

        return res.status(200).json({
            message: `Leave request ${leaveID} for employee_id ${leaveRequest.user} has been rejected`,
            data: {
                reason: reason || "Request Rejected"
            }
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

public getAllLeaveRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.signedInUser;
        if (!user) {
            return res.status(401).json({ error: "Not authenticated." });
        }

        let leaveRequests: LeaveRequest[] = [];

        if (user.role.id === 1) {
            // Admin: return all leave requests with user relation
            leaveRequests = await this.leaveRepository.find({ relations: ["user"] });
        } else if (user.role.id === 2) {
            // Manager: return leave requests for users managed by this manager
            // leaveRequests = await this.leaveRepository
            //     .createQueryBuilder("leave")
            //     .leftJoinAndSelect("leave.user", "user")
            //     .where("user.managerId = :managerId", { managerId: user.id })
            //     .getMany();
            leaveRequests = await this.leaveRepository.find({
        relations: ["user", "user.manager"],
        where: { user: { manager: { id: user.id } } },
      });
            console.log("leave req", leaveRequests)
        } else {
            return res.status(403).json({ error: "Access Denied." });
        }

        return res.status(200).json({ data: leaveRequests });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
}