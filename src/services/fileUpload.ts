const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

export interface FileUploadResponse {
  success: boolean;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
}

export class FileUploadService {
  private static apiUrl = API_URL;
  private static apiKey = API_KEY;

  /**
   * Upload a file to the backend
   */
  static async uploadFile(file: File, roomId: string, uid: number): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('roomId', roomId);
    formData.append('uid', uid.toString());

    const response = await fetch(`${this.apiUrl}/api/upload`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'File upload failed');
    }

    return response.json();
  }

  /**
   * Get file type category
   */
  static getFileType(mimeType: string): 'image' | 'video' | 'audio' | 'document' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  /**
   * Format file size
   */
  static formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
