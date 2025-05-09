import { validate } from "class-validator";
import { Role } from "./Role";

describe("Role entity validation", () => {
  it("A blank name is considered invalid", async () => {
    // Arrange
    const invalidRole = new Role();
    invalidRole.name = "";

    // Act
    const errors = await validate(invalidRole);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isNotEmpty).toBeDefined();
  });

  it("A name containing only spaces is considered invalid", async () => {
    // Arrange
    const invalidRole = new Role();
    invalidRole.name = " ";

    // Act
    const errors = await validate(invalidRole);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.matches).toBeDefined();
  });

  it("A name exceeding 30 characters is considered invalid", async () => {
    // Arrange
    const invalidRole = new Role();
    invalidRole.name = "a".repeat(31);

    // Act
    const errors = await validate(invalidRole);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.maxLength).toBeDefined();
  });

  it("A valid name will be accepted", async () => {
    // Arrange
    const role = new Role();
    role.name = "manager";

    // Act
    const errors = await validate(role);

    // Assert
    expect(errors.length).toBe(0);
  });
});
