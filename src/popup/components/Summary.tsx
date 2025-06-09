import React from 'react';
import { removeSummary } from '../../utils/storage';

interface SummaryProps {
  text: string;
  videoId?: string;
  onSummaryCleared?: () => void;
}

const Summary: React.FC<SummaryProps> = ({ text, videoId, onSummaryCleared }) => {
  const handleClearSummary = async () => {
    if (!videoId) return;
    
    try {
      await removeSummary(videoId);
      console.log('Cleared summary for video:', videoId);
      if (onSummaryCleared) {
        onSummaryCleared();
      }
    } catch (error) {
      console.error('Error clearing summary:', error);
    }
  };

  if (!text) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white animate-pulse-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-400">Generating summary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      <div className="h-full bg-dark-800/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Video Summary</h3>
              <p className="text-xs text-gray-400">Cached • Auto-saved</p>
            </div>
          </div>
          
          {videoId && (
            <button
              onClick={handleClearSummary}
              className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-all duration-200"
              title="Clear cached summary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Summary;