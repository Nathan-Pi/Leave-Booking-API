import { Router } from "express";
import { LeaveController } from "../controllers/LeaveController";

export class LeaveRouter {
  private router: Router;
  private leaveController: LeaveController;

  constructor() {
    this.router = Router();
    this.leaveController = new LeaveController();
    this.addRoutes();
  }

  private addRoutes() {
      this.router.get("/all", this.leaveController.getAllLeaveRequests);
    this.router.post("/", this.leaveController.requestLeave);
    this.router.patch("/approve/:id", this.leaveController.approveLeave);
    this.router.patch("/reject/:id", this.leaveController.rejectLeave);
    this.router.patch("/amend/:id", this.leaveController.amendLeave);
    this.router.get("/getUserOutstanding/:id", this.leaveController.outstandingLeavebyStaffID);
    this.router.get("/getManagedOutstanding/:id", this.leaveController.outstandingLeavebyManager);
    this.router.get("/getAllOutstanding", this.leaveController.outstandingLeave);
    this.router.get("/own", this.leaveController.getOwnLeave);
    this.router.delete("/:id", this.leaveController.cancelLeave);
}

  public getRouter(): Router {
    return this.router;
  }
}