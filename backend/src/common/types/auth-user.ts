import { Role } from "@prisma/client";

// The JWT payload we sign, and the shape attached to `req.user` after validation.
export interface JwtPayload {
  sub: string; // userId
  hospitalId: string;
  role: Role;
}

export interface AuthUser {
  userId: string;
  hospitalId: string;
  role: Role;
}
