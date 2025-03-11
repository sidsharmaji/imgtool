import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { ImageDropzone } from '../components/ImageDropzone';
import { ProcessedImage } from '../types';

export function CropImage() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [crop, setCrop] = useState<Crop>({ unit: '%', width: 50, height: 50, x: 25, y: 25 });
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const cropPresets = [
    { id: 'free', name: 'Free Selection', aspect: undefined },
    { id: 'square', name: 'Square (1:1)', aspect: 1 },
    { id: 'instagram-portrait', name: 'Instagram Portrait (4:5)', aspect: 4/5 },
    { id: 'instagram-landscape', name: 'Instagram Landscape (1.91:1)', aspect: 1.91 },
    { id: 'instagram-story', name: 'Instagram Story (9:16)', aspect: 9/16 },
    { id: 'facebook-cover', name: 'Facebook Cover (2.63:1)', aspect: 2.63 },
    { id: 'twitter-post', name: 'Twitter Post (16:9)', aspect: 16/9 },
    { id: 'linkedin-share', name: 'LinkedIn Share (1.91:1)', aspect: 1.91 },
    { id: 'youtube-thumbnail', name: 'YouTube Thumbnail (16:9)', aspect: 16/9 }
  ];

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = cropPresets.find(p => p.id === presetId);
    if (preset) {
      setCrop(c => ({ ...c, aspect: preset.aspect }));
    }
  };
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

  const processImage = async (image: ProcessedImage) => {
    if (!image.preview) return null;

    const img = new Image();
    img.src = image.preview;

    return new Promise<ProcessedImage>((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Calculate crop dimensions in pixels
        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;

        const cropX = crop.x! * scaleX;
        const cropY = crop.y! * scaleY;
        const cropWidth = crop.width! * scaleX;
        const cropHeight = crop.height! * scaleY;

        canvas.width = cropWidth;
        canvas.height = cropHeight;

        // Use high-quality image scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) return;

            const croppedUrl = URL.createObjectURL(blob);
            resolve({
              ...image,
              processed: blob,
              preview: croppedUrl,
              processedSize: blob.size,
              dimensions: {
                width: cropWidth,
                height: cropHeight
              }
            });
          },
          'image/jpeg',
          0.92
        );
      };
    });
  };

  const processImages = async () => {
    if (images.length === 0) return;

    setProcessing(true);
    try {
      const processedImages = [...images];
      const processedImage = await processImage(images[currentImageIndex]);
      if (processedImage) {
        processedImages[currentImageIndex] = processedImage;
        setImages(processedImages);
      }
    } catch (error) {
      console.error('Error processing images:', error);
    }
    setProcessing(false);
  };

  const downloadImage = (image: ProcessedImage, index: number) => {
    if (!image.processed) return;
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(image.processed);
    link.download = `cropped-image-${index + 1}.jpg`;
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Crop Image</h1>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Crop Preset</label>
            <select
              value={selectedPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {cropPresets.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>

          <ImageDropzone onImageDrop={handleImageDrop} />

          {images.length > 0 && (
            <div className="mt-8">
              <div className="mb-6">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  aspect={undefined}
                >
                  <img
                    src={images[currentImageIndex].preview}
                    alt="Crop preview"
                    className="max-w-full"
                  />
                </ReactCrop>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`relative bg-gray-50 rounded-lg p-4 cursor-pointer ${index === currentImageIndex ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg mb-2"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImages(images.filter((_, i) => i !== index));
                      }}
                      className="absolute top-6 right-6 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      ×
                    </button>
                    <div className="space-y-1 text-sm">
                      <p>Original: {formatFileSize(image.size!)}</p>
                      {image.processed && (
                        <p>Cropped: {formatFileSize(image.processedSize!)}</p>
                      )}
                      <p>
                        {image.dimensions?.width} × {image.dimensions?.height} px
                      </p>
                    </div>
                    {image.processed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(image, index);
                        }}
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
                {processing ? 'Processing...' : 'Crop Image'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}