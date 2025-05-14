import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { LeaveRequest } from "../entity/LeaveRequest";
import { Repository } from "typeorm";
import { ResponseHandler } from "../helper/ResponseHandler";
import { StatusCodes } from "http-status-codes";

export class LeaveController {
  private leaveRepository: Repository<LeaveRequest>;

  constructor() {
    this.leaveRepository = AppDataSource.getRepository(LeaveRequest);
  }

  public requestLeave = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate, reason } = req.body;
      const user = req.signedInUser; // Authentication middleware adds this
      const uid = req.signedInUser.role.id
    console.log("Signed-in user:", user);
    console.log("Signed-in user id:", uid);

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
      leaveRequest.user = uid;

      const savedLeaveRequest = await this.leaveRepository.save(leaveRequest);

      ResponseHandler.sendSuccessResponse(res, savedLeaveRequest, StatusCodes.CREATED);
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(res, StatusCodes.BAD_REQUEST, error.message);
    }
  };
public approveLeave = async (req: Request, res: Response): Promise<void> => {
    try {
        const { leaveID } = req.body;
        if (!leaveID) {
            return res.status(400).json({ error: "Invalid leave request ID" });
        }

        const leaveRequest = await this.leaveRepository.findOne({
            where: { id: leaveID },
        });

        if (!leaveRequest) {
            return res.status(400).json({ error: "Invalid leave request ID" });
        }

        leaveRequest.status = "approved";
        const updatedLeaveRequest = await this.leaveRepository.save(leaveRequest);

        return res.status(200).json({
            message: `Leave request ${leaveID} has been approved`,
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
            where: { id: leaveID },
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

        if (user.role.id === 1) {
            // Admin: return all leave requests
            const leaveRequests = await this.leaveRepository.find();
            return res.status(200).json({ data: leaveRequests });
        } else if (user.role.id === 2) {
            // Manager: return leave requests for users managed by this manager
            // Assuming LeaveRequest has a relation to User, and User has managerID
            const leaveRequests = await this.leaveRepository
                .createQueryBuilder("leave")
                .leftJoinAndSelect("leave.user", "user")
                .where("user.managerId = :managerId", { managerId: user.id })
                .getMany();

            return res.status(200).json({ data: leaveRequests });
        } else {
            return res.status(403).json({ error: "Access Denied." });
        }
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
}