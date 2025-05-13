// import { Request, Response, NextFunction } from "express";

// export const authorizeRole = (roles: string[]) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     console.log("Roles required:", roles); // Debugging
//     console.log("User role:", req.user.role); // Debugging

//     if (req.user && roles.includes(req.user.role)) {
//       return next();
//     }

//     res.status(403).json({ error: "Access denied: Insufficient permissions." });
//   };
// };