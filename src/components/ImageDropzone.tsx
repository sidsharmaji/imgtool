import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface ImageDropzoneProps {
  onImageDrop: (files: File[]) => void;
  accept?: Record<string, string[]>;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({ onImageDrop, accept }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onImageDrop(acceptedFiles);
  }, [onImageDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept || {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: true
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
    >
      <input {...getInputProps()} />
      <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <p className="text-lg font-medium text-gray-700">Drag and drop your images here</p>
    </div>
  );
}