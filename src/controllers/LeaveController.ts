import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { LeaveRequest } from "../entity/LeaveRequest";
import { User } from "../entity/User";
import { Repository } from "typeorm";
import { ResponseHandler } from "../helper/ResponseHandler";
import { StatusCodes } from "http-status-codes";

export class LeaveController {
  private leaveRepository: Repository<LeaveRequest>;
  private userRepository: Repository<User>;

  constructor() {
    this.leaveRepository = AppDataSource.getRepository(LeaveRequest);
    this.userRepository = AppDataSource.getRepository(User);
  }

  public requestLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, reason } = req.body;
    const user = req.signedInUser; // Authentication middleware adds this

    if (!startDate || !endDate) {
      throw new Error("Start date and end date are required.");
    }

    // Ensure startDate is before endDate
    if (new Date(startDate) >= new Date(endDate)) {
      throw new Error("Start date must be before end date.");
    }

    // Fetch the user from the database
    const dbUser = await this.userRepository.findOneBy({ id: user.id });
    if (!dbUser) {
      throw new Error("User not found. Ensure the signed-in user exists in the database.");
    }

    const leaveRequest = new LeaveRequest();
    leaveRequest.startDate = new Date(startDate);
    leaveRequest.endDate = new Date(endDate);
    leaveRequest.reason = reason || "";
    leaveRequest.user = dbUser; // Assign the user entity

    const savedLeaveRequest = await this.leaveRepository.save(leaveRequest);

    ResponseHandler.sendSuccessResponse(res, savedLeaveRequest, StatusCodes.CREATED);
  } catch (error: any) {
    ResponseHandler.sendErrorResponse(res, StatusCodes.BAD_REQUEST, error.message);
  }
};

  // New function: View outstanding leave requests
  public getOutstandingRequests = async (req: Request, res: Response): Promise<void> => {
    
  try {
    const managerId = req.signedInUser.id; // Authentication middleware should populate this
    const { startDate, endDate } = req.query;

    const query = this.leaveRepository
      .createQueryBuilder("leaveRequest")
      .leftJoinAndSelect("leaveRequest.user", "user")
      .where("user.managerId = :managerId", { managerId })
      .andWhere("leaveRequest.status = :status", { status: "pending" });

    if (startDate) query.andWhere("leaveRequest.startDate >= :startDate", { startDate });
    if (endDate) query.andWhere("leaveRequest.endDate <= :endDate", { endDate });

    const leaveRequests = await query.getMany();

    ResponseHandler.sendSuccessResponse(res, leaveRequests);
  } catch (error: any) {
    ResponseHandler.sendErrorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

  // Existing function: Approve or reject a leave request
  public updateLeaveRequestStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { requestId, status } = req.body;

      // Validate the status
      if (!["Approved", "Rejected"].includes(status)) {
        throw new Error("Invalid status. Status must be 'Approved' or 'Rejected'.");
      }

      // Find the leave request by ID
      const leaveRequest = await this.leaveRepository.findOneBy({ id: requestId });
      if (!leaveRequest) {
        throw new Error("Leave request not found.");
      }

      // Update the status
      leaveRequest.status = status;
      const updatedLeaveRequest = await this.leaveRepository.save(leaveRequest);

      ResponseHandler.sendSuccessResponse(res, updatedLeaveRequest, StatusCodes.OK);
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(res, StatusCodes.BAD_REQUEST, error.message);
    }
  };

  // New function: View remaining leave for a staff member
  public getRemainingLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const staffId = parseInt(req.params.staffId);

    if (isNaN(staffId)) {
      throw new Error("Invalid staff ID format.");
    }

    const staff = await this.userRepository.findOne({
      where: { id: staffId },
    });

    if (!staff) {
      throw new Error("Staff member not found.");
    }
    ResponseHandler.sendSuccessResponse(res, {
      staffId: staff.id,
      firstname: staff.firstname,
      surname: staff.surname,
      remainingAl: staff.remainingAl,
    });
  } catch (error: any) {
    ResponseHandler.sendErrorResponse(res, StatusCodes.BAD_REQUEST, error.message);
  }
};
}