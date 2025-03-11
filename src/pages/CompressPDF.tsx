import React, { useState } from 'react';
import { ImageDropzone } from '../components/ImageDropzone';
import { ProcessedImage } from '../types';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';

export function CompressPDF() {
  const [pdfs, setPdfs] = useState<ProcessedImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [compressionMode, setCompressionMode] = useState<'level' | 'target'>('level');
  const [compressionLevel, setCompressionLevel] = useState<'high' | 'medium' | 'low'>('medium');
  const [targetSize, setTargetSize] = useState<number>(500);

  const handlePDFDrop = async (files: File[]) => {
    const newPdfs = await Promise.all(
      files.map(async (file) => {
        if (!file.type.includes('pdf')) {
          console.error('Invalid file type:', file.type);
          return null;
        }

        return {
          original: file,
          preview: URL.createObjectURL(file),
          size: file.size,
          name: file.name,
          type: file.type,
          dimensions: undefined,
          processed: undefined,
          processedSize: undefined
        } as ProcessedImage;
      })
    );

    setPdfs([...pdfs, ...newPdfs.filter((pdf): pdf is ProcessedImage => pdf !== null)]);
  };

  const compressPDF = async (file: File, level: 'high' | 'medium' | 'low'): Promise<Blob> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // Compression settings based on level
    const compressionSettings = {
      high: { useObjectStreams: true },
      medium: { useObjectStreams: true },
      low: { useObjectStreams: false }
    }[level];

    // Compress each page
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      const { width, height } = page.getSize();
      page.setSize(width, height);
    }

    // Save with enhanced compression
    const compressedPdfBytes = await pdfDoc.save({
      addDefaultPage: false,
      objectsPerTick: 50,
      updateFieldAppearances: false,
      ...compressionSettings
    });

    return new Blob([compressedPdfBytes], { type: 'application/pdf' });
  };

  const compressPDFToTargetSize = async (file: File, targetSizeKb: number): Promise<Blob> => {
    const targetSizeBytes = targetSizeKb * 1024;
    const originalSize = file.size;
    
    // If the file is already smaller than target size, return it as is
    if (originalSize <= targetSizeBytes) {
      return file.slice();
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    
    // Set page sizes
    for (const page of pages) {
      const { width, height } = page.getSize();
      page.setSize(width, height);
    }
    
    // Binary search for the optimal quality level
    let minQuality = 0.1;
    let maxQuality = 1.0;
    let bestResult: Blob | null = null;
    let bestSizeDiff = Infinity;
    let attempts = 0;
    const maxAttempts = 8;
    
    while (attempts < maxAttempts) {
      const quality = (minQuality + maxQuality) / 2;
      
      const compressedPdfBytes = await pdfDoc.save({
        useObjectStreams: quality < 0.5,
        addDefaultPage: false,
        objectsPerTick: 50,
        updateFieldAppearances: false
      });
      
      const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
      const sizeDiff = Math.abs(blob.size - targetSizeBytes);
      
      // Keep track of the best result so far
      if (sizeDiff < bestSizeDiff) {
        bestSizeDiff = sizeDiff;
        bestResult = blob;
        
        // If we're within 5% of target size, we can stop
        if (sizeDiff / targetSizeBytes < 0.05) {
          break;
        }
      }
      
      // Adjust quality range based on result
      if (blob.size > targetSizeBytes) {
        maxQuality = quality; // Need higher compression (lower quality)
      } else {
        minQuality = quality; // Can try lower compression (higher quality)
      }
      
      attempts++;
    }
    
    // If we couldn't get close enough to target size, use the best result we found
    return bestResult || new Blob([await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
      updateFieldAppearances: false
    })], { type: 'application/pdf' });
};

  const processPDFs = async () => {
    if (pdfs.length === 0) return;

    setProcessing(true);
    try {
      const processedPdfs = await Promise.all(
        pdfs.map(async (pdf) => {
          let compressedFile;
          
          if (compressionMode === 'target') {
            compressedFile = await compressPDFToTargetSize(pdf.original, targetSize);
          } else {
            compressedFile = await compressPDF(pdf.original, compressionLevel);
          }
          
          const compressedUrl = URL.createObjectURL(compressedFile);

          return {
            ...pdf,
            processed: compressedFile,
            preview: compressedUrl,
            processedSize: compressedFile.size
          };
        })
      );
      setPdfs(processedPdfs);
    } catch (error) {
      console.error('Error processing PDFs:', error);
    }
    setProcessing(false);
  };

  const downloadPDF = (pdf: ProcessedImage) => {
    if (!pdf.processed) return;
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(pdf.processed);
    link.download = `compressed-${pdf.name}`;
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Compress PDF</h1>
          
          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="level"
                  checked={compressionMode === 'level'}
                  onChange={(e) => setCompressionMode(e.target.value as 'level')}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2">Compression Level</span>
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

            {compressionMode === 'level' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compression Level
                </label>
                <select
                  value={compressionLevel}
                  onChange={(e) => setCompressionLevel(e.target.value as 'high' | 'medium' | 'low')}
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="high">High Compression (Smaller Size)</option>
                  <option value="medium">Medium Compression (Balanced)</option>
                  <option value="low">Low Compression (Better Quality)</option>
                </select>
              </div>
            ) : (
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
          
          <ImageDropzone onImageDrop={handlePDFDrop} accept={{ 'application/pdf': ['.pdf'] }} />

          {pdfs.length > 0 && (
            <div className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pdfs.map((pdf, index) => (
                  <div key={index} className="relative bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <svg
                        className="w-8 h-8 text-red-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm font-medium truncate">{pdf.name}</span>
                    </div>
                    <button
                      onClick={() => setPdfs(pdfs.filter((_, i) => i !== index))}
                      className="absolute top-4 right-4 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      ×
                    </button>
                    <div className="space-y-1 text-sm">
                      <p>Size: {formatFileSize(pdf.size!)}</p>
                      {pdf.processedSize && (
                        <>
                          <p>Compressed: {formatFileSize(pdf.processedSize)}</p>
                          <p className="text-green-600">
                            Reduced by {((pdf.size! - pdf.processedSize) / pdf.size! * 100).toFixed(1)}%
                          </p>
                          <button
                            onClick={() => downloadPDF(pdf)}
                            className="mt-2 w-full bg-green-500 text-white px-3 py-1.5 rounded text-sm hover:bg-green-600"
                          >
                            Download
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={processPDFs}
                disabled={processing}
                className={`mt-6 px-6 py-3 rounded-lg text-white font-medium
                  ${processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
              >
                {processing ? 'Compressing...' : 'Compress PDFs'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}