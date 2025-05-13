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
    this.router.post("/", this.leaveController.requestLeave);
  }

  public getRouter(): Router {
    return this.router;
  }
}