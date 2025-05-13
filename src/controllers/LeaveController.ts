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
    console.log("Signed-in user:", req.signedInUser);
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
}