export type { AdminRole, Permission } from "@/server/auth/rbac";

export interface SessionUserDTO {
  id: string;
  fullName: string;
  email: string;
  onboardingCompleted: boolean;
}
