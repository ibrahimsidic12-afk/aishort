export function validateFileType(mimeType: string): boolean {
  const allowed = [
    "video/mp4",
    "video/webm", 
    "video/avi",
    "video/mov",
    "video/quicktime",
    "video/x-msvideo"
  ];
  return allowed.includes(mimeType);
}

export function validateFileSize(size: number, maxBytes: number): boolean {
  return size <= maxBytes;
}
