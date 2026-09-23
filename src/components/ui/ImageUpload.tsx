"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, Link as LinkIcon, X, Check, Loader2 } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  description?: string;
}

export function ImageUpload({
  value,
  onChange,
  label = "Campaign Brand Logo / Banner Image",
  description = "Upload an image from your device or paste a public web link. This image will represent your campaign brand.",
}: ImageUploadProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState(value || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setUploadError("");

    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files (PNG, JPG, WEBP, GIF, SVG) are allowed.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image file size must be less than 10MB.");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        onChange(data.url);
        setUrlInput(data.url);
      } else {
        setUploadError(data.error || "Failed to upload image.");
      }
    } catch (err: any) {
      setUploadError("Network error while uploading image.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUploadError("");
    }
  };

  const handleRemove = () => {
    onChange("");
    setUrlInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-slate-300 font-semibold">{label}</label>
          {description && <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>}
        </div>

        {/* Tab switch - Equal visual weight segmented control (Issue 8) */}
        <div className="inline-flex items-center p-1 bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`h-7 px-3 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold ${
              activeTab === "upload"
                ? "bg-slate-800 text-brand-cyan border border-brand-cyan/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Local Upload</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`h-7 px-3 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold ${
              activeTab === "url"
                ? "bg-slate-800 text-brand-cyan border border-brand-cyan/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Web URL</span>
          </button>
        </div>
      </div>

      {/* Image Preview if available */}
      {value ? (
        <div className="relative rounded-2xl bg-slate-900/90 border border-slate-700/80 p-3.5 flex items-center gap-3.5">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 relative flex items-center justify-center">
            <img
              src={value}
              alt="Campaign Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                // fallback
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600";
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            {/* Consolidated clean status badge (Issue 7) */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20 px-2.5 py-0.5 rounded-full">
                <Check className="w-3.5 h-3.5" /> Image attached
              </span>
            </div>
            
            {/* Accessible secondary action buttons with 32px height (Issue 10) */}
            <div className="flex items-center gap-2 mt-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                Replace image
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="h-8 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {activeTab === "upload" ? (
            /* Drag and drop local upload */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all flex flex-col items-center justify-center gap-2.5 ${
                dragOver
                  ? "border-brand-cyan bg-brand-cyan/10"
                  : "border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900"
              }`}
            >
              {uploading ? (
                <div className="py-4 flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-brand-cyan animate-spin" />
                  <span className="text-xs text-slate-300 font-semibold">
                    Uploading image to local storage...
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-cyan">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white hover:text-brand-cyan">
                      Click to browse from local computer
                    </span>
                    <span className="text-xs text-slate-400"> or drag and drop image here</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Supports JPG, PNG, WEBP, GIF, SVG up to 10MB
                  </p>
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </div>
          ) : (
            /* Web URL input */
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or public image link"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyUrl();
                    }
                  }}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-cyan"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-brand-cyan hover:text-slate-950 text-white font-bold text-xs transition-colors"
                >
                  Apply URL
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Paste an image URL from Unsplash, Imgur, or your CDN.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input for replace action when value is present */}
      {value && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
          className="hidden"
        />
      )}

      {uploadError && (
        <p className="text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
          {uploadError}
        </p>
      )}
    </div>
  );
}
