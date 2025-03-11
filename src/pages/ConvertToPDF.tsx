import React, { useState } from 'react';
import { ImageDropzone } from '../components/ImageDropzone';
import { ProcessedImage } from '../types';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';

export function ConvertToPDF() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pageSize, setPageSize] = useState<'a4' | 'letter'>('a4');

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

  const generatePDF = async () => {
    if (images.length === 0) return;

    setProcessing(true);
    try {
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: pageSize
      });

      for (let i = 0; i < images.length; i++) {
        if (i > 0) pdf.addPage();

        const image = images[i];
        const img = new Image();
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Calculate scaling to fit the page while maintaining aspect ratio
            const imgRatio = img.width / img.height;
            const pageRatio = pageWidth / pageHeight;
            
            let finalWidth = pageWidth;
            let finalHeight = pageWidth / imgRatio;

            if (finalHeight > pageHeight) {
              finalHeight = pageHeight;
              finalWidth = pageHeight * imgRatio;
            }

            // Center the image on the page
            const x = (pageWidth - finalWidth) / 2;
            const y = (pageHeight - finalHeight) / 2;

            pdf.addImage(img, 'JPEG', x, y, finalWidth, finalHeight, undefined, 'FAST');
            resolve();
          };
          img.onerror = reject;
          img.src = image.preview;
        });
      }

      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'converted-images.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
    setProcessing(false);
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Convert to PDF</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Size
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as 'a4' | 'letter')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orientation
              </label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
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
                      <p>Size: {formatFileSize(image.size!)}</p>
                      <p>
                        {image.dimensions?.width} × {image.dimensions?.height} px
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={generatePDF}
                disabled={processing}
                className={`mt-6 px-6 py-3 rounded-lg text-white font-medium
                  ${processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
              >
                {processing ? 'Generating PDF...' : 'Generate PDF'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}