import type { FileType } from "@/types/database";

const MIME_TO_FILE_TYPE: Record<string, FileType> = {
  "audio/wav": "audio",
  "audio/x-wav": "audio",
  "audio/mpeg": "audio",
  "video/mp4": "video",
  "image/jpeg": "image",
  "image/png": "image",
  "application/pdf": "pdf",
};

export const ACCEPTED_MIME_TYPES = Object.keys(MIME_TO_FILE_TYPE);

export function detectFileType(mimeType: string): FileType | null {
  return MIME_TO_FILE_TYPE[mimeType] ?? null;
}

export function buildStoragePath(
  ownerId: string,
  projectId: string,
  fileName: string,
) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${ownerId}/${projectId}/${Date.now()}-${safeName}`;
}

export const PROJECT_FILES_BUCKET = "project-files";
