import { Minimize2, FileOutput, Maximize, Crop, RotateCcw, Shield, FileText, FileMinus2 } from 'lucide-react';

export const tools = [
  {
    id: 'compress',
    name: 'Compress Image',
    description: 'Reduce image file size while maintaining quality',
    icon: Minimize2,
    color: 'bg-blue-500'
  },
  {
    id: 'convert',
    name: 'Convert Format',
    description: 'Convert images between different formats',
    icon: FileOutput,
    color: 'bg-green-500'
  },
  {
    id: 'resize',
    name: 'Resize Image',
    description: 'Change image dimensions',
    icon: Maximize,
    color: 'bg-purple-500'
  },
  {
    id: 'pdf',
    name: 'Convert to PDF',
    description: 'Convert images into PDF documents',
    icon: FileText,
    color: 'bg-red-500'
  },
  {
    id: 'crop',
    name: 'Crop Image',
    description: 'Crop and adjust image composition',
    icon: Crop,
    color: 'bg-orange-500'
  },
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    description: 'Reduce PDF file size while maintaining quality',
    icon: FileMinus2,
    color: 'bg-indigo-500'
  },
  {
    id: 'rotate',
    name: 'Rotate & Flip',
    description: 'Rotate or flip your images',
    icon: RotateCcw,
    color: 'bg-pink-500'
  },
  {
    id: 'watermark',
    name: 'Add Watermark',
    description: 'Protect your images with watermarks',
    icon: Shield,
    color: 'bg-teal-500'
  }
];