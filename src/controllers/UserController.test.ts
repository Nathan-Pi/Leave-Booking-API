import { UserController } from "../controllers/UserController";
import { User } from "../entity/User";
import { Role } from "../entity/Role";
import { DeleteResult, Repository } from "typeorm";
import { StatusCodes } from "http-status-codes";
import { ResponseHandler } from "../helper/ResponseHandler";
import { Request, Response } from "express";
import * as classValidator from "class-validator";
import * as classTransformer from "class-transformer";
import { mock } from "jest-mock-extended";

const VALIDATOR_CONSTRAINT_PASSWORD_AT_LEAST_10_CHARS =
  "Password must be at least 10 characters long";
const VALIDATOR_CONSTRAINT_INVALID_EMAIL = "Must be a valid email address";
const VALIDATOR_CONSTRAINT_INVALID_ID = "User is required";
const ERROR_NO_ID_PROVIDED = "No ID provided";
const INVALID_USER_ID_NUMBER = "User with the provided ID not found";
const BLANK_USER_NAME = "";
const VALIDATOR_CONSTRAINT_EMPTY_OR_WHITESPACE =
  "Name cannot be empty or whitespace";
const VALIDATOR_CONSTRAINT_MAX_LENGTH_EXCEEDED =
  "Name must be 30 characters or less";

jest.mock("../helper/ResponseHandler");
jest.mock("class-validator", () => ({
  ...jest.requireActual("class-validator"),
  validate: jest.fn(),
}));
jest.mock("class-transformer", () => ({
  ...jest.requireActual("class-transformer"),
  instanceToPlain: jest.fn(),
}));

describe("UserController", () => {
  function getValidManagerData(): User {
    let role = new Role();
    role.id = 1;
    role.name = "manager";
    let user = new User();
    user.id = 1;
    user.password = "a".repeat(10);
    user.email = "manager@email.com";
    user.role = role;
    return user;
  }
  function getValidStaffData(): User {
    let role = new Role();
    role.id = 2;
    role.name = "staff";
    let user = new User();
    user.id = 1;
    user.password = "b".repeat(10);
    user.email = "staff@email.com";
    user.role = role;
    return user;
  }

  const mockRequest = (params = {}, body = {}): Partial<Request> => ({
    params,
    body,
  });
  const mockResponse = (): Partial<Response> => ({});

  let userController: UserController;
  let mockUserRepository: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    mockUserRepository = mock<Repository<User>>();
    // Inject the mocked repository into UserController
    userController = new UserController();
    userController["userRepository"] = mockUserRepository as Repository<User>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("getAll returns NO_CONTENT if no users exist", async () => {
    // Arrange
    const req = mockRequest();
    const res = mockResponse();
    mockUserRepository.find.mockResolvedValue([]); //Simulate no users in the database

    // Act
    await userController.getAll(req as Request, res as Response);

    // Assert
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.NO_CONTENT
    );
  });

  it("getAll returns INTERNAL_SERVER_ERROR if server fails to retrieve users", async () => {
    // Arrange
    const req = mockRequest();
    const res = mockResponse();
    mockUserRepository.find.mockRejectedValue(
      new Error("Database connection error")
    );

    // Act
    await userController.getAll(req as Request, res as Response);

    // Assert
    expect(mockUserRepository.find).toHaveBeenCalled();
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to retrieve users: Database connection error`
    );
  });

  it("getAll will return all users", async () => {
    // Arrange
    const mockUsers: User[] = [getValidManagerData(), getValidStaffData()];
    const req = mockRequest();
    const res = mockResponse();
    mockUserRepository.find.mockResolvedValue(mockUsers);

    // Act
    await userController.getAll(req as Request, res as Response);

    // Assert
    expect(mockUserRepository.find).toHaveBeenCalledWith({
      relations: ["role"],
    });
    expect(ResponseHandler.sendSuccessResponse).toHaveBeenCalledWith(
      res,
      mockUsers
    );
  });

  it("create will return BAD_REQUEST if no user password was provided", async () => {
    // Arrange
    const validManagerDetails = getValidManagerData();
    const req = mockRequest(
      {},
      { email: validManagerDetails.email, roleId: validManagerDetails.role.id }
    );
    const res = mockResponse();
    //controller validate returns Password must be at least 10 characters long
    const EXPECTED_ERROR_MESSAGE =
      VALIDATOR_CONSTRAINT_PASSWORD_AT_LEAST_10_CHARS;
    jest.spyOn(classValidator, "validate").mockResolvedValue([
      {
        property: "password",
        constraints: {
          //IsString: VALIDATOR_CONSTRAINT_PASSWORD_MUST_BE_A_STRING,
          MinLength: VALIDATOR_CONSTRAINT_PASSWORD_AT_LEAST_10_CHARS,
        },
      },
    ]);

    // Act
    await userController.create(req as Request, res as Response);

    // Assert
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      EXPECTED_ERROR_MESSAGE
    );
  });

  it("create will return BAD_REQUEST if no user email was provided", async () => {
    // Arrange
    const validManagerDetails = getValidManagerData();
    const req = mockRequest(
      {},
      {
        password: validManagerDetails.password,
        roleId: validManagerDetails.role.id,
      }
    );
    const res = mockResponse();
    const EXPECTED_ERROR_MESSAGE = VALIDATOR_CONSTRAINT_INVALID_EMAIL;
    jest.spyOn(classValidator, "validate").mockResolvedValue([
      {
        property: "email",
        constraints: {
          IsEmail: VALIDATOR_CONSTRAINT_INVALID_EMAIL,
        },
      },
    ]);

    // Act
    await userController.create(req as Request, res as Response);

    // Assert
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      EXPECTED_ERROR_MESSAGE
    );
  });

  it("create will return BAD_REQUEST if no user id was provided", async () => {
    // Arrange
    const validManagerDetails = getValidManagerData();
    const req = mockRequest(
      {},
      {
        email: validManagerDetails.email,
        password: validManagerDetails.password,
      }
    );
    const res = mockResponse();
    //controller validate returns Password must be at least 10 characters long
    const EXPECTED_ERROR_MESSAGE = VALIDATOR_CONSTRAINT_INVALID_ID;
    jest.spyOn(classValidator, "validate").mockResolvedValue([
      {
        property: "role",
        constraints: {
          //IsString: VALIDATOR_CONSTRAINT_PASSWORD_MUST_BE_A_STRING,
          IsNotEmpty: VALIDATOR_CONSTRAINT_INVALID_ID,
        },
      },
    ]);

    // Assert
    await userController.create(req as Request, res as Response);

    // Arrange
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      EXPECTED_ERROR_MESSAGE
    );
  });

  it("create will return a valid user and return CREATED status when supplied with valid details", async () => {
    // Arrange
    const validManagerDetails = getValidManagerData();
    const req = mockRequest(
      {},
      {
        password: validManagerDetails.password,
        email: validManagerDetails.email,
        roleId: validManagerDetails.role.id,
      }
    );
    const res = mockResponse();
    mockUserRepository.save.mockResolvedValue(validManagerDetails);
    jest.spyOn(classTransformer, "instanceToPlain").mockReturnValue({
      id: validManagerDetails.id,
      email: validManagerDetails.email,
      role: {
        id: validManagerDetails.role.id,
        name: validManagerDetails.role.name,
      },
    } as any);
    jest.spyOn(classValidator, "validate").mockResolvedValue([]);

    // Act
    await userController.create(req as Request, res as Response);

    // Assert
    expect(mockUserRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        password: validManagerDetails.password,
        email: validManagerDetails.email,
        role: validManagerDetails.role.id,
      })
    );
    expect(ResponseHandler.sendSuccessResponse).toHaveBeenCalledWith(
      res,
      //instanceToPlain should remove password (even if we didn't use a spy)
      {
        id: validManagerDetails.id,
        email: validManagerDetails.email,
        role: validManagerDetails.role,
      },
      StatusCodes.CREATED
    );
  });

  it("delete will return NOT_FOUND if no id is provided", async () => {
    // Arrange
    const req = mockRequest(); //Empty request = no param for id
    const res = mockResponse();

    // Act
    await userController.delete(req as Request, res as Response);

    // Assert
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.NOT_FOUND,
      ERROR_NO_ID_PROVIDED
    );
  });

  it("delete will return NOT_FOUND if the user id does not exist", async () => {
    // Arrange
    const req = mockRequest({ id: INVALID_USER_ID_NUMBER });
    const res = mockResponse();
    //Simulate that no role was deleted
    const deleteResult: DeleteResult = { affected: 0 } as DeleteResult;
    mockUserRepository.delete.mockResolvedValue(deleteResult);

    // Act
    await userController.delete(req as Request, res as Response);
    expect(mockUserRepository.delete).toHaveBeenCalledWith(
      INVALID_USER_ID_NUMBER
    );

    // Assert
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.NOT_FOUND,
      INVALID_USER_ID_NUMBER
    );
  });

  it("Delete will return SUCCESS if the role is successfully deleted", async () => {
    // Arrange
    const validManagerDetails = getValidManagerData();
    const req = mockRequest({ id: validManagerDetails.id }); //id that exists
    const res = mockResponse();
    //Simulate a deletion
    const deleteResult: DeleteResult = { affected: 1 } as DeleteResult;
    mockUserRepository.delete.mockResolvedValue(deleteResult);

    // Act
    await userController.delete(req as Request, res as Response);

    // Assert
    expect(mockUserRepository.delete).toHaveBeenCalledWith(
      validManagerDetails.id
    );
    expect(ResponseHandler.sendSuccessResponse).toHaveBeenCalledWith(
      res,
      "User deleted",
      StatusCodes.OK
    );
  });

  it("update returns a BAD_REQUEST if no id is provided", async () => {
    // Arrange
    const req = mockRequest({}, {}); //Invalid/no id
    const res = mockResponse();

    // Act
    await userController.update(req as Request, res as Response);

    // Assert
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      ERROR_NO_ID_PROVIDED
    );
  });

  it("Update will return a BAD_REQUEST if the name does not exist/blank", async () => {
    // Arrange
    const validManagerDetails = getValidManagerData();
    const req = mockRequest(
      {},
      { id: validManagerDetails.id, name: BLANK_USER_NAME }
    );
    const res = mockResponse();
    mockUserRepository.findOneBy.mockResolvedValue(validManagerDetails);
    const EXPECTED_ERROR_MESSAGE = `${VALIDATOR_CONSTRAINT_INVALID_ID}, ${VALIDATOR_CONSTRAINT_EMPTY_OR_WHITESPACE}, ${VALIDATOR_CONSTRAINT_MAX_LENGTH_EXCEEDED}`;
    jest.spyOn(classValidator, "validate").mockResolvedValue([
      {
        property: "name",
        constraints: {
          isNotEmpty: VALIDATOR_CONSTRAINT_INVALID_ID,
          Matches: VALIDATOR_CONSTRAINT_EMPTY_OR_WHITESPACE,
          MaxLength: VALIDATOR_CONSTRAINT_MAX_LENGTH_EXCEEDED,
        },
      },
    ]);

    // Act
    await userController.update(req as Request, res as Response);

    // Assert
    expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({
      id: validManagerDetails.id,
    });
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      EXPECTED_ERROR_MESSAGE
    );
  });
});
