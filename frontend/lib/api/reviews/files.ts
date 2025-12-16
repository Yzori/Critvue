/**
 * File Upload API Client
 * Handles file upload and management for review requests
 */

import apiClient, { extractApiErrorMessage } from "../client";

// File metadata response from the API
export interface FileResponse {
  id: number;
  review_request_id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  file_url: string | null;
  file_path: string | null;
  content_hash: string | null;
  uploaded_at: string;
}

// Upload progress callback type
export type UploadProgressCallback = (progress: number) => void;

/**
 * Upload a single file to a review request
 */
export async function uploadFile(
  reviewId: number,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<FileResponse> {
  const formData = new FormData();
  formData.append("file", file);

  // Use XMLHttpRequest for progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });
    }

    // Handle completion
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error("Failed to parse response"));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(extractApiErrorMessage(error, "Upload failed")));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    // Handle errors
    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload cancelled"));
    });

    // Set up request
    // Authentication is handled via httpOnly cookies sent automatically
    xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL}/reviews/${reviewId}/files`);
    xhr.withCredentials = true; // Send httpOnly cookies with request

    // Send request
    xhr.send(formData);
  });
}

/**
 * Upload multiple files to a review request
 */
export async function uploadFiles(
  reviewId: number,
  files: File[],
  onProgress?: UploadProgressCallback
): Promise<FileResponse[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  // Use XMLHttpRequest for progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });
    }

    // Handle completion
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error("Failed to parse response"));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(extractApiErrorMessage(error, "Upload failed")));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    // Handle errors
    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload cancelled"));
    });

    // Set up request
    // Authentication is handled via httpOnly cookies sent automatically
    xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL}/reviews/${reviewId}/files/batch`);
    xhr.withCredentials = true; // Send httpOnly cookies with request

    // Send request
    xhr.send(formData);
  });
}

/**
 * Get all files for a review request
 */
export async function getReviewFiles(reviewId: number): Promise<FileResponse[]> {
  return apiClient.get<FileResponse[]>(`/reviews/${reviewId}/files`);
}

/**
 * Delete a file from a review request
 */
export async function deleteFile(reviewId: number, fileId: number): Promise<void> {
  return apiClient.delete(`/reviews/${reviewId}/files/${fileId}`);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

// Generic file upload response (for portfolio, etc.)
export interface GenericFileUploadResponse {
  url: string;
  filename: string;
  file_size: number;
  file_type: string;
}

/**
 * Upload a generic file (for portfolio images, etc.)
 * Uses a simple endpoint that doesn't require a review_request_id
 */
export async function uploadGenericFile(
  file: File,
  category: "portfolio" | "avatar" | "media" = "portfolio",
  onProgress?: UploadProgressCallback
): Promise<GenericFileUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);

  // Use XMLHttpRequest for progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });
    }

    // Handle completion
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error("Failed to parse response"));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(extractApiErrorMessage(error, "Upload failed")));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    // Handle errors
    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload cancelled"));
    });

    // Set up request
    xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL}/files/upload`);
    xhr.withCredentials = true; // Send httpOnly cookies with request

    // Send request
    xhr.send(formData);
  });
}

/**
 * Validate file type based on content type
 */
export function isFileTypeAllowed(file: File, contentType: string): boolean {
  const allowedTypes: Record<string, string[]> = {
    design: ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp", "application/pdf", "image/gif"],
    code: ["application/zip", "application/x-zip-compressed", "application/x-tar", "application/gzip", "text/plain"],
    video: ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/x-matroska"],
    audio: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/aac", "audio/webm"],
    writing: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "text/markdown", "application/rtf"],
    art: ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml", "image/gif", "application/pdf"]
  };

  const allowed = allowedTypes[contentType] || [];
  return allowed.includes(file.type);
}

/**
 * Get file size limit based on content type
 */
export function getFileSizeLimit(contentType: string): number {
  const limits: Record<string, number> = {
    design: 10 * 1024 * 1024,  // 10MB
    code: 50 * 1024 * 1024,    // 50MB
    video: 100 * 1024 * 1024,  // 100MB
    stream: 100 * 1024 * 1024, // 100MB - but links preferred
    audio: 50 * 1024 * 1024,   // 50MB
    writing: 10 * 1024 * 1024, // 10MB
    art: 10 * 1024 * 1024,     // 10MB
  };

  return limits[contentType] || 10 * 1024 * 1024;
}

/**
 * Get accepted file extensions for content type
 */
export function getAcceptedFileTypes(contentType: string): string {
  const accepts: Record<string, string> = {
    design: "image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,image/gif,application/pdf",
    code: "application/zip,application/x-zip-compressed,application/x-tar,application/gzip,text/plain",
    video: "video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska",
    stream: "video/mp4,video/quicktime,video/webm", // Short clips only - links preferred
    audio: "audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/aac,audio/webm",
    writing: "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,application/rtf",
    art: "image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif,application/pdf"
  };

  return accepts[contentType] || "*";
}
