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
    
  // Existing route for requesting leave
  this.router.post("/", this.leaveController.requestLeave);

  // Route for approving or rejecting leave requests
  this.router.patch("/status", this.leaveController.updateLeaveRequestStatus);

  // Route for viewing outstanding leave requests
  this.router.get("/outstanding", this.leaveController.getOutstandingRequests);

  // Route for viewing remaining leave for a staff member
  this.router.get("/remaining/:staffId", this.leaveController.getRemainingLeave);
}
  public getRouter(): Router {
    return this.router;
  }
}