import { Router } from "express";
import { RoleController } from "../controllers/RoleController";

export class RoleRouter {
  private router: Router;
  private roleController: RoleController;

  constructor(router: Router, roleController: RoleController) {
    this.router = router;
    this.roleController = roleController;
    this.addRoutes();
  }
  public getRouter(): Router {
    return this.router;
  }
  private addRoutes() {
    // Get
    this.router.get("/", this.roleController.getAll);
    this.router.get("/:id", this.roleController.getById);

    // Post
    this.router.post("/", this.roleController.create);

    // Delete
    this.router.delete("/:id", this.roleController.delete);

    // Patch
    this.router.patch("/", this.roleController.update);
  }
}
