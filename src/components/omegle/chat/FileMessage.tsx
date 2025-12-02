'use client';

import { FileImage, FileText, Video, Download, Music, X } from 'lucide-react';
import { FileUploadService } from '@/services/fileUpload';
import Image from 'next/image';
import { useState } from 'react';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
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

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
  };

  const getImageDisplaySize = () => {
    if (!imageDimensions.width || !imageDimensions.height) {
      return { width: 300, height: 300 };
    }

    const maxWidth = 400;
    const maxHeight = 300;
    const aspectRatio = imageDimensions.width / imageDimensions.height;

    let width = imageDimensions.width;
    let height = imageDimensions.height;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return { width: Math.round(width), height: Math.round(height) };
  };

  const renderFilePreview = () => {
    if (fileType === 'image') {
      const displaySize = getImageDisplaySize();

      return (
        <>
          <div
            className="relative rounded-lg overflow-hidden border border-slate-200 hover:border-blue-400 transition-colors cursor-pointer bg-slate-50"
            style={{
              width: displaySize.width || 'auto',
              height: displaySize.height || 'auto',
            }}
            onClick={() => setIsModalOpen(true)}
          >
            <Image
              src={fileUrl}
              alt={fileName}
              width={displaySize.width}
              height={displaySize.height}
              className="object-cover"
              loading="lazy"
              unoptimized
              onLoad={handleImageLoad}
            />
          </div>

          {/* Image Modal */}
          {isModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            >
              <button
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="w-8 h-8" />
              </button>
              <div
                className="relative max-w-[90vw] max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={fileUrl}
                  alt={fileName}
                  width={imageDimensions.width || 800}
                  height={imageDimensions.height || 600}
                  className="max-w-full max-h-[90vh] object-contain"
                  unoptimized
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-white text-sm truncate">{fileName}</p>
                  {fileSize && (
                    <p className="text-gray-300 text-xs">
                      {FileUploadService.formatFileSize(fileSize)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      );
    }

    if (fileType === 'video') {
      return (
        <>
          <div
            className="relative rounded-lg overflow-hidden border border-slate-200 hover:border-blue-400 transition-colors cursor-pointer bg-black max-w-md"
            onClick={() => setIsModalOpen(true)}
          >
            <video
              src={fileUrl}
              className="max-h-64 w-full object-contain"
              preload="metadata"
              playsInline
            >
              Your browser does not support the video tag.
            </video>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/50 rounded-full p-3">
                <Video className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Video Modal */}
          {isModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            >
              <button
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="w-8 h-8" />
              </button>
              <div
                className="relative max-w-[90vw] max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <video
                  src={fileUrl}
                  controls
                  autoPlay
                  className="max-w-full max-h-[90vh] rounded-lg"
                  playsInline
                >
                  Your browser does not support the video tag.
                </video>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-none">
                  <p className="text-white text-sm truncate">{fileName}</p>
                  {fileSize && (
                    <p className="text-gray-300 text-xs">
                      {FileUploadService.formatFileSize(fileSize)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
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
