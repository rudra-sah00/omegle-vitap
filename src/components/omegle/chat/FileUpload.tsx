'use client';

import { useRef, useState } from 'react';
import { Paperclip, X, FileImage, FileText, Video } from 'lucide-react';

interface FileUploadProps {
  isConnected: boolean;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = {
  'image/jpeg': { icon: FileImage, label: 'Image' },
  'image/png': { icon: FileImage, label: 'Image' },
  'image/gif': { icon: FileImage, label: 'Image' },
  'image/webp': { icon: FileImage, label: 'Image' },
  'video/mp4': { icon: Video, label: 'Video' },
  'video/webm': { icon: Video, label: 'Video' },
  'audio/mpeg': { icon: FileText, label: 'Audio' },
  'audio/mp3': { icon: FileText, label: 'Audio' },
  'audio/wav': { icon: FileText, label: 'Audio' },
  'audio/ogg': { icon: FileText, label: 'Audio' },
  'audio/aac': { icon: FileText, label: 'Audio' },
  'audio/m4a': { icon: FileText, label: 'Audio' },
  'application/pdf': { icon: FileText, label: 'PDF' },
  'application/msword': { icon: FileText, label: 'Document' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    icon: FileText,
    label: 'Document',
  },
};

export const FileUpload = ({ isConnected, onFileSelect, disabled }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileClick = () => {
    if (!isConnected || disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 10MB');
      return;
    }

    // Validate file type
    if (!ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES]) {
      setError('Invalid file type. Only images, videos, audio, and documents are allowed.');
      return;
    }

    onFileSelect(file);

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <button
        onClick={handleFileClick}
        disabled={!isConnected || disabled}
        className="p-3 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        title="Upload file"
        type="button"
      >
        <Paperclip className="w-5 h-5 text-slate-600" />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/m4a,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <div className="absolute bottom-full left-0 mb-2 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};

export interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  uploadProgress?: number;
}

export const FilePreview = ({ file, onRemove, uploadProgress }: FilePreviewProps) => {
  const fileType = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES];
  const Icon = fileType?.icon || FileText;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3 mb-2">
      <div className="flex-shrink-0">
        <Icon className="w-8 h-8 text-blue-500" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
        <p className="text-xs text-slate-500">
          {fileType?.label} • {formatFileSize(file.size)}
        </p>

        {uploadProgress !== undefined && uploadProgress < 100 && (
          <div className="mt-2 bg-white rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      <button
        onClick={onRemove}
        className="flex-shrink-0 text-slate-400 hover:text-red-500 transition-colors"
        title="Remove file"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
