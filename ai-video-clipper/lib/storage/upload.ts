export async function confirmUpload(input: {
  key: string;
  size?: number;
}): Promise<{ storageKey: string; storageUrl: string | null }> {
  console.warn("[UPLOAD] confirmUpload: stub");
  return { storageKey: input.key, storageUrl: null };
}

export async function triggerVideoProcessing(input: {
  videoId: string;
  userId: string;
}): Promise<{ jobId: string[] }> {
  console.warn("[UPLOAD] triggerVideoProcessing: stub");
  return { jobId: [] };
}
