import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

// Marks a route as open (skips the global JwtAuthGuard): register, login, health.
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
