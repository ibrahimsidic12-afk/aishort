export interface AnalyticsResponse {
  totalVideos: number;
  totalClips: number;
  totalPublished: number;
  totalViews: number;
  clipsByDay: Array<{ date: string; count: number }>;
  topClips: Array<{ id: string; views: number; title: string }>;
  platformBreakdown: Array<{ platform: string; count: number }>;
  processingMinutes: number;
}

export async function getAnalytics(input: {
  userId: string;
  period: string;
  metric?: string;
}): Promise<AnalyticsResponse> {
  console.warn("[ANALYTICS] getAnalytics: stub");
  return {
    totalVideos: 0,
    totalClips: 0,
    totalPublished: 0,
    totalViews: 0,
    clipsByDay: [],
    topClips: [],
    platformBreakdown: [],
    processingMinutes: 0,
  };
}
