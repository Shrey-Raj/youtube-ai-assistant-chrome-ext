import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { removeSummary, getStorageData } from '../../utils/storage';

interface SummaryProps {
  text: string;
  videoId?: string;
  onSummaryCleared?: () => void;
}

interface StoredSummaryItem {
  videoId: string;
  videoTitle: string;
  summary: string;
  timestamp: number;
}

const Summary: React.FC<SummaryProps> = ({ text, videoId, onSummaryCleared }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [summaryHistory, setSummaryHistory] = useState<StoredSummaryItem[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<StoredSummaryItem | null>(null);

  useEffect(() => {
    loadSummaryHistory();
  }, []);

  const loadSummaryHistory = async () => {
    try {
      const data = await getStorageData();
      const summaries = Object.values(data.summaries)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10); // Show last 10 summaries
      setSummaryHistory(summaries);
    } catch (error) {
      console.error('Error loading summary history:', error);
    }
  };

  const handleClearSummary = async () => {
    if (!videoId) return;
    
    try {
      await removeSummary(videoId);
      console.log('Cleared summary for video:', videoId);
      await loadSummaryHistory(); // Refresh history
      if (onSummaryCleared) {
        onSummaryCleared();
      }
    } catch (error) {
      console.error('Error clearing summary:', error);
    }
  };

  const handleSelectHistorySummary = (summary: StoredSummaryItem) => {
    setSelectedSummary(summary);
    setShowHistory(false);
  };

  const handleBackToCurrent = () => {
    setSelectedSummary(null);
  };

  const currentSummary = selectedSummary || { 
    videoId: videoId || '', 
    videoTitle: 'Current Video', 
    summary: text, 
    timestamp: Date.now() 
  };

  if (!text && !selectedSummary) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white animate-pulse-slow\" fill="none\" stroke="currentColor\" viewBox="0 0 24 24">
              <path strokeLinecap="round\" strokeLinejoin="round\" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-400">Generating summary...</p>
        </div>
      </div>
    );
  }

  if (showHistory) {
    return (
      <div className="p-6 h-full">
        <div className="h-full bg-dark-800/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Summary History</h3>
                <p className="text-xs text-gray-400">{summaryHistory.length} saved summaries</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowHistory(false)}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200"
            >
              Back
            </button>
          </div>

          {summaryHistory.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-500/20 to-gray-700/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">No saved summaries yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {summaryHistory.map((summary) => (
                <div
                  key={summary.videoId}
                  onClick={() => handleSelectHistorySummary(summary)}
                  className="p-4 bg-dark-700/50 hover:bg-dark-700/70 border border-white/10 hover:border-white/20 rounded-lg cursor-pointer transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate group-hover:text-primary-300">
                        {summary.videoTitle}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(summary.timestamp).toLocaleDateString()} • 
                        {summary.summary.length > 100 ? ` ${summary.summary.substring(0, 100)}...` : summary.summary}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-400 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
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
              <h3 className="text-lg font-semibold text-white">
                {selectedSummary ? 'Saved Summary' : 'Video Summary'}
              </h3>
              <p className="text-xs text-gray-400">
                {selectedSummary ? 
                  `${new Date(selectedSummary.timestamp).toLocaleDateString()} • Cached` : 
                  'Cached • Auto-saved'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedSummary && (
              <button
                onClick={handleBackToCurrent}
                className="px-3 py-1.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border border-blue-500/30 hover:border-blue-500/50 rounded-lg transition-all duration-200"
                title="Back to current video"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            
            <button
              onClick={() => setShowHistory(true)}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200"
              title="View summary history"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            {!selectedSummary && videoId && (
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
        </div>
        
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-xl font-bold text-white mb-4">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-semibold text-white mb-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-md font-medium text-white mb-2">{children}</h3>,
              p: ({ children }) => <p className="text-gray-300 leading-relaxed mb-3">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-3 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-3 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-gray-300">{children}</li>,
              strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
              em: ({ children }) => <em className="text-gray-200 italic">{children}</em>,
              code: ({ children }) => <code className="bg-dark-700 text-primary-300 px-1 py-0.5 rounded text-sm">{children}</code>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary-500 pl-4 italic text-gray-300 my-4">
                  {children}
                </blockquote>
              ),
            }}
          >
            {currentSummary.summary}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default Summary;