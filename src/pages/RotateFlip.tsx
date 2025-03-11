import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCw, RotateCcw, FlipHorizontal2, FlipVertical2 } from 'lucide-react';
import { ImageDropzone } from '../components/ImageDropzone';
import { ProcessedImage } from '../types';

export function RotateFlip() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [processing, setProcessing] = useState(false);

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

  const processImage = async (image: ProcessedImage, operation: 'rotateLeft' | 'rotateRight' | 'flipH' | 'flipV'): Promise<ProcessedImage> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    return new Promise((resolve) => {
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (operation === 'rotateLeft' || operation === 'rotateRight') {
          // Swap dimensions for rotation
          canvas.width = height;
          canvas.height = width;
        } else {
          canvas.width = width;
          canvas.height = height;
        }

        // Configure high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Apply transformations
        ctx.save();
        switch (operation) {
          case 'rotateLeft':
            ctx.translate(0, width);
            ctx.rotate(-Math.PI / 2);
            break;
          case 'rotateRight':
            ctx.translate(height, 0);
            ctx.rotate(Math.PI / 2);
            break;
          case 'flipH':
            ctx.translate(width, 0);
            ctx.scale(-1, 1);
            break;
          case 'flipV':
            ctx.translate(0, height);
            ctx.scale(1, -1);
            break;
        }

        // Draw the transformed image
        if (operation === 'rotateLeft' || operation === 'rotateRight') {
          ctx.drawImage(img, 0, 0);
        } else {
          ctx.drawImage(img, 0, 0, width, height);
        }
        ctx.restore();

        canvas.toBlob(
          (blob) => {
            if (!blob) return;

            const processedUrl = URL.createObjectURL(blob);
            resolve({
              ...image,
              processed: blob,
              preview: processedUrl,
              processedSize: blob.size,
              dimensions: {
                width: canvas.width,
                height: canvas.height
              }
            });
          },
          'image/jpeg',
          0.92
        );
      };
      img.src = image.preview;
    });
  };

  const processImages = async (operation: 'rotateLeft' | 'rotateRight' | 'flipH' | 'flipV') => {
    if (images.length === 0) return;

    setProcessing(true);
    try {
      const processedImages = await Promise.all(
        images.map(async (image) => {
          return await processImage(image, operation);
        })
      );
      setImages(processedImages);
    } catch (error) {
      console.error('Error processing images:', error);
    }
    setProcessing(false);
  };

  const downloadImage = (image: ProcessedImage, index: number) => {
    if (!image.processed) return;
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(image.processed);
    link.download = `transformed-image-${index + 1}.jpg`;
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Rotate & Flip</h1>
          
          <div className="mb-6 flex space-x-4">
            <button
              onClick={() => processImages('rotateLeft')}
              disabled={processing || images.length === 0}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Rotate Left
            </button>
            <button
              onClick={() => processImages('rotateRight')}
              disabled={processing || images.length === 0}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <RotateCw className="w-5 h-5 mr-2" />
              Rotate Right
            </button>
            <button
              onClick={() => processImages('flipH')}
              disabled={processing || images.length === 0}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <FlipHorizontal2 className="w-5 h-5 mr-2" />
              Flip Horizontal
            </button>
            <button
              onClick={() => processImages('flipV')}
              disabled={processing || images.length === 0}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <FlipVertical2 className="w-5 h-5 mr-2" />
              Flip Vertical
            </button>
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
                        <p>Processed: {formatFileSize(image.processedSize!)}</p>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}