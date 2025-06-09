import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { chatWithVideo } from '../../utils/api';
import { getStoredChat, storeChat, removeChat, getStorageData } from '../../utils/storage';

interface ChatProps {
  videoId: string;
  videoTitle: string;
  transcript: string | null;
}

interface Message {
  role: string;
  content: string;
}

interface StoredChatItem {
  videoId: string;
  videoTitle: string;
  messages: Message[];
  timestamp: number;
}

const Chat: React.FC<ChatProps> = ({ videoId, videoTitle, transcript }) => {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<StoredChatItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<StoredChatItem | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  useEffect(() => {
    loadChatHistory();
  }, []);

  // Load chat history when component mounts or videoId changes
  useEffect(() => {
    if (!selectedChat) {
      const loadCurrentChat = async () => {
        setIsLoadingHistory(true);
        try {
          const storedChat = await getStoredChat(videoId);
          if (storedChat) {
            setConversation(storedChat);
            console.log('Loaded chat history for video:', videoId);
          } else {
            setConversation([]);
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
          setConversation([]);
        } finally {
          setIsLoadingHistory(false);
        }
      };

      loadCurrentChat();
    }
  }, [videoId, selectedChat]);

  const loadChatHistory = async () => {
    try {
      const data = await getStorageData();
      const chats = Object.values(data.chats)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10); // Show last 10 chats
      setChatHistory(chats);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || selectedChat) return;

    const userMessage: Message = { role: 'user', content: message };
    const updatedConversation = [...conversation, userMessage];
    
    setConversation(updatedConversation);
    setMessage('');
    setIsLoading(true);

    try {
      const aiResponse = await chatWithVideo(
        videoId,
        videoTitle,
        transcript,
        updatedConversation
      );
      
      const finalConversation = [...updatedConversation, { role: 'model', content: aiResponse }];
      setConversation(finalConversation);
    } catch (error) {
      console.error('Chat error:', error);
      setConversation(prev => [...prev, { 
        role: 'model', 
        content: "I'm having trouble answering that. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      if (selectedChat) {
        // Remove from storage and refresh history
        await removeChat(selectedChat.videoId);
        await loadChatHistory();
        setSelectedChat(null);
        setConversation([]);
      } else {
        await removeChat(videoId);
        setConversation([]);
      }
      console.log('Cleared chat history');
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  const handleSelectHistoryChat = (chat: StoredChatItem) => {
    setSelectedChat(chat);
    setConversation(chat.messages);
    setShowHistory(false);
  };

  const handleBackToCurrent = () => {
    setSelectedChat(null);
    // Reload current chat
    const loadCurrentChat = async () => {
      const storedChat = await getStoredChat(videoId);
      setConversation(storedChat || []);
    };
    loadCurrentChat();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (isLoadingHistory && !selectedChat) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">Loading chat history...</p>
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
                <h3 className="text-lg font-semibold text-white">Chat History</h3>
                <p className="text-xs text-gray-400">{chatHistory.length} saved conversations</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowHistory(false)}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200"
            >
              Back
            </button>
          </div>

          {chatHistory.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-500/20 to-gray-700/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">No saved conversations yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chatHistory.map((chat) => (
                <div
                  key={chat.videoId}
                  onClick={() => handleSelectHistoryChat(chat)}
                  className="p-4 bg-dark-700/50 hover:bg-dark-700/70 border border-white/10 hover:border-white/20 rounded-lg cursor-pointer transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate group-hover:text-primary-300">
                        {chat.videoTitle}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(chat.timestamp).toLocaleDateString()} • {chat.messages.length} messages
                      </p>
                      {chat.messages.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          Last: {chat.messages[chat.messages.length - 1].content.substring(0, 50)}...
                        </p>
                      )}
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
    <div className="p-6 h-full flex flex-col">
      <div className="flex-1 bg-dark-800/30 backdrop-blur-sm border border-white/10 rounded-xl flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {selectedChat ? 'Saved Chat' : 'AI Chat'}
                </h3>
                {conversation.length > 0 && (
                  <p className="text-xs text-gray-400">
                    {conversation.length} messages • 
                    {selectedChat ? 
                      ` ${new Date(selectedChat.timestamp).toLocaleDateString()}` : 
                      ' Cached'
                    }
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {selectedChat && (
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
                title="View chat history"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              {conversation.length > 0 && (
                <button
                  onClick={handleClearChat}
                  className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-all duration-200"
                  title="Clear chat history"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto scrollbar-thin space-y-4">
          {conversation.length === 0 && !selectedChat && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500/20 to-primary-700/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-400\" fill="none\" stroke="currentColor\" viewBox="0 0 24 24">
                  <path strokeLinecap="round\" strokeLinejoin="round\" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">Ask me anything about this video!</p>
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => setMessage("What are the main points discussed in this video?")}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-300 bg-white/5 hover:bg-white/10 rounded-lg transition-colors duration-200"
                >
                  What are the main points discussed?
                </button>
                <button
                  onClick={() => setMessage("Can you explain the key concepts mentioned?")}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-300 bg-white/5 hover:bg-white/10 rounded-lg transition-colors duration-200"
                >
                  Explain the key concepts
                </button>
              </div>
            </div>
          )}

          {conversation.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/25'
                    : 'bg-dark-700/50 text-gray-200 border border-white/10'
                } ${msg.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'}`}
              >
                <div className="text-sm leading-relaxed prose prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                      li: ({ children }) => <li className="ml-4 list-disc text-gray-300">{children}</li>,
                      code: ({ children }) => <code className="bg-dark-600 text-primary-300 px-1 py-0.5 rounded text-xs">{children}</code>,
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-slide-up">
              <div className="bg-dark-700/50 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-400">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form - Only show for current chat, not historical ones */}
        {!selectedChat && (
          <div className="p-4 border-t border-white/10">
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <div className="flex-1 relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  placeholder="Ask about this video..."
                  rows={1}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !message.trim()}
                className="px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25 disabled:shadow-none"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;