export function uploadToYouTube(input: { videoUrl: string; title: string; description: string }): Promise<unknown> {
  console.warn("[YOUTUBE] uploadToYouTube: stub");
  return Promise.resolve({ id: "yt_stub" });
}

export function publishYouTubeVideo(input: unknown): Promise<unknown> {
  console.warn("[YOUTUBE] publishYouTubeVideo: stub");
  return Promise.resolve({});
}
