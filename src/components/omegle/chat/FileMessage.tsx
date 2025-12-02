'use client';

import { FileImage, FileText, Video, Download, Music } from 'lucide-react';
import { FileUploadService } from '@/services/fileUpload';
import Image from 'next/image';

interface FileMessageProps {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
  caption?: string;
}

export const FileMessage = ({
  fileUrl,
  fileName,
  mimeType,
  fileSize,
  caption,
}: FileMessageProps) => {
  const fileType = FileUploadService.getFileType(mimeType);

  const getIcon = () => {
    switch (fileType) {
      case 'image':
        return <FileImage className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'audio':
        return <Music className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const renderFilePreview = () => {
    if (fileType === 'image') {
      return (
        <div className="relative rounded-lg overflow-hidden border border-slate-200 hover:border-blue-400 transition-colors max-w-xs">
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            <Image
              src={fileUrl}
              alt={fileName}
              width={300}
              height={300}
              className="max-h-64 object-contain w-auto h-auto"
              loading="lazy"
              unoptimized
            />
          </a>
        </div>
      );
    }

    if (fileType === 'video') {
      return (
        <video
          src={fileUrl}
          controls
          className="max-w-xs max-h-64 rounded-lg border border-slate-200 bg-black"
          preload="metadata"
          playsInline
        >
          Your browser does not support the video tag.
        </video>
      );
    }

    if (fileType === 'audio') {
      return (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 max-w-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{fileName}</p>
              {fileSize && (
                <p className="text-xs text-slate-500">
                  {FileUploadService.formatFileSize(fileSize)}
                </p>
              )}
            </div>
          </div>
          <audio src={fileUrl} controls className="w-full" preload="metadata">
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    if (mimeType === 'application/pdf') {
      return (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden max-w-xs">
          <div className="flex items-center gap-3 p-3 bg-red-50 border-b border-red-100">
            <div className="flex-shrink-0 text-red-500">{getIcon()}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{fileName}</p>
              {fileSize && (
                <p className="text-xs text-slate-500">
                  {FileUploadService.formatFileSize(fileSize)}
                </p>
              )}
            </div>
            <a
              href={fileUrl}
              download={fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-blue-500 hover:text-blue-600 transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </a>
          </div>
          <iframe
            src={`${fileUrl}#toolbar=0&navpanes=0`}
            className="w-full h-96"
            title={fileName}
          />
        </div>
      );
    }

    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center gap-3 max-w-xs">
        <div className="flex-shrink-0 text-slate-500">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{fileName}</p>
          {fileSize && (
            <p className="text-xs text-slate-500">{FileUploadService.formatFileSize(fileSize)}</p>
          )}
        </div>
        <a
          href={fileUrl}
          download={fileName}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-blue-500 hover:text-blue-600 transition-colors"
          title="Download"
        >
          <Download className="w-5 h-5" />
        </a>
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {renderFilePreview()}
      {caption && <p className="text-sm text-slate-700">{caption}</p>}
    </div>
  );
};
