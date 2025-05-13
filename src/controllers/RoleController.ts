import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Role } from "../entity/Role";
import { Repository } from "typeorm";
import { ResponseHandler } from "../helper/ResponseHandler";
import { StatusCodes } from "http-status-codes";
import { validate } from "class-validator";
import { instanceToPlain } from "class-transformer";

export class RoleController {
  public static readonly ERROR_NO_ROLE_ID_PROVIDED = "No ID provided";
  public static readonly ERROR_INVALID_ROLE_ID_FORMAT = "Invalid ID format";
  public static readonly ERROR_ROLE_NOT_FOUND = "Role not found";
  public static readonly ERROR_ROLE_NOT_FOUND_WITH_ID = (id: number) =>
    `Role not found with ID: ${id}`;
  public static readonly ERROR_FAILED_TO_RETRIEVE_ROLES =
    "Failed to retrieve roles";
  public static readonly ERROR_FAILED_TO_RETRIEVE_ROLE =
    "Failed to retrieve role";
  public static readonly ERROR_ROLE_NOT_FOUND_FOR_DELETION =
    "Role with the provided ID not found";
  public static readonly ERROR_VALIDATION_FAILED = "Validation failed";

  private roleRepository: Repository<Role>;
  constructor() {
    this.roleRepository = AppDataSource.getRepository(Role);
  }

  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const roles = await this.roleRepository.find();
      if (roles.length === 0) {
        ResponseHandler.sendErrorResponse(res, StatusCodes.NO_CONTENT);
        return;
      }
      ResponseHandler.sendSuccessResponse(res, roles);
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        `${RoleController.ERROR_FAILED_TO_RETRIEVE_ROLES}: ${error.message}`
      );
    }
  };

  public getById = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        RoleController.ERROR_INVALID_ROLE_ID_FORMAT
      );
      return;
    }

    try {
      const role = await this.roleRepository.findOneBy({ id });
      if (!role) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.NO_CONTENT,
          RoleController.ERROR_ROLE_NOT_FOUND_WITH_ID(id)
        );
        return;
      }
      ResponseHandler.sendSuccessResponse(res, role);
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        RoleController.ERROR_FAILED_TO_RETRIEVE_ROLE
      );
    }
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      let role = new Role();
      role.name = req.body.name;

      const errors = await validate(role);
      if (errors.length > 0) {
        throw new Error(
          errors.map((err) => Object.values(err.constraints || {})).join(", ")
        );
      }

      role = await this.roleRepository.save(role);

      ResponseHandler.sendSuccessResponse(
        res,
        instanceToPlain(role),
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

  public delete = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
      if (!id) {
        throw new Error(RoleController.ERROR_NO_ROLE_ID_PROVIDED);
      }
      const result = await this.roleRepository.delete(id);
      if (result.affected === 0) {
        throw new Error(RoleController.ERROR_ROLE_NOT_FOUND_FOR_DELETION);
      }
      ResponseHandler.sendSuccessResponse(res, "Role deleted", StatusCodes.OK);
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        error.message
      );
    }
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    const id = req.body.id;

    try {
        if (id === undefined || id === null) {
            throw new Error(RoleController.ERROR_NO_ROLE_ID_PROVIDED);
        }

        let role = await this.roleRepository.findOneBy({ id });

        if (!role) {
            throw new Error(RoleController.ERROR_ROLE_NOT_FOUND);
        }

        // Update specific fields
        if (req.body.name !== undefined) {
            role.name = req.body.name;
        }

        const errors = await validate(role, { skipMissingProperties: true });
        if (errors.length > 0) {
            throw new Error(
                errors.map((e) => Object.values(e.constraints || {})).flat().join(", ")
            );
        }

        role = await this.roleRepository.save(role);

        ResponseHandler.sendSuccessResponse(res, role, StatusCodes.OK);
    } catch (error: any) {
        ResponseHandler.sendErrorResponse(
            res,
            StatusCodes.BAD_REQUEST,
            error.message
        );
    }
};
}