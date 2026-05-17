export type Plan = "FREE" | "PRO" | "BUSINESS";
export type TeamRole = "OWNER" | "ADMIN" | "MEMBER";

export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: Plan;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: TeamMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: TeamRole;
  user: User;
}
