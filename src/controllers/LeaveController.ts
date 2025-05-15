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
    const email = req.signedInUser.email;
    const userRepository = AppDataSource.getRepository(User);
    const dbUser = await userRepository.findOne({ where: { email } });
    console.log("email " + email);
    console.log("userRepository " + userRepository);
    console.log("dbUser " + dbUser.id);
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
        console.log("role id", req.signedInUser.role.id)
        const email = req.signedInUser.email;
        const userRepository = AppDataSource.getRepository(User);
        const dbUser = await userRepository.findOne({ where: { email } });
        if (req.signedInUser.role.id !== 1 && req.signedInUser.role.id !== 2) {
            return res.status(403).json({ error: "You are not authorized to approve leave requests." });}

            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: "Invalid leave request ID" });
            }
            
            const leaveRequest = await this.leaveRepository.findOne({
                where: { leaveId: id },
                relations: ["user"]
                
            });
            
            if (!leaveRequest) {
                return res.status(400).json({ error: "Invalid leave request " });
            }
           //get an array of all the users under the manager currently signed in
            const users = await AppDataSource.getRepository(User).find({
                where: { manager: { id: dbUser.id } },
            });
            console.log("users", users)
            //check to see if the leave request owner is in the array of users
            const isUserUnderManager = users.some(user => user.id === leaveRequest.user.id);
            //if the leave request owner is not in the array of users or if the signed in user is not an admin
            if (!isUserUnderManager && req.signedInUser.role.id !== 1) {
                return res.status(403).json({ error: "You are not authorized to approve this leave request." });
            }

            
                console.log("here", leaveRequest)
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
            message: `Leave request ${id} has been approved`,
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
        // console.log("role id", !req.signedInUser.role.id)
        // console.log("role id is 1?", req.signedInUser.role.id == 1)
        // console.log("role id is 2?", req.signedInUser.role.id ==2)
        if (req.signedInUser.role.id !== 1 && req.signedInUser.role.id !== 2) {
            return res.status(403).json({ error: "You are not authorized to reject leave requests." });}

            
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Invalid leave request ID" });
        }

        const leaveRequest = await this.leaveRepository.findOne({
            where: { leaveId: id },
            relations: ["user"]
            
        });

        if (!leaveRequest) {
            return res.status(400).json({ error: "Invalid leave request " });
        }
        // if(leaveRequest.user.manager.id !== req.signedInUser.id && req.signedInUser.role.id !== 1) {
        //     // if not the manager of the user or not an admin
        // return res.status(403).json({ error: "You are not authorized to reject this leave request." });} //AGAIN ,FIX

        leaveRequest.status = "rejected";
        console.log("here", leaveRequest)

       


        const updatedLeaveRequest = await this.leaveRepository.save(leaveRequest);


        return res.status(200).json({
            message: `Leave request ${id} has been rejected`,
            data: {
                reason: "rejected"
            }
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
public getAllLeaveRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const email = req.signedInUser.email;
        const userRepository = AppDataSource.getRepository(User);
        const dbUser = await userRepository.findOne({ where: { email } });

        console.log("role id", req.signedInUser.role.id
        )
        if (req.signedInUser.role.id === 1) {
                    console.log("role id is 1")

        const leaveRequests = await this.leaveRepository.find({
            relations: ["user"],
        });

        if (!leaveRequests) {
            return res.status(404).json({ error: "No leave requests found." });
        }

        return res.status(200).json({
            message: "Leave requests retrieved successfully.",
            data: leaveRequests,
        });
    } else if (req.signedInUser.role.id === 2) {
        console.log("role id is 2")
        // this one should show all leave requests for the manager's team
        const leaveRequests = await this.leaveRepository.find({
            relations: ["user"],
            where: {
                user: {
                    manager: {
                        id: dbUser.id,
                    },
                },
            },
        });
        if (!leaveRequests) {
            return res.status(404).json({ error: "No leave requests found." });
        }
        return res.status(200).json({
            message: "Leave requests retrieved successfully.",
            data: leaveRequests,
        });
    } else if (req.signedInUser.role.id === 3)  {
                console.log("role id is 3")

        // this one should show only the user's leave requests
        const leaveRequests = await this.leaveRepository.find({
            relations: ["user"],
            where: {
                user: {
                    id: dbUser.id,
                },
            },
        });

        console.log("leave requests", leaveRequests)
        console.log("user id", dbUser.id
        )
        if (!leaveRequests) {
            return res.status(404).json({ error: "No leave requests found." });
        }
        return res.status(200).json({
            message: "Leave requests retrieved successfully.",
            data: leaveRequests,
        });
    }




     } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
public cancelLeave = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Invalid leave request ID" });
        }

        const leaveRequest = await this.leaveRepository.findOne({
            where: { leaveId: id },
            relations: ["user"]
            
        });

        if (!leaveRequest) {
            return res.status(400).json({ error: "Invalid leave request " });
        }
        console.log(req.signedInUser.id)

        const email = req.signedInUser.email;
        const userRepository = AppDataSource.getRepository(User);
        const dbUser = await userRepository.findOne({ where: { email } });


        if(leaveRequest.user.id !== dbUser.id && req.signedInUser.role.id !== 1 && req.signedInUser.role.id !== leaveRequest.user.manager.id) { 
            // if not the user who made the request or admin or the manager of the request owner
            return res.status(403).json({ error: "You are not authorized to cancel this leave request." });}
        console.log("leave requestt after")

        leaveRequest.status = "cancelled";

        const updatedLeaveRequest = await this.leaveRepository.save(leaveRequest);
        return res.status(200).json({
            message: `Leave request ${id} has been cancelled`,
            data: {
                reason: "cancelled"
            }
        });




     } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
public amendLeave = async (req: Request, res: Response): Promise<void> => {
    try {
        //check if admin
        if (req.signedInUser.role.id !== 1) {
            return res.status(403).json({ error: "You are not authorized to amend leave requests." });
        }
        //change the amount of leave a user has
        const { amount } = req.body;
        const { id } = req.params;
        if (!id || !amount) {
            return res.status(400).json({ error: "Invalid leave request ID or amount" });
        }
        //get the user by the id
        const user = await AppDataSource.getRepository(User).findOne({
            where: { id },
        });
        if (!user) {
            return res.status(400).json({ error: "Invalid user" });
        }

    //amend user.remainingAl
        user.remainingAl = amount;
        const updatedUser = await AppDataSource.getRepository(User).save(user);

        return res.status(200).json({
            message: `User ${id} AL balance has been amended to ${amount} days`,
            data: {
                reason: "OK to amend"
            }
        });

     } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
public outstandingLeavebyStaffID = async (req: Request, res: Response): Promise<void> => {
    try {

        //verify if signedin user is admin
        if (req.signedInUser.role.id !== 1) {
            return res.status(403).json({ error: "You are not authorized to view outstanding leave requests." });
        }
        const { id } = req.params; 
       
        //verify id
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        //get the user by the id
        const user = await AppDataSource.getRepository(User).findOne({
            where: { id },
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid user" });
        }

        //get the leave requests by the user id
        const leaveRequests = await this.leaveRepository.find({
            where: { user: { id }, status: "Pending" },
            relations: ["user"],
        });
        if (leaveRequests.length === 0) {
            return res.status(404).json({ error: "No leave requests found." });
        }
        return res.status(200).json({
            message: "Leave requests retrieved successfully.",
            data: leaveRequests,
        });



     } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
public outstandingLeavebyManager = async (req: Request, res: Response): Promise<void> => {
    try {
        if (req.signedInUser.role.id !== 1) {
            return res.status(403).json({ error: "You are not authorized to view outstanding leave requests." });
        }
        const { id } = req.params; 
       
        //verify id
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        //get the user by the id
        const user = await AppDataSource.getRepository(User).findOne({
            where: { id },
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid user" });
        }

        //get all users under the manager
        const users = await AppDataSource.getRepository(User).find({
            where: { manager: { id } },
        });
        if (!users) {
            return res.status(404).json({ error: "No users found." });
        }
        //get the leave requests by the user id


        const leaveRequests = await this.leaveRepository.find({
            where: { user: In(users.map(user => user.id)), status: "Pending" },
            relations: ["user"],
        });

        if (leaveRequests.length === 0) {
            return res.status(404).json({ error: "No leave requests found." });
        }
        return res.status(200).json({
            message: "Leave requests retrieved successfully.",
            data: leaveRequests,
        });

        
       
     } catch (error: any) { 
        return res.status(500).json({ error: error.message });
    }
};
public outstandingLeave= async (req: Request, res: Response): Promise<void> => {
    try {
        if (req.signedInUser.role.id !== 1) {
            return res.status(403).json({ error: "You are not authorized to view outstanding leave requests." });
        }

        //find leave requests with status pending
        const leaveRequests = await this.leaveRepository.find({
            where: { status: "Pending" },
            relations: ["user"],
        });
        if (leaveRequests.length === 0) {
            return res.status(404).json({ error: "No pending leave requests found." });
        }
        return res.status(200).json({
            message: "Leave requests retrieved successfully.",
            data: leaveRequests,
        });

     } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
public getOwnLeave= async (req: Request, res: Response): Promise<void> => {
    try {
        const email = req.signedInUser.email;
        const userRepository = AppDataSource.getRepository(User);
        const dbUser = await userRepository.findOne({ where: { email } });

        // this one should show only the user's leave requests
        const leaveRequests = await this.leaveRepository.find({
            relations: ["user"],
            where: {
                user: {
                    id: dbUser.id,
                },
            },
        });

        if (!leaveRequests) {
            return res.status(404).json({ error: "No leave requests found." });
        }
        return res.status(200).json({
            message: "Leave requests retrieved successfully.",
            data: leaveRequests,
        });

     } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};





}