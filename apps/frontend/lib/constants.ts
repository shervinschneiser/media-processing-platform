import { JobType } from "@/app/types";

export interface FormatRule {
  extensions: string[];
  jobType: JobType;
  maxSizeBytes: number;
  maxSizeLabel: string;
}

export const FORMAT_RULES: FormatRule[] = [
  {
    extensions: ["mp4", "mkv", "avi", "webm"],
    jobType: "video",
    maxSizeBytes: 2 * 1024 * 1024 * 1024, // 2 GB
    maxSizeLabel: "2 GB",
  },
  {
    extensions: ["mp3", "wav", "ogg", "flac"],
    jobType: "audio",
    maxSizeBytes: 200 * 1024 * 1024, // 200 MB
    maxSizeLabel: "200 MB",
  },
  {
    extensions: ["png", "jpg", "jpeg", "webp", "avif", "gif"],
    jobType: "image",
    maxSizeBytes: 50 * 1024 * 1024, // 50 MB
    maxSizeLabel: "50 MB",
  },
  {
    extensions: ["pdf"],
    jobType: "document",
    maxSizeBytes: 100 * 1024 * 1024, // 100 MB
    maxSizeLabel: "100 MB",
  },
];

export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  if (parts.length <= 1) return "";
  return parts[parts.length - 1].toLowerCase().trim();
}

export function getFormatRule(extension: string): FormatRule | undefined {
  return FORMAT_RULES.find((rule) => rule.extensions.includes(extension.toLowerCase()));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return isoString;
  }
}
