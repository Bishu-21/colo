import React, { useState } from "react";

export interface FileDropzoneProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDrop?: (file: File) => void;
  accept?: string;
  label?: string;
  subtext?: string;
  className?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileChange,
  onFileDrop,
  accept = "image/*",
  label = "[DROP_SOURCE_FILE]",
  subtext = "SUPPORTED: JPG, PNG, WEBP (Max 15MB)",
  className = "",
}) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (onFileDrop) {
        onFileDrop(file);
      } else {
        // Construct a synthetic ChangeEvent to reuse handleFileChange
        const syntheticEvent = {
          target: {
            files: e.dataTransfer.files
          }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onFileChange(syntheticEvent);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-grow flex flex-col items-center justify-center border-2 border-dashed m-8 transition-colors select-none ${
        dragOver
          ? "border-primary bg-surface-container-high"
          : "border-outline bg-surface-container-lowest hover:bg-surface-container"
      } ${className}`}
    >
      <span className="material-symbols-outlined text-4xl text-secondary mb-4">
        upload_file
      </span>
      <p className="font-label-bold text-label-bold uppercase mb-2">
        {label}
      </p>
      <p className="font-metadata text-metadata text-outline-variant mb-6">
        {subtext}
      </p>
      <label className="px-6 py-3 bg-carbon text-white uppercase font-metadata text-metadata rounded-full hover:bg-muted-teal transition-all cursor-pointer">
        Browse Files
        <input
          type="file"
          accept={accept}
          onChange={onFileChange}
          className="hidden"
        />
      </label>
    </div>
  );
};
