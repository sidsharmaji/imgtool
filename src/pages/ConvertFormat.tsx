import React, { useState } from 'react';
import { ImageDropzone } from '../components/ImageDropzone';
import { ProcessedImage } from '../types';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ConvertFormat() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [targetFormat, setTargetFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');

  const handleImageDrop = async (files: File[]) => {
    const newImages = await Promise.all(
      files.map(async (file) => {
        const img = new Image();
        const imageUrl = URL.createObjectURL(file);
        
        return new Promise<ProcessedImage>((resolve) => {
          img.onload = () => {
            resolve({
              original: file,
              preview: imageUrl,
              dimensions: {
                width: img.width,
                height: img.height
              },
              size: file.size
            });
          };
          img.src = imageUrl;
        });
      })
    );
    setImages([...images, ...newImages]);
  };

  const convertFormat = async (file: File, format: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image'));
            }
          },
          `image/${format}`,
          0.92
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const processImages = async () => {
    if (images.length === 0) return;

    setProcessing(true);
    try {
      const processedImages = await Promise.all(
        images.map(async (image) => {
          const convertedFile = await convertFormat(image.original, targetFormat);
          const convertedUrl = URL.createObjectURL(convertedFile);
          
          // Get dimensions of converted image
          const img = new Image();
          
          return new Promise<ProcessedImage>((resolve) => {
            img.onload = () => {
              resolve({
                ...image,
                processed: convertedFile,
                preview: convertedUrl,
                processedSize: convertedFile.size,
                dimensions: {
                  width: img.width,
                  height: img.height
                }
              });
            };
            img.src = convertedUrl;
          });
        })
      );
      setImages(processedImages);
    } catch (error) {
      console.error('Error converting images:', error);
    }
    setProcessing(false);
  };

  const downloadImage = (image: ProcessedImage, index: number) => {
    if (!image.processed) return;
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(image.processed);
    const extension = targetFormat === 'jpeg' ? 'jpg' : targetFormat;
    link.download = `converted-image-${index + 1}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-blue-500 hover:text-blue-600">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Tools
          </Link>
        </div>
        
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Convert Format</h1>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Format
            </label>
            <select
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value as 'jpeg' | 'png' | 'webp')}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>
          
          <ImageDropzone onImageDrop={handleImageDrop} />

          {images.length > 0 && (
            <div className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative bg-gray-50 rounded-lg p-4">
                    <img
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg mb-2"
                    />
                    <button
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="absolute top-6 right-6 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      ×
                    </button>
                    <div className="space-y-1 text-sm">
                      <p>Original: {formatFileSize(image.size!)}</p>
                      {image.processed && (
                        <p>Converted: {formatFileSize(image.processedSize!)}</p>
                      )}
                      <p>
                        {image.dimensions?.width} × {image.dimensions?.height} px
                      </p>
                    </div>
                    {image.processed && (
                      <button
                        onClick={() => downloadImage(image, index)}
                        className="mt-2 w-full bg-green-500 text-white px-3 py-1.5 rounded text-sm hover:bg-green-600"
                      >
                        Download
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={processImages}
                disabled={processing}
                className={`mt-6 px-6 py-3 rounded-lg text-white font-medium
                  ${processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
              >
                {processing ? 'Converting...' : 'Convert Images'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}