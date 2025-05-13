import { Request, Response, NextFunction } from "express";

const allowedRoles = ["Admin", "Manager", "Employee"];

/**
 * Validates user creation data.
 */
export const validateUserCreation = (req: Request, res: Response, next: NextFunction) => {
  const { name, email, role } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Name is required and must be a string." });
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Valid email is required." });
  }

  if (!role || !allowedRoles.includes(role)) {
    return res.status(400).json({ error: `Role must be one of: ${allowedRoles.join(", ")}` });
  }

  next();
};

/**
 * Validates user update data.
 */
export const validateUserUpdate = (req: Request, res: Response, next: NextFunction) => {
  const { role } = req.body;

  if (role && !allowedRoles.includes(role)) {
    return res.status(400).json({ error: `Role must be one of: ${allowedRoles.join(", ")}` });
  }

  next();
};