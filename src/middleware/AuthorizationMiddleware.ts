import { Request, Response, NextFunction } from "express";

/**
 * Middleware to check if the user has the required role.
 * @param allowedRoles Roles allowed to access the route
 */
export const authorizeRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: "Access denied: Insufficient permissions." });
    }

    next();
  };
};