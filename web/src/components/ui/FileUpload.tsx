import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, Image, Film } from 'lucide-react';
import './FileUpload.css';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  files?: File[];
  className?: string;
}

export function FileUpload({
  onFilesChange,
  maxFiles = 10,
  maxSizeMB = 50,
  acceptedTypes = ['image/*', 'video/*'],
  files = [],
  className = '',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFiles = useCallback((newFiles: FileList | File[]): File[] => {
    const validFiles: File[] = [];
    const maxSize = maxSizeMB * 1024 * 1024;

    for (const file of Array.from(newFiles)) {
      if (files.length + validFiles.length >= maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        break;
      }

      if (file.size > maxSize) {
        setError(`File "${file.name}" exceeds ${maxSizeMB}MB limit`);
        continue;
      }

      const isValidType = acceptedTypes.some((type) => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', ''));
        }
        return file.type === type;
      });

      if (!isValidType) {
        setError(`File "${file.name}" is not a supported format`);
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  }, [files.length, maxFiles, maxSizeMB, acceptedTypes]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const validFiles = validateFiles(e.dataTransfer.files);
    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles]);
    }
  }, [files, validateFiles, onFilesChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const inputFiles = e.target.files;
    if (!inputFiles) return;

    const validFiles = validateFiles(inputFiles);
    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles]);
    }

    e.target.value = '';
  }, [files, validateFiles, onFilesChange]);

  const removeFile = useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  }, [files, onFilesChange]);

  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  return (
    <div className={`file-upload ${className}`}>
      <div
        className={`file-upload-zone ${isDragging ? 'file-upload-zone-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="file-upload-input"
        />
        
        <div className="file-upload-content">
          <div className="file-upload-icon">
            <Upload size={32} />
          </div>
          <p className="file-upload-text">
            <span className="file-upload-text-primary">Click to upload</span>
            <span className="file-upload-text-secondary"> or drag and drop</span>
          </p>
          <p className="file-upload-hint">
            Images and videos up to {maxSizeMB}MB
          </p>
        </div>
      </div>

      {error && <p className="file-upload-error">{error}</p>}

      {files.length > 0 && (
        <div className="file-upload-preview-grid">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="file-upload-preview-item">
              {file.type.startsWith('image/') ? (
                <img
                  src={getFilePreview(file) || ''}
                  alt={file.name}
                  className="file-upload-preview-image"
                />
              ) : (
                <div className="file-upload-preview-video">
                  <Film size={24} />
                  <span className="file-upload-preview-name">{file.name}</span>
                </div>
              )}
              <button
                className="file-upload-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                type="button"
                aria-label={`Remove ${file.name}`}
              >
                <X size={14} />
              </button>
              <div className="file-upload-preview-overlay">
                {file.type.startsWith('image/') ? <Image size={16} /> : <Film size={16} />}
                <span>{(file.size / 1024 / 1024).toFixed(1)}MB</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
