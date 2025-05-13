import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { validateUserCreation, validateUserUpdate } from "../middleware/ValidationMiddleware";
import { authenticateUser } from "../middleware/AuthenticationMiddleware";
import { authorizeRole } from "../middleware/AuthorizationMiddleware";

export class UserRouter {
  private router: Router;
  private userController: UserController;

  constructor(router: Router, userController: UserController) {
    this.router = router;
    this.userController = userController;
    this.addRoutes(); // Initialize routes
  }

  public getRouter(): Router {
    return this.router;
  }

  private addRoutes() {
    // Apply authentication middleware to all routes
    this.router.use(authenticateUser);

    // GET all users (Admin or Manager only)
    this.router.get("/", authorizeRole(["Admin", "Manager"]), this.userController.getAll);

    // GET user by email (Admin or Manager only)
    this.router.get("/email/:emailAddress", authorizeRole(["Admin", "Manager"]), this.userController.getByEmail);

    // GET user by ID (Admin or Manager only)
    this.router.get("/:id", authorizeRole(["Admin", "Manager"]), this.userController.getById);

    // POST create a new user (Admin only)
    this.router.post("/", authorizeRole(["Admin"]), validateUserCreation, this.userController.create);

    // DELETE a user by ID (Admin only)
    this.router.delete("/:id", authorizeRole(["Admin"]), this.userController.delete);

    // PATCH update a user (Admin only)
    this.router.patch("/:id", authorizeRole(["Admin"]), validateUserUpdate, this.userController.update);
  }
}