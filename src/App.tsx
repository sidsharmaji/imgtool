import React from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { tools } from './data/tools';
import { Image } from 'lucide-react';
import { CompressImage } from './pages/CompressImage';
import { ConvertFormat } from './pages/ConvertFormat';
import { ResizeImage } from './pages/ResizeImage';
import { CropImage } from './pages/CropImage';
import { RotateFlip } from './pages/RotateFlip';
import { WatermarkImage } from './pages/WatermarkImage';
import { ConvertToPDF } from './pages/ConvertToPDF';
import { CompressPDF } from './pages/CompressPDF';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center">
          <Image className="w-8 h-8 text-blue-500 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">ImageMaster</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => navigate(`/${tool.id}`)}
              className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-blue-100"
            >
              <div className={`p-4 rounded-full ${tool.color} mb-4`}>
                {React.createElement(tool.icon as any, { className: "w-8 h-8 text-white" })}
              </div>
              <h3 className="text-lg font-semibold mb-2">{tool.name}</h3>
              <p className="text-gray-600 text-sm text-center">{tool.description}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/compress" element={<CompressImage />} />
        <Route path="/convert" element={<ConvertFormat />} />
        <Route path="/resize" element={<ResizeImage />} />
        <Route path="/crop" element={<CropImage />} />
        <Route path="/rotate" element={<RotateFlip />} />
        <Route path="/watermark" element={<WatermarkImage />} />
        <Route path="/pdf" element={<ConvertToPDF />} />
        <Route path="/compress-pdf" element={<CompressPDF />} />
      </Routes>
    </Router>
  );
}

export default App;
