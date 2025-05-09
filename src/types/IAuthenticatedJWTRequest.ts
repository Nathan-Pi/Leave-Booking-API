import { Role } from "../entity/Role";

declare global {
  namespace Express {
    interface Request {
      signedInUser?: {
        email?: string;
        role?: Role;
      };
    }
  }}
