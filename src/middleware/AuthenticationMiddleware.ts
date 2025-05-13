// import { Request, Response, NextFunction } from "express";
// import jwt from "jsonwebtoken";

// // Replace this with your JWT secret
// const JWT_SECRET = process.env.JWT_SECRET;

// export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({ error: "Unauthorized: No token provided." });
//   }

//   const token = authHeader.split(" ")[1];

//   try {
//     // Verify the token and attach decoded user data to req.user
//     const decodedUser = jwt.verify(token, JWT_SECRET);
//     req.user = decodedUser; // Attach user info to the request
//     next();
//   } catch (error) {
//     return res.status(401).json({ error: "Unauthorized: Invalid token." });
//   }
// };