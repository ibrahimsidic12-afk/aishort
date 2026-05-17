export function validateFileType(fileName: string): string | null {
  const allowed = [
    "video/mp4",
    "video/webm",
    "video/avi",
    "video/mov",
    "video/quicktime",
  ];
  const ext = fileName.split(".").pop()?.toLowerCase();
  const allowedExts = ["mp4", "webm", "avi", "mov"];
  if (!ext || !allowedExts.includes(ext)) {
    return `file type "${ext}" is not supported`;
  }
  return null;
}

export function validateFileSize(size: number, maxBytes = 4 * 1024 * 1024 * 1024): string | null {
  if (size > maxBytes) {
    return `file size exceeds ${maxBytes} bytes`;
  }
  return null;
}
