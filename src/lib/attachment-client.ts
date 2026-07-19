export interface AttachmentInfo {
  id?: number | string;
  name?: string;
  originalName?: string;
  mimetype?: string;
  fileSize?: number;
  width?: number | null;
  height?: number | null;
  url: string;
  thumbnailUrl?: string;
}

export function inferMimeType(url: string, name?: string): string {
  const target = (name || url).toLowerCase();
  if (target.endsWith(".pdf")) return "application/pdf";
  if (target.endsWith(".png")) return "image/png";
  if (target.endsWith(".jpg") || target.endsWith(".jpeg")) return "image/jpeg";
  if (target.endsWith(".webp")) return "image/webp";
  if (target.endsWith(".gif")) return "image/gif";
  if (target.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

export function isImage(mimetype: string, url?: string): boolean {
  if (mimetype.startsWith("image/") && mimetype !== "image/svg+xml") return true;
  if (url) {
    const lower = url.toLowerCase();
    return (
      lower.endsWith(".png") ||
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".webp") ||
      lower.endsWith(".gif")
    );
  }
  return false;
}

export function isVector(mimetype: string, url?: string): boolean {
  if (mimetype === "image/svg+xml") return true;
  return url ? url.toLowerCase().endsWith(".svg") : false;
}

export function isDocument(mimetype: string, url?: string): boolean {
  if (
    [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
    ].includes(mimetype)
  ) {
    return true;
  }
  if (url) {
    const lower = url.toLowerCase();
    return (
      lower.endsWith(".pdf") ||
      lower.endsWith(".doc") ||
      lower.endsWith(".docx") ||
      lower.endsWith(".xls") ||
      lower.endsWith(".xlsx") ||
      lower.endsWith(".txt") ||
      lower.endsWith(".csv")
    );
  }
  return false;
}

export function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return "";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function getFileIcon(mimetype: string, url?: string): string {
  if (isImage(mimetype, url)) return "image";
  if (isVector(mimetype, url)) return "vector";
  if (isDocument(mimetype, url)) return "document";
  return "file";
}
