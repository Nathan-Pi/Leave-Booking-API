import { Router } from "express"; // Correctly import Router
import { UserController } from "../controllers/UserController";

export class UserRouter {
  constructor(
    private router: Router,
    private userController: UserController
  ) {
    this.router = router;
    this.addRoutes();
  }

  public getRouter(): Router {
    return this.router;
  }

  private addRoutes() {
    // Get
    this.router.get("/", this.userController.getAll);
    this.router.get("/email/:emailAddress", this.userController.getByEmail);
    this.router.get("/:id", this.userController.getById);

    // Post
    this.router.post("/", this.userController.create);
    
    // Delete
    this.router.delete("/:id", this.userController.delete);

    // Patch
    this.router.patch("/:id", this.userController.updateRole);
  }
}