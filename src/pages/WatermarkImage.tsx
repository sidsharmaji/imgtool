import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ImageDropzone } from '../components/ImageDropzone';
import { ProcessedImage } from '../types';

interface WatermarkOptions {
  type: 'text' | 'image';
  text: string;
  textColor: string;
  fontSize: number;
  opacity: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  padding: number;
  imageFile?: File;
}

export function WatermarkImage() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [watermarkOptions, setWatermarkOptions] = useState<WatermarkOptions>({
    type: 'text',
    text: 'Watermark',
    textColor: '#ffffff',
    fontSize: 24,
    opacity: 0.5,
    position: 'bottom-right',
    padding: 20
  });

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
              canvas.width = img.width;
              canvas.height = img.height;
              
              // Draw the original image
              ctx.drawImage(img, 0, 0);
              
              // Apply watermark
              ctx.globalAlpha = watermarkOptions.opacity;
              
              if (watermarkOptions.type === 'text') {
                // Configure text watermark
                ctx.font = `${watermarkOptions.fontSize}px Arial`;
                ctx.fillStyle = watermarkOptions.textColor;
                
                const textMetrics = ctx.measureText(watermarkOptions.text);
                const textWidth = textMetrics.width;
                const textHeight = watermarkOptions.fontSize;
                
                // Calculate position
                let x = watermarkOptions.padding;
                let y = watermarkOptions.padding + textHeight;
                
                switch (watermarkOptions.position) {
                  case 'top-right':
                    x = canvas.width - textWidth - watermarkOptions.padding;
                    break;
                  case 'bottom-left':
                    y = canvas.height - watermarkOptions.padding;
                    break;
                  case 'bottom-right':
                    x = canvas.width - textWidth - watermarkOptions.padding;
                    y = canvas.height - watermarkOptions.padding;
                    break;
                  case 'center':
                    x = (canvas.width - textWidth) / 2;
                    y = (canvas.height + textHeight) / 2;
                    break;
                }
                
                ctx.fillText(watermarkOptions.text, x, y);
              } else if (watermarkOptions.imageFile) {
                // Handle image watermark
                const watermarkImg = new Image();
                watermarkImg.src = URL.createObjectURL(watermarkOptions.imageFile);
                
                return new Promise<void>((resolveWatermark) => {
                  watermarkImg.onload = () => {
                    const maxSize = 200; // Maximum size for watermark image
                    const scale = Math.min(1, maxSize / Math.max(watermarkImg.width, watermarkImg.height));
                    const width = watermarkImg.width * scale;
                    const height = watermarkImg.height * scale;
                    
                    // Calculate position
                    let x = watermarkOptions.padding;
                    let y = watermarkOptions.padding;
                    
                    switch (watermarkOptions.position) {
                      case 'top-right':
                        x = canvas.width - width - watermarkOptions.padding;
                        break;
                      case 'bottom-left':
                        y = canvas.height - height - watermarkOptions.padding;
                        break;
                      case 'bottom-right':
                        x = canvas.width - width - watermarkOptions.padding;
                        y = canvas.height - height - watermarkOptions.padding;
                        break;
                      case 'center':
                        x = (canvas.width - width) / 2;
                        y = (canvas.height - height) / 2;
                        break;
                    }
                    
                    ctx.drawImage(watermarkImg, x, y, width, height);
                    resolveWatermark();
                  };
                }).then(() => {
                  // Reset global alpha
                  ctx.globalAlpha = 1;
                  
                  // Convert to blob
                  canvas.toBlob(
                    (blob) => {
                      if (!blob) return;
                      
                      const watermarkedUrl = URL.createObjectURL(blob);
                      resolve({
                        ...image,
                        processed: blob,
                        preview: watermarkedUrl,
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
                });
              }
              
              // Reset global alpha
              ctx.globalAlpha = 1;
              
              // Convert to blob
              canvas.toBlob(
                (blob) => {
                  if (!blob) return;
                  
                  const watermarkedUrl = URL.createObjectURL(blob);
                  resolve({
                    ...image,
                    processed: blob,
                    preview: watermarkedUrl,
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
    link.download = `watermarked-image-${index + 1}.jpg`;
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Watermark</h1>
          
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Watermark Type
                  </label>
                  <select
                    value={watermarkOptions.type}
                    onChange={(e) => setWatermarkOptions({
                      ...watermarkOptions,
                      type: e.target.value as 'text' | 'image'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="text">Text</option>
                    <option value="image">Image</option>
                  </select>
                </div>

                {watermarkOptions.type === 'text' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Watermark Text
                      </label>
                      <input
                        type="text"
                        value={watermarkOptions.text}
                        onChange={(e) => setWatermarkOptions({
                          ...watermarkOptions,
                          text: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text Color
                      </label>
                      <input
                        type="color"
                        value={watermarkOptions.textColor}
                        onChange={(e) => setWatermarkOptions({
                          ...watermarkOptions,
                          textColor: e.target.value
                        })}
                        className="w-full h-10 p-1 rounded-md cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Font Size
                      </label>
                      <input
                        type="range"
                        min="12"
                        max="72"
                        value={watermarkOptions.fontSize}
                        onChange={(e) => setWatermarkOptions({
                          ...watermarkOptions,
                          fontSize: parseInt(e.target.value)
                        })}
                        className="w-full"
                      />
                      <div className="text-sm text-gray-500 mt-1">
                        {watermarkOptions.fontSize}px
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Watermark Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setWatermarkOptions({
                            ...watermarkOptions,
                            imageFile: file
                          });
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opacity
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={watermarkOptions.opacity * 100}
                    onChange={(e) => setWatermarkOptions({
                      ...watermarkOptions,
                      opacity: parseInt(e.target.value) / 100
                    })}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    {Math.round(watermarkOptions.opacity * 100)}%
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <select
                    value={watermarkOptions.position}
                    onChange={(e) => setWatermarkOptions({
                      ...watermarkOptions,
                      position: e.target.value as WatermarkOptions['position']
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="center">Center</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Padding
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={watermarkOptions.padding}
                    onChange={(e) => setWatermarkOptions({
                      ...watermarkOptions,
                      padding: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    {watermarkOptions.padding}px
                  </div>
                </div>
              </div>

              <div>
                <ImageDropzone onImageDrop={handleImageDrop} />
              </div>
            </div>
          </div>

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

              <button
                onClick={processImages}
                disabled={processing}
                className={`mt-6 px-6 py-3 rounded-lg text-white font-medium
                  ${processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
              >
                {processing ? 'Processing...' : 'Add Watermark'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
