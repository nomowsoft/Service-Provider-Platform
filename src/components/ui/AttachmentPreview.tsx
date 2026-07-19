"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Download, ZoomIn, ZoomOut, FileIcon, RotateCcw, ExternalLink } from "lucide-react";
import { formatFileSize, isImage, isVector, inferMimeType } from "@/lib/attachment-client";

export interface PreviewFile {
  url: string;
  name?: string;
  originalName?: string;
  mimetype?: string;
  fileSize?: number;
  width?: number | null;
  height?: number | null;
}

interface AttachmentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  file: PreviewFile | null;
  isAr?: boolean;
}

export default function AttachmentPreview({
  isOpen,
  onClose,
  file,
  isAr = true,
}: AttachmentPreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom and image state when file changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setImgLoaded(false);
      setNaturalSize(null);
    }
  }, [isOpen, file?.url]);

  // Handle ESC key press to close preview modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const displayName = file.originalName || file.name || "مستفق / ملف";
  const effectiveMimeType = file.mimetype || inferMimeType(file.url, displayName);

  const isImg = isImage(effectiveMimeType, file.url);
  const isVec = isVector(effectiveMimeType, file.url);
  const showZoom = isImg || isVec;
  const isPdf = effectiveMimeType === "application/pdf" || file.url.toLowerCase().includes(".pdf");

  const fitScale = naturalSize && containerRef.current
    ? Math.min(
        (containerRef.current.clientWidth - 64) / naturalSize.w,
        (containerRef.current.clientHeight - 64) / naturalSize.h,
        1
      )
    : 1;

  const displayW = naturalSize ? Math.round(naturalSize.w * zoom * fitScale) : undefined;
  const displayH = naturalSize ? Math.round(naturalSize.h * zoom * fitScale) : undefined;

  const sizeText = formatFileSize(file.fileSize);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md animate-in fade-in duration-200 flex flex-col"
      onClick={onClose}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-5 py-3 text-white/80 border-b border-white/10 bg-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-white/10 text-emerald-400">
            <FileIcon size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate max-w-md">
              {displayName}
            </p>
            {sizeText && (
              <p className="text-[11px] text-white/50 font-medium">
                {sizeText}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-white/60 hover:text-white hover:bg-white/15 rounded-xl transition-all cursor-pointer"
          title={isAr ? "إغلاق (Esc)" : "Close (Esc)"}
        >
          <X size={22} />
        </button>
      </div>

      {/* Media area */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-auto select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {showZoom ? (
          <img
            src={file.url}
            alt={displayName}
            width={displayW}
            height={displayH}
            onLoad={(e) => {
              setImgLoaded(true);
              const img = e.target as HTMLImageElement;
              setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
            }}
            className={`shadow-2xl rounded-lg ${
              imgLoaded ? "opacity-100" : "opacity-0"
            } transition-opacity duration-300`}
            draggable={false}
            style={{ maxWidth: "none", maxHeight: "none" }}
          />
        ) : isPdf ? (
          <div className="w-full h-full max-w-5xl max-h-[82vh] bg-white rounded-2xl shadow-2xl overflow-hidden relative border border-white/20">
            <iframe
              src={`${file.url}#view=FitH`}
              className="w-full h-full border-0"
              title={displayName}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 text-white/80 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400">
              <FileIcon size={40} />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-white max-w-sm truncate">
                {displayName}
              </p>
              {sizeText && (
                <p className="text-xs text-white/50 mt-1">
                  {sizeText}
                </p>
              )}
            </div>
            <a
              href={file.url}
              download={displayName}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg cursor-pointer"
            >
              <Download size={16} />
              {isAr ? "تحميل / فتح الملف" : "Download / Open File"}
            </a>
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      {(showZoom || isPdf) && (
        <div
          className="flex items-center justify-center gap-2 px-5 py-3 bg-black/60 backdrop-blur-md border-t border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {showZoom && (
            <>
              <button
                onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
                className="p-2 text-white/70 hover:text-white hover:bg-white/15 rounded-xl transition-all cursor-pointer"
                title={isAr ? "تصغير" : "Zoom out"}
              >
                <ZoomOut size={18} />
              </button>
              <span className="text-xs font-bold text-white/80 min-w-[4ch] text-center tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(5, z + 0.25))}
                className="p-2 text-white/70 hover:text-white hover:bg-white/15 rounded-xl transition-all cursor-pointer"
                title={isAr ? "تكبير" : "Zoom in"}
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/15 rounded-xl transition-all cursor-pointer"
                title={isAr ? "إعادة تعيين" : "Reset"}
              >
                <RotateCcw size={16} />
              </button>
              <div className="w-px h-5 bg-white/20 mx-2" />
            </>
          )}
          <a
            href={file.url}
            download={displayName}
            className="p-2 text-white/70 hover:text-white hover:bg-white/15 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs"
            title={isAr ? "تحميل" : "Download"}
          >
            <Download size={18} />
          </a>
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-white/70 hover:text-white hover:bg-white/15 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs"
            title={isAr ? "فتح في نافذة جديدة" : "Open in new tab"}
          >
            <ExternalLink size={18} />
          </a>
        </div>
      )}
    </div>
  );
}
