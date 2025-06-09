import React, { useState, useEffect } from 'react';
import Summary from './components/Summary';
import Chat from './components/Chat';
import Navigation from './components/Navigation';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { getVideoSummary } from '../utils/api';
import { getStoredSummary } from '../utils/storage';

type ActiveTab = 'summary' | 'chat';

const App: React.FC = () => {
  const [summary, setSummary] = useState<string>('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');
  const [transcriptLoading, setTranscriptLoading] = useState<boolean>(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState<boolean>(false);

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setLoading(true);
        chrome.runtime.sendMessage(
          { type: 'GET_VIDEO_DATA' }, 
          async (response) => {
            if (response.videoId) {
              setVideoId(response.videoId);
              setVideoTitle(response.videoTitle);
              setTranscript(response.transcript);
              
              // Show success banner if transcript is available
              if (response.transcript) {
                setShowSuccessBanner(true);
                console.log('Transcript available, generating summary...');
                fetchSummary(response.videoId, response.videoTitle, response.transcript);
              } else {
                console.log('No transcript initially available, will try to load...');
                // Still generate summary but show warning
                fetchSummary(response.videoId, response.videoTitle, null);
              }
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

  const handleSummaryCleared = async () => {
    if (!videoId) return;
    
    // Regenerate summary after clearing
    setSummary('');
    setLoading(true);
    
    try {
      const summaryText = await getVideoSummary(videoId, videoTitle, transcript);
      setSummary(summaryText);
      setError(null);
    } catch (error) {
      setError('Failed to regenerate summary');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTranscript = () => {
    setTranscriptLoading(true);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { 
          type: 'OPEN_TRANSCRIPT' 
        });
        
        // Wait a moment then try to get transcript again
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, { 
            type: 'GET_VIDEO_DETAILS' 
          }, (response) => {
            if (response?.transcript) {
              setTranscript(response.transcript);
              setShowSuccessBanner(true);
              console.log('Transcript loaded after manual open');
            }
            setTranscriptLoading(false);
          });
        }, 2000);
      }
    });
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
              <p className="text-sm text-yellow-200 font-medium">
                {transcriptLoading ? 'Loading transcript...' : 'Transcript not available'}
              </p>
              <p className="text-xs text-yellow-300/80 mt-1">
                {transcriptLoading 
                  ? 'Please wait while we load the transcript data.'
                  : 'Summary may be limited without transcript data.'
                }
              </p>
              {!transcriptLoading && (
                <button 
                  onClick={handleOpenTranscript}
                  className="mt-2 px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 rounded-md text-xs text-yellow-200 transition-colors duration-200"
                >
                  Try Loading Transcript
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success message for transcript with close button */}
      {transcript && showSuccessBanner && (
        <div className="mx-4 mt-4 p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg animate-fade-in">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-green-200 font-medium">Transcript loaded successfully</p>
              <p className="text-xs text-green-300/80 mt-1">
                Enhanced summary and chat available with full transcript data.
              </p>
            </div>
            <button
              onClick={() => setShowSuccessBanner(false)}
              className="p-1 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded transition-colors duration-200"
              title="Close notification"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'summary' ? (
          <Summary 
            text={summary} 
            videoId={videoId}
            onSummaryCleared={handleSummaryCleared}
          />
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