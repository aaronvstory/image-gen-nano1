
import React, { useState, useCallback, useEffect } from 'react';
import { OriginalImage } from '../types';
import { ExpandIcon, UploadCloudIcon } from './ui/Icons';

interface ImageUploaderProps {
  onImageUpload: (image: OriginalImage) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        const result = e.target?.result as string;
        img.onload = () => {
          onImageUpload({ src: result, width: img.width, height: img.height });
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select an image file.');
    }
  }, [onImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);
  
  const handlePaste = useCallback((event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              processFile(file);
            }
            break;
        }
    }
  }, [processFile]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
        window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <div className="text-center w-full max-w-2xl">
      <div className="flex flex-col items-center justify-center gap-2 mb-8">
        <ExpandIcon className="h-6 w-6 text-muted-foreground" />
        <p className="text-muted-foreground">Expand your images to any size</p>
      </div>
      <div
        onClick={triggerFileSelect}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center w-full h-64 rounded-xl border-2 border-dashed border-border transition-all duration-300 cursor-pointer
          ${isDragging ? 'border-primary bg-accent' : 'bg-secondary/50 hover:border-primary/80'}`}
      >
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <UploadCloudIcon className="w-12 h-12 mb-4" />
          <p className="text-lg font-semibold text-foreground">Drag and drop an image</p>
          <p>or click to upload. You can also paste from clipboard (Ctrl+V).</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ImageUploader;
