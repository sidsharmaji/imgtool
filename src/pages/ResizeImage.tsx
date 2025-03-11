import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ImageDropzone } from '../components/ImageDropzone';
import { ResizeOptionsPanel } from '../components/ResizeOptions';
import { ProcessedImage, ResizeOptions } from '../types';

export function ResizeImage() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [resizeOptions, setResizeOptions] = useState<ResizeOptions>({
    width: 800,
    height: 600,
    maintainAspectRatio: true
  });

  const handleImageDrop = async (files: File[]) => {
    const newImages = await Promise.all(
      files.map(async (file) => {
        const img = new Image();
        const imageUrl = URL.createObjectURL(file);
        
        return new Promise<ProcessedImage>((resolve) => {
          img.onload = () => {
            setResizeOptions({
              ...resizeOptions,
              width: img.width,
              height: img.height
            });
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

  const processImages = async () => {
    if (images.length === 0) return;

    setProcessing(true);
    try {
      const processedImages = await Promise.all(
        images.map(async (image) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          const img = new Image();

          return new Promise<ProcessedImage>((resolve) => {
            img.onload = () => {
              canvas.width = resizeOptions.width;
              canvas.height = resizeOptions.height;
              
              // Use high-quality image scaling
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              
              // Draw the resized image
              ctx.drawImage(img, 0, 0, resizeOptions.width, resizeOptions.height);
              
              // Convert to blob
              canvas.toBlob(
                (blob) => {
                  if (!blob) return;
                  
                  const resizedUrl = URL.createObjectURL(blob);
                  resolve({
                    ...image,
                    processed: blob,
                    preview: resizedUrl,
                    processedSize: blob.size,
                    dimensions: {
                      width: resizeOptions.width,
                      height: resizeOptions.height
                    }
                  });
                },
                'image/jpeg',
                0.92
              );
            };
            img.src = image.preview;
          });
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
    link.download = `resized-image-${index + 1}.jpg`;
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Resize Image</h1>
          
          <div className="mb-6">
            <ResizeOptionsPanel
              options={resizeOptions}
              onChange={setResizeOptions}
              originalDimensions={images[0]?.dimensions}
            />
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
                        <p>Resized: {formatFileSize(image.processedSize!)}</p>
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
                {processing ? 'Processing...' : 'Resize Images'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}