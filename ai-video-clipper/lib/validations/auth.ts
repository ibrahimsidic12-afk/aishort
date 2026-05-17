/**
 * Auth validation schemas (Zod)
 */

import { z } from "zod";

export const clerkWebhookSchema = z.object({
  type: z.string(),
  data: z.record(z.unknown()),
});

export const oauthCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
});

export const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
});

export const inviteTeamMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export const updateTeamMemberSchema = z.object({
  memberId: z.string().min(1),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const removeTeamMemberSchema = z.object({
  memberId: z.string().min(1),
});

export type OAuthCallbackInput = z.infer<typeof oauthCallbackSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;
