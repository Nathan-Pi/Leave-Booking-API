import { Router } from "express"; // Correctly import Router
import { LeaveController } from "../controllers/LeaveController";

export class LeaveRouter {
  constructor(
    private router: Router,
    private leaveController: LeaveController
  ) {
    this.router = router;
    this.addRoutes();
  }
    public getRouter(): Router {
    return this.router;
  }

  private addRoutes() {
    // Get
    this.router.post("/", this.leaveController.requestLeave);
    this.router.patch("/approve", this.leaveController.approveLeave);
    this.router.patch("/reject", this.leaveController.rejectLeave);
    this.router.get("/all", this.leaveController.getAllLeaveRequests);
    // this.router.get("/email/", this.leaveController.getByEmail);
    // this.router.get("/:id", this.userController.getById);

    // Post
    // this.router.post("/", this.userController.create);
    
    // Delete
    // this.router.delete("/:id", this.userController.delete);

    // Patch
    // this.router.patch("/", this.userController.update);
  }
}

