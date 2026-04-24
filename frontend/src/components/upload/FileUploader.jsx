import { useState, useRef } from "react";
import { UploadCloud, FileImage, X } from "lucide-react";
import { cn } from "../../lib/utils";

export function FileUploader({ onFileSelect, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/tiff"];

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSelectFile = (file) => {
    setError("");
    
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Invalid file type. Please upload a JPEG, PNG, WebP, or TIFF image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum size is 10MB.");
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndSelectFile(files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const clearSelection = (e) => {
    e.stopPropagation(); // Prevent triggering the file dialog
    setSelectedFile(null);
    onFileSelect(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-64 p-6 border-2 border-dashed rounded-2xl transition-colors cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-gray-300 bg-gray-50 hover:bg-gray-100",
          disabled ? "opacity-50 cursor-not-allowed" : "",
          selectedFile ? "border-primary/50 bg-white" : ""
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={selectedFile ? undefined : triggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept="image/jpeg, image/png, image/webp, image/tiff"
          className="hidden"
          disabled={disabled}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center w-full max-w-sm text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <FileImage className="w-8 h-8" />
              </div>
              {!disabled && (
                <button
                  onClick={clearSelection}
                  className="absolute -top-2 -right-2 p-1 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-red-500 shadow-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="font-medium text-gray-900 truncate w-full px-4">
              {selectedFile.name}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-1">
              Upload your receipt
            </p>
            <p className="text-sm text-gray-500 max-w-xs">
              Drag and drop your image here, or click to browse files
            </p>
            <p className="text-xs text-gray-400 mt-4">
              Supports JPG, PNG, WEBP, TIFF (Max 10MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-red-500 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
