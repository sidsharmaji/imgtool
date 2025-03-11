import React from 'react';
import { Tool } from '../types';
import * as Icons from 'lucide-react';

interface ToolCardProps {
  tool: Tool;
  selected?: boolean;
  onClick: () => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, selected, onClick }) => {
  const IconComponent = Icons[tool.icon as keyof typeof Icons];

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${
        selected 
          ? 'border-blue-500 ring-2 ring-blue-200' 
          : 'border-gray-100 hover:border-blue-100'
      }`}
    >
      <div className={`p-4 rounded-full ${tool.color} mb-4`}>
        <IconComponent className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{tool.name}</h3>
      <p className="text-gray-600 text-sm text-center">{tool.description}</p>
    </button>
  );
}