import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { Role } from "../entity/Role";
import { Repository } from "typeorm";
import { ResponseHandler } from "../helper/ResponseHandler";
import { StatusCodes } from "http-status-codes";
import { validate } from "class-validator";
import { instanceToPlain } from "class-transformer";

export class UserController {
  public static readonly ERROR_NO_USER_ID_PROVIDED = "No ID provided";
  public static readonly ERROR_INVALID_USER_ID_FORMAT = "Invalid ID format";
  public static readonly ERROR_USER_NOT_FOUND = "User not found";
  public static readonly ERROR_USER_NOT_FOUND_WITH_ID = (id: number) =>
    `User not found with ID: ${id}`;
  public static readonly ERROR_PASSWORD_IS_BLANK = "Password is blank";
  public static readonly ERROR_FAILED_TO_RETRIEVE_USERS =
    "Failed to retrieve users";
  public static readonly ERROR_FAILED_TO_RETRIEVE_USER =
    "Failed to retrieve user";
  public static readonly ERROR_USER_NOT_FOUND_FOR_DELETION =
    "User with the provided ID not found";
  public static readonly ERROR_EMAIL_REQUIRED = "Email is required";
  public static readonly ERROR_EMAIL_NOT_FOUND = (email: string) =>
    `${email} not found`;
  public static readonly ERROR_RETRIEVING_USER = (error: string) =>
    `Error retrieving user: ${error}`;
  public static readonly ERROR_UNABLE_TO_FIND_USER_EMAIL = (email: string) =>
    `Unable to find user with the email: ${email}`;
  public static readonly ERROR_VALIDATION_FAILED = "Validation failed";

  private userRepository: Repository<User>;
  private roleRepository: Repository<Role>; // Added roleRepository

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.roleRepository = AppDataSource.getRepository(Role); // Initialize roleRepository
  }

  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.userRepository.find({
        relations: ["role", "manager"], // Include role and manager in response
      });

      if (users.length === 0) {
        ResponseHandler.sendErrorResponse(res, StatusCodes.NO_CONTENT);
        return;
      }

      ResponseHandler.sendSuccessResponse(res, users);
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        `${UserController.ERROR_FAILED_TO_RETRIEVE_USERS}: ${error.message}`
      );
    }
  };

  public getByEmail = async (req: Request, res: Response): Promise<void> => {
    const email = req.params.emailAddress;

    if (!email || email.trim().length === 0) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        UserController.ERROR_EMAIL_REQUIRED
      );
      return;
    }

    try {
      const user = await this.userRepository.findOne({
        where: { email: email },
        relations: ["role", "manager"], // Include manager in response
      });
      if (!user) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          `${email} not found`
        );
        return;
      }

      ResponseHandler.sendSuccessResponse(res, user);
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        UserController.ERROR_UNABLE_TO_FIND_USER_EMAIL(email)
      );
    }
  };

  public getById = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        UserController.ERROR_INVALID_USER_ID_FORMAT
      );
      return;
    }

    try {
      const user = await this.userRepository.findOne({
        where: { id: id },
        relations: ["role", "manager"], // Include manager in response
      });
      if (!user) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.NO_CONTENT,
          UserController.ERROR_USER_NOT_FOUND_WITH_ID(id)
        );
        return;
      }

      ResponseHandler.sendSuccessResponse(res, user);
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        UserController.ERROR_RETRIEVING_USER(error.message)
      );
    }
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      let user = new User();
      user.firstname = req.body.firstname;
      user.surname = req.body.surname;

      // Will be salted and hashed in the entity
      user.password = req.body.password;
      user.email = req.body.email;

      // Fetch and assign the role
      const role = await this.roleRepository.findOneBy({ id: req.body.roleId });
      if (!role) throw new Error("Invalid role ID.");
      user.role = role;

      // Fetch and assign the manager if provided
      if (req.body.managerId !== undefined) {
        const manager = await this.userRepository.findOneBy({ id: req.body.managerId });
        if (!manager) throw new Error("Invalid manager ID.");
        user.manager = manager; // Assign the manager User object
      }

      const errors = await validate(user);
      if (errors.length > 0) {
        throw new Error(
          errors.map((err) => Object.values(err.constraints || {})).join(", ")
        );
      }

      user = await this.userRepository.save(user);

      ResponseHandler.sendSuccessResponse(
        res,
        instanceToPlain(user),
        StatusCodes.CREATED
      );
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        error.message
      );
    }
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    const id = req.body.id;

    try {
      if (!id) {
        throw new Error(UserController.ERROR_NO_USER_ID_PROVIDED);
      }

      let user = await this.userRepository.findOne({
        where: { id },
        relations: ["role", "manager"], // Include manager in response
      });

      if (!user) {
        throw new Error(UserController.ERROR_USER_NOT_FOUND);
      }

      // Update specific fields
      if (req.body.email !== undefined) {
        user.email = req.body.email;
      }

      if (req.body.roleId !== undefined) {
        const role = await this.roleRepository.findOneBy({ id: req.body.roleId });
        if (!role) throw new Error("Invalid role ID.");
        user.role = role;
      }

      if (req.body.managerId !== undefined) {
        const manager = await this.userRepository.findOneBy({ id: req.body.managerId });
        if (!manager) throw new Error("Invalid manager ID.");
        user.manager = manager;
      }

      if (req.body.firstname !== undefined) {
        user.firstname = req.body.firstname;
      }

      if (req.body.surname !== undefined) {
        user.surname = req.body.surname;
      }

      const errors = await validate(user, { skipMissingProperties: true });
      if (errors.length > 0) {
        throw new Error(
          errors.map((e) => Object.values(e.constraints || {})).flat().join(", ")
        );
      }

      user = await this.userRepository.save(user);

      ResponseHandler.sendSuccessResponse(res, user, StatusCodes.OK);
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        error.message
      );
    }
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;

    try {
      if (!id) {
        throw new Error("No ID provided");
      }

      const result = await this.userRepository.delete(id);

      if (result.affected === 0) {
        throw new Error("User with the provided ID not found");
      }

      ResponseHandler.sendSuccessResponse(res, "User deleted", StatusCodes.OK);
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        error.message
      );
    }
  };
}