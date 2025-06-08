import React, { useState, useEffect } from 'react';
import Summary from './components/Summary';
import Chat from './components/Chat';
import Navigation from './components/Navigation';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { getVideoSummary } from '../utils/api';

type ActiveTab = 'summary' | 'chat';

const App: React.FC = () => {
  const [summary, setSummary] = useState<string>('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        chrome.runtime.sendMessage(
          { type: 'GET_VIDEO_DATA' }, 
          async (response) => {
            if (response.videoId) {
              setVideoId(response.videoId);
              setVideoTitle(response.videoTitle);
              setTranscript(response.transcript);
              fetchSummary(response.videoId, response.videoTitle, response.transcript);
            } else {
              setError('Please open a YouTube video first');
              setLoading(false);
            }
          }
        );
      } catch (err) {
        setError('Failed to connect to extension');
        setLoading(false);
      }
    };

    fetchVideoData();
  }, []);

  const fetchSummary = async (
    id: string, 
    title: string, 
    transcript: string | null
  ) => {
    try {
      setLoading(true);
      const summaryText = await getVideoSummary(id, title, transcript);
      setSummary(summaryText);
      setError(null);
    } catch (error) {
      setError('Failed to load summary');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTranscript = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { 
          type: 'OPEN_TRANSCRIPT' 
        });
      }
    });
    window.close();
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-6">
        <ErrorMessage 
          message={error} 
          onRetry={() => window.location.reload()} 
        />
      </div>
    );
  }

  if (!videoId) {
    return (
      <div className="h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-6">
        <ErrorMessage message="No YouTube video detected" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex flex-col">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-primary-500/20 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white text-shadow truncate">
              YouTube AI Assistant
            </h1>
            <p className="text-sm text-gray-400 truncate">
              {videoTitle}
            </p>
          </div>
        </div>
      </div>

      {/* Warning for missing transcript */}
      {!transcript && (
        <div className="mx-4 mt-4 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg animate-fade-in">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-yellow-200 font-medium">Transcript not available</p>
              <p className="text-xs text-yellow-300/80 mt-1">Summary may be limited without transcript data.</p>
              <button 
                onClick={handleOpenTranscript}
                className="mt-2 px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 rounded-md text-xs text-yellow-200 transition-colors duration-200"
              >
                Open Transcript
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'summary' ? (
          <Summary text={summary} />
        ) : (
          <Chat 
            videoId={videoId} 
            videoTitle={videoTitle}
            transcript={transcript}
          />
        )}
      </div>
    </div>
  );
};

export default App;