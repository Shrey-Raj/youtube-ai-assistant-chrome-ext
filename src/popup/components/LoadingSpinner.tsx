import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 animate-fade-in">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-dark-700 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Loading Video Data</h3>
        <p className="text-gray-400 text-sm">Analyzing YouTube video...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;