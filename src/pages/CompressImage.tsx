import React, { useState } from 'react';
import { ImageDropzone } from '../components/ImageDropzone';
import { ProcessedImage } from '../types';
import imageCompression from 'browser-image-compression';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CompressImage() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [compressionMode, setCompressionMode] = useState<'auto' | 'target'>('auto');
  const [targetSize, setTargetSize] = useState<number>(500);

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

  const compressToTargetSize = async (file: File, targetSizeKb: number): Promise<Blob> => {
    const targetSizeBytes = targetSizeKb * 1024;
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = async () => {
        const { width: originalWidth, height: originalHeight } = img;
        const originalSize = file.size;
        
        // Determine if we should reduce dimensions first based on image size and target size
        const shouldReduceDimensionsFirst = originalSize > targetSizeBytes * 3 || 
                                          (originalWidth > 1200 || originalHeight > 1200);
        
        // Calculate initial dimensions based on original size to target size ratio
        let initialWidth = originalWidth;
        let initialHeight = originalHeight;
        
        if (shouldReduceDimensionsFirst) {
          // Calculate a reasonable initial scale based on file size ratio
          // This gives us a starting point for dimension reduction
          const initialScale = Math.min(1, Math.sqrt(targetSizeBytes / originalSize) * 1.5);
          initialWidth = Math.round(originalWidth * initialScale);
          initialHeight = Math.round(originalHeight * initialScale);
          
          // Ensure dimensions are not too small
          const minDimension = 300;
          if (initialWidth < minDimension && initialHeight < minDimension) {
            const scaleFactor = minDimension / Math.min(initialWidth, initialHeight);
            initialWidth = Math.round(initialWidth * scaleFactor);
            initialHeight = Math.round(initialHeight * scaleFactor);
          }
        }
        
        // First attempt with calculated dimensions and high quality
        try {
          const initialResult = await imageCompression(file, {
            maxSizeMB: targetSizeKb / 1024,
            maxWidthOrHeight: Math.max(initialWidth, initialHeight),
            useWebWorker: true,
            quality: 0.8, // Start with good quality
            initialQuality: 0.8
          });
          
          // If we're already close to target size, we can return this result
          if (Math.abs(initialResult.size - targetSizeBytes) / targetSizeBytes < 0.1) {
            return resolve(initialResult);
          }
          
          // Binary search for optimal quality with our reduced dimensions
          let minQuality = 0.3; // Don't go too low with quality initially
          let maxQuality = 0.9;
          let bestResult: { blob: Blob; quality: number; dimensions: {width: number, height: number} } = {
            blob: initialResult,
            quality: 0.8,
            dimensions: {width: initialWidth, height: initialHeight}
          };
          let attempts = 0;
          const maxAttempts = 5; // Fewer attempts since we're doing a multi-stage approach
          
          // Binary search for the optimal quality setting
          while (attempts < maxAttempts) {
            const quality = (minQuality + maxQuality) / 2;
            
            try {
              const result = await imageCompression(file, {
                maxSizeMB: targetSizeKb / 1024,
                maxWidthOrHeight: Math.max(initialWidth, initialHeight),
                useWebWorker: true,
                quality: quality,
                initialQuality: quality
              });

              // Update best result if this is closer to target size
              if (Math.abs(result.size - targetSizeBytes) < Math.abs(bestResult.blob.size - targetSizeBytes)) {
                bestResult = { 
                  blob: result, 
                  quality, 
                  dimensions: {width: initialWidth, height: initialHeight} 
                };
              }

              // Adjust quality range based on result
              if (result.size > targetSizeBytes) {
                maxQuality = quality;
              } else {
                minQuality = quality;
              }

              // If we're within 5% of target size, we can stop
              if (Math.abs(result.size - targetSizeBytes) / targetSizeBytes < 0.05) {
                break;
              }
            } catch (error) {
              console.error('Compression attempt failed:', error);
              break;
            }

            attempts++;
          }
          
          // If we still haven't reached target size, try further dimension reduction
          if (bestResult.blob.size > targetSizeBytes * 1.1) {
            // Calculate a more aggressive scale based on current result vs target
            const scale = Math.sqrt(targetSizeBytes / bestResult.blob.size) * 0.95; // Slightly more aggressive
            const newWidth = Math.round(bestResult.dimensions.width * scale);
            const newHeight = Math.round(bestResult.dimensions.height * scale);

            try {
              const finalResult = await imageCompression(file, {
                maxSizeMB: targetSizeKb / 1024,
                maxWidthOrHeight: Math.max(newWidth, newHeight),
                useWebWorker: true,
                quality: bestResult.quality,
                initialQuality: bestResult.quality
              });
              bestResult.blob = finalResult;
            } catch (error) {
              console.error('Final compression attempt failed:', error);
            }
          }

          resolve(bestResult.blob);
        } catch (error) {
          console.error('Initial compression attempt failed:', error);
          // Fallback to original algorithm if our enhanced approach fails
          try {
            const fallbackResult = await imageCompression(file, {
              maxSizeMB: targetSizeKb / 1024,
              useWebWorker: true
            });
            resolve(fallbackResult);
          } catch (fallbackError) {
            reject(fallbackError);
          }
        }
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
          let compressedFile;
          
          if (compressionMode === 'target') {
            compressedFile = await compressToTargetSize(image.original, targetSize);
          } else {
            compressedFile = await imageCompression(image.original, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true
            });
          }

          // Get dimensions of compressed image
          const img = new Image();
          const compressedUrl = URL.createObjectURL(compressedFile);
          
          return new Promise<ProcessedImage>((resolve) => {
            img.onload = () => {
              resolve({
                ...image,
                processed: compressedFile,
                preview: compressedUrl,
                processedSize: compressedFile.size,
                dimensions: {
                  width: img.width,
                  height: img.height
                }
              });
            };
            img.src = compressedUrl;
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
    link.download = `compressed-image-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getCompressionRatio = (original: number, compressed: number): string => {
    const ratio = ((original - compressed) / original * 100).toFixed(1);
    return `${ratio}%`;
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Compress Image</h1>
          
          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="auto"
                  checked={compressionMode === 'auto'}
                  onChange={(e) => setCompressionMode(e.target.value as 'auto')}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2">Auto Compression</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="target"
                  checked={compressionMode === 'target'}
                  onChange={(e) => setCompressionMode(e.target.value as 'target')}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2">Target Size</span>
              </label>
            </div>

            {compressionMode === 'target' && (
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={targetSize}
                  onChange={(e) => setTargetSize(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
                <span className="text-gray-600">KB</span>
              </div>
            )}
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
                        <>
                          <p>Compressed: {formatFileSize(image.processedSize!)}</p>
                          <p className="text-green-600">
                            Reduced by {getCompressionRatio(image.size!, image.processedSize!)}
                          </p>
                        </>
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
                {processing ? 'Processing...' : 'Compress Images'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}