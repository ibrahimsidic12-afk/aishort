export type SubscriptionStatus = "ACTIVE" | "INACTIVE" | "PAST_DUE" | "CANCELLED";
export type UsageType =
  | "VIDEO_UPLOAD"
  | "TRANSCRIPTION"
  | "CLIP_GENERATION"
  | "CLIP_RENDER"
  | "PUBLISH";

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageRecord {
  id: string;
  userId: string;
  type: UsageType;
  quantity: number;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface PlanLimits {
  videosPerMonth: number;
  clipsPerVideo: number;
  maxVideoLength: number; // seconds
  maxStorageGb: number;
  platforms: string[];
  priority: "low" | "normal" | "high";
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  limits: PlanLimits;
  features: string[];
  stripePriceId: string;
}
