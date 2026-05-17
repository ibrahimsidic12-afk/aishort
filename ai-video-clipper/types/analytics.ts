export interface AnalyticsOverview {
  totalVideos: number;
  totalClips: number;
  totalPublished: number;
  creditsUsed: number;
  creditsRemaining: number;
}

export interface ClipPerformance {
  clipId: string;
  title: string;
  platform: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  retention: number;
  publishedAt: Date;
}

export interface RetentionData {
  timestamp: number;
  percentage: number;
}

export interface AnalyticsTimeRange {
  start: Date;
  end: Date;
  granularity: "hour" | "day" | "week" | "month";
}

export interface MetricPoint {
  date: string;
  value: number;
}

export interface DashboardMetrics {
  overview: AnalyticsOverview;
  recentClips: ClipPerformance[];
  clipsByDay: MetricPoint[];
  topTags: { tag: string; count: number }[];
}
